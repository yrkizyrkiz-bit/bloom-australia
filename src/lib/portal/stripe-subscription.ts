import type Stripe from "stripe";
import type { BillingInterval } from "@prisma/client";
import {
  stripePaymentIntentCanInitializeElements,
  stripePaymentIntentIsSucceeded,
} from "@/lib/checkout/stripe-payment-intent-state";
import { getStripe } from "@/lib/stripe";

export type StripeRecurringSpec = {
  interval: "month" | "year";
  intervalCount: number;
};

export function billingIntervalToStripeRecurring(
  interval: BillingInterval
): StripeRecurringSpec | null {
  switch (interval) {
    case "MONTHLY":
      return { interval: "month", intervalCount: 1 };
    case "QUARTERLY":
      return { interval: "month", intervalCount: 3 };
    case "BIANNUAL":
      return { interval: "month", intervalCount: 6 };
    case "YEARLY":
      return { interval: "year", intervalCount: 1 };
    default:
      return null;
  }
}

/** Resolve Stripe Price id for a catalog BillingPrice row (creates if missing). */
export async function ensureStripePriceForBillingPrice(params: {
  billingPriceId: string;
  amountCents: number;
  billingInterval: BillingInterval;
  productName: string;
  metadata: Record<string, string>;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const recurring = billingIntervalToStripeRecurring(params.billingInterval);
  if (!recurring) {
    throw new Error("Cannot create Stripe price for one-time billing interval");
  }

  return getOrCreateRecurringPrice({
    productName: params.productName,
    productMetadata: { ...params.metadata, billingPriceId: params.billingPriceId },
    amountAud: params.amountCents / 100,
    recurring,
  });
}

/** Create or reuse a Stripe Price for a recurring subscription line item. */
export async function getOrCreateRecurringPrice(params: {
  productName: string;
  productMetadata: Record<string, string>;
  amountAud: number;
  recurring: StripeRecurringSpec;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const amountCents = Math.round(params.amountAud * 100);
  const lookupKey = [
    "portal",
    params.productMetadata.productSlug ||
      params.productMetadata.programKey ||
      params.productMetadata.scope ||
      "item",
    params.productMetadata.billingTerm ?? params.recurring.interval,
    params.productMetadata.billingPriceId || "price",
    String(amountCents),
    params.recurring.interval,
    String(params.recurring.intervalCount),
  ]
    .join("_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 200);

  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  const product = await stripe.products.create({
    name: params.productName,
    metadata: params.productMetadata,
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "aud",
    recurring: {
      interval: params.recurring.interval,
      interval_count: params.recurring.intervalCount,
    },
    lookup_key: lookupKey,
  });

  return price.id;
}

/** Create or reuse a one-time Stripe Price (e.g. checkout add-ons). */
export async function getOrCreateOneTimePrice(params: {
  productName: string;
  productMetadata: Record<string, string>;
  amountAud: number;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const amountCents = Math.round(params.amountAud * 100);
  const lookupKey = [
    "portal_onetime",
    params.productMetadata.scope ?? "addon",
    String(amountCents),
  ].join("_");

  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  const product = await stripe.products.create({
    name: params.productName,
    metadata: params.productMetadata,
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "aud",
    lookup_key: lookupKey,
  });

  return price.id;
}

type InvoicePaymentDetails = {
  clientSecret: string;
  paymentIntentId: string;
};

function paymentIntentIdFromClientSecret(clientSecret: string): string | null {
  const [paymentIntentId] = clientSecret.split("_secret_");
  return paymentIntentId || null;
}

/** Resolve PaymentIntent client secret from a subscription's first invoice (Basil + legacy APIs). */
async function resolveInvoicePaymentDetails(
  stripe: Stripe,
  invoiceRef: string | Stripe.Invoice
): Promise<InvoicePaymentDetails | null> {
  type InvoiceWithPaymentFields = Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
    payment_intent?: Stripe.PaymentIntent | string | null;
    payments?: {
      data?: Array<{
        payment?: {
          payment_intent?: Stripe.PaymentIntent | string | null;
        };
      }>;
    };
  };

  const invoice =
    typeof invoiceRef === "string"
      ? ((await stripe.invoices.retrieve(invoiceRef, {
          expand: [
            "confirmation_secret",
            "payment_intent",
            "payments.data.payment.payment_intent",
          ],
        })) as InvoiceWithPaymentFields)
      : (invoiceRef as InvoiceWithPaymentFields);

  const confirmationSecret = invoice.confirmation_secret?.client_secret;
  if (confirmationSecret) {
    const paymentIntentId = paymentIntentIdFromClientSecret(confirmationSecret);
    if (paymentIntentId) {
      return { clientSecret: confirmationSecret, paymentIntentId };
    }
  }

  const piRaw = invoice.payment_intent;
  const legacyPi =
    typeof piRaw === "string" ? await stripe.paymentIntents.retrieve(piRaw) : piRaw;
  if (legacyPi?.client_secret) {
    return { clientSecret: legacyPi.client_secret, paymentIntentId: legacyPi.id };
  }

  for (const entry of invoice.payments?.data ?? []) {
    const nestedPiRaw = entry.payment?.payment_intent;
    const nestedPi =
      typeof nestedPiRaw === "string"
        ? await stripe.paymentIntents.retrieve(nestedPiRaw)
        : nestedPiRaw;
    if (nestedPi?.client_secret) {
      return { clientSecret: nestedPi.client_secret, paymentIntentId: nestedPi.id };
    }
  }

  return null;
}

export async function createIncompleteSubscription(params: {
  customerId: string;
  items: Array<{ priceId: string }>;
  /** One-time charges added to the first invoice (e.g. retest add-on). */
  addInvoiceItems?: Array<{ priceId: string }>;
  metadata: Record<string, string>;
  description?: string;
}): Promise<{
  subscriptionId: string;
  clientSecret: string;
  paymentIntentId: string;
  paymentIntentStatus: string;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: params.items.map((i) => ({ price: i.priceId })),
    ...(params.addInvoiceItems?.length
      ? {
          add_invoice_items: params.addInvoiceItems.map((i) => ({ price: i.priceId })),
        }
      : {}),
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    expand: ["latest_invoice.confirmation_secret"],
    metadata: params.metadata,
    description: params.description,
  });

  const latestInvoice = subscription.latest_invoice;
  if (!latestInvoice) throw new Error("Could not initialise subscription payment");

  const payment = await resolveInvoicePaymentDetails(stripe, latestInvoice);
  if (!payment) throw new Error("Could not initialise subscription payment");

  const paymentIntent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);

  // Invoice-created PaymentIntents cannot have payment_method_types modified, metadata only.
  if (stripePaymentIntentCanInitializeElements(paymentIntent.status)) {
    await stripe.paymentIntents.update(payment.paymentIntentId, {
      metadata: { ...params.metadata, subscriptionId: subscription.id },
    });
  }

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret || payment.clientSecret,
    paymentIntentId: payment.paymentIntentId,
    paymentIntentStatus: paymentIntent.status,
  };
}

