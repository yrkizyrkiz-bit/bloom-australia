import type { ProgramKey } from "@/lib/membership/keys";
import { PROGRAM_LABELS } from "@/lib/membership/keys";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { findProductByProgram } from "@/lib/billing/catalog";
import { ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";
import { getOrCreateStripeCustomer } from "@/lib/portal/stripe-customer";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import {
  billingIntervalForTerm,
  intervalDaysForTerm,
  programCareDates,
  renewalAfterPrepaidPeriod,
  resolveApprovalProgramKey,
} from "@/lib/billing/included-care-dates";
import { getIncludedCarePolicy, useIncludedCareSlot } from "@/lib/billing/included-care";
import { programKeyFromPublicIntent } from "@/lib/billing/included-care-dates";

export type ProgramCareScheduleResult = {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  amountLabel?: string;
  skipped?: boolean;
};

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function careMetadata(input: {
  userId: string;
  programKey: ProgramKey;
  billingPriceId: string;
  serviceStart: Date;
  serviceEnd: Date;
  coverageStart: Date;
  coverageEnd: Date;
  nextChargeAt: Date;
  chargeLeadDays: number;
  intervalDays: number;
  included: boolean;
}) {
  return {
    userId: input.userId,
    programKey: input.programKey,
    sanativeProgram: input.programKey,
    programCare: "true",
    billingPriceId: input.billingPriceId,
    servicePeriodStart: input.serviceStart.toISOString(),
    servicePeriodEnd: input.serviceEnd.toISOString(),
    coverageStartsAt: input.coverageStart.toISOString(),
    coverageEndsAt: input.coverageEnd.toISOString(),
    nextChargeAt: input.nextChargeAt.toISOString(),
    chargeLeadDays: String(input.chargeLeadDays),
    serviceIntervalDays: String(input.intervalDays),
    includedCare: input.included ? "true" : "false",
  };
}

async function activeProgramSubscription(userId: string, programKey: ProgramKey) {
  return prisma.memberSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      stripeSubscriptionId: { not: null },
      product: { program: programKey },
    },
    select: { stripeSubscriptionId: true },
  });
}

const OPEN_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

async function programStripePriceIds(programKey: ProgramKey): Promise<Set<string>> {
  const products = await prisma.product.findMany({
    where: { program: programKey },
    select: { billingPrices: { select: { stripePriceId: true } } },
  });
  const ids = new Set<string>();
  for (const product of products) {
    for (const price of product.billingPrices) {
      if (price.stripePriceId) ids.add(price.stripePriceId);
    }
  }
  return ids;
}

/** Database row, or a live Stripe subscription for this program, including legacy Core. */
export async function findOpenProgramSubscription(input: {
  userId: string;
  programKey: ProgramKey;
  customerId: string;
}): Promise<string | null> {
  const saved = await activeProgramSubscription(input.userId, input.programKey);
  if (saved?.stripeSubscriptionId) return saved.stripeSubscriptionId;

  const stripe = getStripe();
  if (!stripe) return null;
  const priceIds = await programStripePriceIds(input.programKey);
  const listed = await stripe.subscriptions.list({
    customer: input.customerId,
    status: "all",
    limit: 100,
  });
  const match = listed.data.find((subscription) => {
    if (!OPEN_SUBSCRIPTION_STATUSES.has(subscription.status)) return false;
    const metaProgram = subscription.metadata?.programKey || subscription.metadata?.sanativeProgram;
    if (metaProgram === input.programKey) return true;
    const priceId = subscription.items.data[0]?.price?.id;
    return !!priceId && priceIds.has(priceId);
  });
  if (!match) return null;
  await syncMemberSubscriptionFromStripe(match, {
    userId: input.userId,
    changeType: "PROGRAM_CARE_REUSED",
  }).catch(() => undefined);
  return match.id;
}

export async function findSucceededProgramPayment(
  customerId: string,
  programKey: ProgramKey
): Promise<{ paidAt: Date; billingTerm: string | null; recurringBillingPriceId: string | null } | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const intents = await stripe.paymentIntents.list({ customer: customerId, limit: 100 });
  const paid = intents.data.find((intent) => {
    if (intent.status !== "succeeded" || intent.amount_received <= 0) return false;
    if (intent.metadata?.programKey !== programKey) return false;
    const source = intent.metadata?.source;
    return source === "portal_upsell" || source === "program_care_approval";
  });
  if (!paid) return null;
  return {
    paidAt: new Date(paid.created * 1000),
    billingTerm: paid.metadata?.billingTerm || null,
    recurringBillingPriceId: paid.metadata?.recurringBillingPriceId || null,
  };
}

