import type Stripe from "stripe";
import type { BillingInterval } from "@prisma/client";
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
    params.productMetadata.programKey ?? params.productMetadata.scope ?? "item",
    params.productMetadata.billingTerm ?? params.recurring.interval,
    String(amountCents),
    params.recurring.interval,
    String(params.recurring.intervalCount),
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
    recurring: {
      interval: params.recurring.interval,
      interval_count: params.recurring.intervalCount,
    },
    lookup_key: lookupKey,
  });

  return price.id;
}

export async function createIncompleteSubscription(params: {
  customerId: string;
  items: Array<{ priceId: string }>;
  metadata: Record<string, string>;
  description?: string;
}): Promise<{
  subscriptionId: string;
  clientSecret: string;
  paymentIntentId: string;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: params.items.map((i) => ({ price: i.priceId })),
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice"],
    metadata: params.metadata,
    description: params.description,
  });

  const latestInvoice = subscription.latest_invoice;
  const invoiceId =
    typeof latestInvoice === "string" ? latestInvoice : latestInvoice?.id;
  if (!invoiceId) throw new Error("Could not initialise subscription payment");

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["payment_intent"],
  });

  type InvoiceWithPaymentIntent = Stripe.Invoice & {
    payment_intent?: Stripe.PaymentIntent | string | null;
  };
  const piRaw = (invoice as InvoiceWithPaymentIntent).payment_intent;
  const pi =
    typeof piRaw === "string"
      ? await stripe.paymentIntents.retrieve(piRaw)
      : piRaw;
  if (!pi?.client_secret) {
    throw new Error("Could not initialise subscription payment");
  }

  await stripe.paymentIntents.update(pi.id, {
    metadata: { ...params.metadata, subscriptionId: subscription.id },
    payment_method_types: ["card"],
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: pi.client_secret,
    paymentIntentId: pi.id,
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