export type MembershipCheckoutPayment = {
  alreadyPaid: boolean;
  subscriptionId: string;
  paymentIntentId: string;
  clientSecret: string | null;
};

function isMembershipSubscription(
  subscription: Stripe.Subscription,
  userId: string
): boolean {
  return (
    subscription.metadata?.purchaseType === "sanative_membership" &&
    subscription.metadata?.userId === userId
  );
}

async function paymentFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<{ clientSecret: string; paymentIntentId: string; status: string } | null> {
  if (!subscription.latest_invoice) return null;
  const payment = await resolveInvoicePaymentDetails(stripe, subscription.latest_invoice);
  if (!payment) return null;
  const paymentIntent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
  return {
    clientSecret: paymentIntent.client_secret || payment.clientSecret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
  };
}

/**
 * Reuse an open membership PaymentIntent, or recognise a just-completed pay,
 * instead of handing Stripe Elements a secret that is already succeeded.
 */
export async function resumeOrCreateMembershipCheckoutPayment(params: {
  customerId: string;
  userId: string;
  stripePriceId: string;
  metadata: Record<string, string>;
  description?: string;
}): Promise<MembershipCheckoutPayment> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const [active, incomplete] = await Promise.all([
    stripe.subscriptions.list({ customer: params.customerId, status: "active", limit: 20 }),
    stripe.subscriptions.list({ customer: params.customerId, status: "incomplete", limit: 20 }),
  ]);

  const activeMembership = active.data.find((sub) => isMembershipSubscription(sub, params.userId));
  if (activeMembership) {
    const payment = await paymentFromSubscription(stripe, activeMembership);
    return {
      alreadyPaid: true,
      subscriptionId: activeMembership.id,
      paymentIntentId: payment?.paymentIntentId || "",
      clientSecret: null,
    };
  }

  for (const subscription of incomplete.data.filter((sub) =>
    isMembershipSubscription(sub, params.userId)
  )) {
    const payment = await paymentFromSubscription(stripe, subscription);
    if (!payment) continue;
    if (stripePaymentIntentIsSucceeded(payment.status)) {
      return {
        alreadyPaid: true,
        subscriptionId: subscription.id,
        paymentIntentId: payment.paymentIntentId,
        clientSecret: null,
      };
    }
    if (stripePaymentIntentCanInitializeElements(payment.status) && payment.clientSecret) {
      return {
        alreadyPaid: false,
        subscriptionId: subscription.id,
        paymentIntentId: payment.paymentIntentId,
        clientSecret: payment.clientSecret,
      };
    }
  }

  const created = await createIncompleteSubscription({
    customerId: params.customerId,
    items: [{ priceId: params.stripePriceId }],
    metadata: params.metadata,
    description: params.description,
  });

  if (stripePaymentIntentIsSucceeded(created.paymentIntentStatus)) {
    return {
      alreadyPaid: true,
      subscriptionId: created.subscriptionId,
      paymentIntentId: created.paymentIntentId,
      clientSecret: null,
    };
  }

  if (
    !stripePaymentIntentCanInitializeElements(created.paymentIntentStatus) ||
    !created.clientSecret
  ) {
    throw new Error("Could not initialise a payable membership invoice");
  }

  return {
    alreadyPaid: false,
    subscriptionId: created.subscriptionId,
    paymentIntentId: created.paymentIntentId,
    clientSecret: created.clientSecret,
  };
}

/** Create an active subscription using the customer's saved payment method. */
export async function createActiveSubscription(params: {
  customerId: string;
  stripePriceId: string;
  metadata: Record<string, string>;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const customer = await stripe.customers.retrieve(params.customerId);
  if (customer.deleted) throw new Error("Customer not found");

  const defaultPm =
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.stripePriceId }],
    ...(defaultPm ? { default_payment_method: defaultPm } : {}),
    metadata: params.metadata,
  });

  return subscription.id;
}
