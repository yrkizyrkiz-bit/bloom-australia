import { getStripe } from "@/lib/stripe";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import {
  normalizeProgramKey,
  PROGRAM_LABELS,
  PROGRAM_TO_ESSENTIAL_SLUG,
  type ProgramKey,
} from "@/lib/membership/keys";
import { isProgramBillingTerm, type ProgramBillingTerm } from "@/lib/programs/offers";
import { resolveProgramCheckoutQuote } from "@/lib/billing/portal-pricing";
import { getOrCreateStripeCustomer } from "@/lib/portal/stripe-customer";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import { ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";
import { prisma } from "@/lib/prisma";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";

export type PortalProgramCheckoutIntentInput = {
  userId: string;
  programKey: string;
  billingTerm: ProgramBillingTerm;
  planTier?: "CORE" | "PRECISION" | null;
  answers?: Record<string, unknown>;
  intent?: string;
};

export async function createPortalProgramPaymentIntent(input: PortalProgramCheckoutIntentInput) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const programKey = normalizeProgramKey(input.programKey);
  if (!programKey) throw new Error("Unknown program");
  if (!isProgramBillingTerm(input.billingTerm)) {
    throw new Error("Invalid billing term");
  }

  const planTier =
    programKey === "WEIGHT_MANAGEMENT" ? input.planTier ?? "CORE" : null;

  const quote = await resolveProgramCheckoutQuote(programKey, input.billingTerm, planTier);
  const { customerId, user } = await getOrCreateStripeCustomer(input.userId);
  const label = PROGRAM_LABELS[programKey];

  const paymentIntent = await stripe.paymentIntents.create({
    amount: quote.firstMonth.amountCents,
    currency: "aud",
    customer: customerId,
    setup_future_usage: "off_session",
    automatic_payment_methods: { enabled: true },
    metadata: {
      source: "portal_upsell",
      userId: user.id,
      customerEmail: user.email,
      programKey,
      billingTerm: input.billingTerm,
      planTier: planTier ?? "",
      intent: input.intent ?? "program_subscription",
      priceLabel: quote.priceLabel,
      firstMonthBillingPriceId: quote.firstMonth.id,
      recurringBillingPriceId: quote.recurring.id,
    },
    description: `${label}, first month (includes consultation)`,
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Could not create payment");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountAud: quote.dueTodayAud,
    programKey,
    billingTerm: input.billingTerm,
    planTier,
    label,
    priceLabel: quote.priceLabel,
    dueTodayLabel: quote.dueTodayLabel,
    recurringLabel: quote.recurringLabel,
    includesConsultation: true,
  };
}

async function scheduleRecurringSubscription(params: {
  userId: string;
  customerId: string;
  recurringBillingPriceId: string;
  programKey: string;
  planTier?: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const billingPrice = await prisma.billingPrice.findUnique({
    where: { id: params.recurringBillingPriceId },
    include: { product: true },
  });
  if (!billingPrice) return;

  const stripePriceId =
    billingPrice.stripePriceId ??
    (await ensureStripePriceForBillingPrice({
      billingPriceId: billingPrice.id,
      amountCents: billingPrice.amountCents,
      billingInterval: billingPrice.billingInterval,
      productName: billingPrice.product.name,
      metadata: {
        programKey: params.programKey,
        source: "portal_upsell",
      },
    }));

  if (!billingPrice.stripePriceId) {
    await prisma.billingPrice.update({
      where: { id: billingPrice.id },
      data: { stripePriceId },
    });
  }

  const billingAnchor = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: stripePriceId }],
    billing_cycle_anchor: billingAnchor,
    proration_behavior: "none",
    metadata: {
      userId: params.userId,
      programKey: params.programKey,
      planTier: params.planTier ?? "",
      sanativeProgram: params.programKey,
      source: "portal_upsell",
      billingPriceId: billingPrice.id,
    },
  });

  await syncMemberSubscriptionFromStripe(subscription, {
    userId: params.userId,
    changedBy: "portal_upsell",
    changeType: "PORTAL_PROGRAM_PURCHASE",
  }).catch(() => undefined);
}

export async function activatePortalProgramPurchase(params: {
  userId: string;
  programKey: string;
  paymentIntentId: string;
  amountAud: number;
  priceLabel: string;
  billingTerm?: string;
  recurringBillingPriceId?: string;
  customerId?: string;
  planTier?: string;
}) {
  const programKey = normalizeProgramKey(params.programKey) as ProgramKey | null;
  if (!programKey) throw new Error("Unknown program");

  if (await hasProcessedPortalPayment(params.paymentIntentId)) {
    return { alreadyProcessed: true as const, programKey };
  }

  const label = PROGRAM_LABELS[programKey];
  const essentialSlug = PROGRAM_TO_ESSENTIAL_SLUG[programKey];
  const termNote = params.billingTerm ? ` · ${params.billingTerm}` : "";

  await grantEntitlement({
    userId: params.userId,
    type: "PROGRAM",
    key: programKey,
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Subscription in-portal: ${label} (${params.priceLabel}${termNote}). PI ${params.paymentIntentId}`,
  });

  await grantEntitlement({
    userId: params.userId,
    type: "SCOPE",
    key: "PROGRAM_ESSENTIAL",
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Program essential biomarkers (${essentialSlug}) via ${label} subscription.`,
  });

  await recordPortalPaymentInvoice({
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    amountAud: params.amountAud,
    description: `${label}, first month`,
  });

  if (params.recurringBillingPriceId && params.customerId) {
    await scheduleRecurringSubscription({
      userId: params.userId,
      customerId: params.customerId,
      recurringBillingPriceId: params.recurringBillingPriceId,
      programKey,
      planTier: params.planTier,
    }).catch((err) => console.error("[portal] schedule recurring failed:", err));
  }

  await enqueuePortalPurchaseTriage({
    source: "portal_upsell",
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    programKey,
    priceLabel: params.priceLabel,
    label: `${label} (${params.priceLabel})`,
  });

  return { alreadyProcessed: false as const, programKey };
}

export async function confirmPortalProgramPayment(params: {
  userId: string;
  paymentIntentId: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (pi.metadata?.userId !== params.userId) {
    throw new Error("Payment does not belong to this member");
  }
  if (pi.metadata?.source !== "portal_upsell") {
    throw new Error("Invalid payment type");
  }
  if (pi.status !== "succeeded") {
    throw new Error("Payment has not succeeded yet");
  }

  const programKey = pi.metadata.programKey;
  if (!programKey) throw new Error("Missing program on payment");

  return activatePortalProgramPurchase({
    userId: params.userId,
    programKey,
    paymentIntentId: pi.id,
    amountAud: pi.amount_received / 100,
    priceLabel: pi.metadata.priceLabel ?? "",
    billingTerm: pi.metadata.billingTerm,
    recurringBillingPriceId: pi.metadata.recurringBillingPriceId,
    customerId: (pi.customer as string) || undefined,
    planTier: pi.metadata.planTier || undefined,
  });
}