/**
 * Doctor approval. Reuses a program subscription that already exists.
 * Does not cancel any other plan, including legacy Weight Management Core.
 */
export async function startApprovedProgramSubscription(params: {
  userId: string;
  prescriptionCategory?: string | null;
  firstPaymentIntentId?: string | null;
}): Promise<ProgramCareScheduleResult> {
  const stripe = getStripe();
  if (!stripe) return { success: false, error: "Stripe is not configured" };

  const policy = await getIncludedCarePolicy();
  const slot = await prisma.includedCareSlot.findUnique({ where: { userId: params.userId } });
  const reservedProgram =
    slot?.status === "RESERVED" ? programKeyFromPublicIntent(slot.programKey) : null;
  const programKey = resolveApprovalProgramKey(params.prescriptionCategory, reservedProgram);
  if (!programKey) return { success: true, skipped: true };
  const usesSlot =
    policy.enabled && slot?.status === "RESERVED" && slot.programKey === programKey;

  const existing = await activeProgramSubscription(params.userId, programKey);
  if (existing?.stripeSubscriptionId) {
    if (slot?.status === "RESERVED" && slot.programKey === programKey) {
      await useIncludedCareSlot({ userId: params.userId, programKey, reason: "approved" });
    }
    return { success: true, subscriptionId: existing.stripeSubscriptionId, skipped: true };
  }

  const term = usesSlot && slot?.billingTerm === "12m" ? "12m" : "3m";
  const product = await findProductByProgram(programKey);
  const interval = billingIntervalForTerm(term);
  const billingPrice = product?.billingPrices.find(
    (price) => price.billingInterval === interval && !price.isFirstMonth && price.isActive
  );
  if (!billingPrice || !product) {
    return { success: false, error: `No ${interval.toLowerCase()} price for ${programKey}` };
  }

  const approvedAt = new Date();
  const dates = programCareDates({
    approvedAt,
    policy,
    usesIncludedSlot: !!usesSlot,
    intervalDays: intervalDaysForTerm(term),
  });
  const { customerId } = await getOrCreateStripeCustomer(params.userId);
  const stripePriceId = await ensureStripePriceForBillingPrice({
    billingPriceId: billingPrice.id,
    amountCents: billingPrice.amountCents,
    billingInterval: billingPrice.billingInterval,
    productName: product.name,
    metadata: {
      programKey,
      source: "program_care",
      productSlug: product.slug,
    },
  });

  const nextChargeAt = dates.chargeNow ? dates.nextRenewalAt : dates.chargeAt;
  const metadata = careMetadata({
    userId: params.userId,
    programKey,
    billingPriceId: billingPrice.id,
    serviceStart: dates.serviceStart,
    serviceEnd: dates.serviceEnd,
    coverageStart: dates.chargeNow ? dates.serviceStart : approvedAt,
    coverageEnd: dates.chargeNow ? dates.serviceEnd : dates.serviceStart,
    nextChargeAt,
    chargeLeadDays: policy.chargeLeadDays,
    intervalDays: intervalDaysForTerm(term),
    included: !!usesSlot,
  });

  try {
    const openId = await findOpenProgramSubscription({
      userId: params.userId,
      programKey,
      customerId,
    });
    if (openId) {
      if (slot?.status === "RESERVED" && slot.programKey === programKey) {
        await useIncludedCareSlot({ userId: params.userId, programKey, reason: "approved" });
      }
      return { success: true, subscriptionId: openId, skipped: true };
    }

    const prepaid = await findSucceededProgramPayment(customerId, programKey);
    if (prepaid) {
      const subscriptionId = await schedulePrepaidProgramRenewal({
        userId: params.userId,
        customerId,
        programKey,
        recurringBillingPriceId: prepaid.recurringBillingPriceId || billingPrice.id,
        billingTerm: prepaid.billingTerm ?? term,
        paidAt: prepaid.paidAt,
      });
      if (slot?.status === "RESERVED" && slot.programKey === programKey) {
        await useIncludedCareSlot({ userId: params.userId, programKey, reason: "approved" });
      }
      return { success: true, subscriptionId: subscriptionId ?? undefined, skipped: true };
    }

    if (dates.chargeNow) {
      await chargeDefaultCard({
        customerId,
        amountCents: billingPrice.amountCents,
        description: `${PROGRAM_LABELS[programKey]}, ${term === "12m" ? "annual" : "every 3 months"}`,
        metadata: {
          userId: params.userId,
          programKey,
          source: "program_care_approval",
          firstPaymentIntentId: params.firstPaymentIntentId || "",
        },
      });
    }

    const renewalAt = dates.chargeNow ? dates.nextRenewalAt : dates.chargeAt;
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePriceId }],
      trial_end: unix(renewalAt),
      proration_behavior: "none",
      metadata,
    });

    await syncMemberSubscriptionFromStripe(subscription, {
      userId: params.userId,
      changedBy: "doctor_approval",
      changeType: usesSlot ? "INCLUDED_CARE_SCHEDULED" : "PROGRAM_CARE_SCHEDULED",
    });

    if (slot?.status === "RESERVED" && slot.programKey === programKey) {
      await useIncludedCareSlot({ userId: params.userId, programKey, reason: "approved" });
    }

    const amountLabel = `$${(billingPrice.amountCents / 100).toFixed(0)} ${
      term === "12m" ? "a year" : "every 3 months"
    }`;
    return { success: true, subscriptionId: subscription.id, amountLabel };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start program billing";
    console.error("[program-care] approval schedule failed:", error);
    return { success: false, error: message };
  }
}

async function chargeDefaultCard(params: {
  customerId: string;
  amountCents: number;
  description: string;
  metadata: Record<string, string>;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const customer = await stripe.customers.retrieve(params.customerId);
  if (customer.deleted) throw new Error("Stripe customer is deleted");
  const paymentMethod =
    (typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id) || null;
  if (!paymentMethod) {
    throw new Error("No saved card for this member");
  }
  await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: "aud",
    customer: params.customerId,
    payment_method: paymentMethod,
    off_session: true,
    confirm: true,
    description: params.description,
    metadata: params.metadata,
  });
}

export async function schedulePrepaidProgramRenewal(params: {
  userId: string;
  customerId: string;
  programKey: ProgramKey;
  recurringBillingPriceId: string;
  billingTerm?: string | null;
  paidAt?: Date;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const existing = await activeProgramSubscription(params.userId, params.programKey);
  if (existing?.stripeSubscriptionId) return existing.stripeSubscriptionId;

  const policy = await getIncludedCarePolicy();
  const billingPrice = await prisma.billingPrice.findUnique({
    where: { id: params.recurringBillingPriceId },
    include: { product: true },
  });
  if (!billingPrice) return null;

  const term = params.billingTerm === "12m" ? "12m" : "3m";
  const window = renewalAfterPrepaidPeriod({
    paidAt: params.paidAt ?? new Date(),
    intervalDays: intervalDaysForTerm(term),
    chargeLeadDays: policy.chargeLeadDays,
  });
  const stripePriceId =
    billingPrice.stripePriceId ??
    (await ensureStripePriceForBillingPrice({
      billingPriceId: billingPrice.id,
      amountCents: billingPrice.amountCents,
      billingInterval: billingPrice.billingInterval,
      productName: billingPrice.product.name,
      metadata: { programKey: params.programKey, source: "portal_upsell" },
    }));

  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: stripePriceId }],
    trial_end: unix(window.nextChargeAt),
    proration_behavior: "none",
    metadata: careMetadata({
      userId: params.userId,
      programKey: params.programKey,
      billingPriceId: billingPrice.id,
      serviceStart: window.serviceStart,
      serviceEnd: window.serviceEnd,
      coverageStart: window.serviceStart,
      coverageEnd: window.serviceEnd,
      nextChargeAt: window.nextChargeAt,
      chargeLeadDays: policy.chargeLeadDays,
      intervalDays: intervalDaysForTerm(term),
      included: false,
    }),
  });

  await syncMemberSubscriptionFromStripe(subscription, {
    userId: params.userId,
    changedBy: "portal_upsell",
    changeType: "PORTAL_PROGRAM_PURCHASE",
  }).catch(() => undefined);
  return subscription.id;
}
