import type Stripe from "stripe";
import type { MembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  billingIntervalLabel,
  billingIntervalShort,
  ensureBillingCatalog,
  findBillingPriceByStripeId,
  findDefaultRecurringPrice,
  resolvePlanTierFromStrings,
} from "./catalog";

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  const subData = subscription as unknown as Record<string, unknown>;
  const now = new Date();
  let start = now;
  let end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  if (typeof subData.current_period_start === "number") {
    start = new Date(subData.current_period_start * 1000);
  }
  if (typeof subData.current_period_end === "number") {
    end = new Date(subData.current_period_end * 1000);
  }

  return { start, end };
}

function mapStripeStatus(status: Stripe.Subscription.Status): MembershipStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELLED";
    case "incomplete_expired":
      return "EXPIRED";
    default:
      return "ACTIVE";
  }
}

export async function syncMemberSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  options?: {
    userId?: string;
    changedBy?: string;
    changeType?: string;
    stripeEventId?: string;
  }
) {
  await ensureBillingCatalog();

  const stripePriceId = subscription.items.data[0]?.price.id;
  const customerId = subscription.customer as string;
  let billingPrice = stripePriceId
    ? await findBillingPriceByStripeId(stripePriceId)
    : null;

  let userId = options?.userId;
  if (!userId) {
    const metadataUserId = subscription.metadata?.userId;
    if (metadataUserId) {
      userId = metadataUserId;
    } else {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.email) {
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
          select: { id: true },
        });
        userId = user?.id;
      }
    }
  }

  if (!userId) {
    console.warn("[billing/sync] No user found for subscription", subscription.id);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionTier: true,
      weightManagementIntakes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { selectedPlan: true },
      },
      consultationBookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { selectedPlan: true },
      },
    },
  });

  if (!user) return null;

  const planTier =
    (billingPrice?.product.planTier as "CORE" | "PRECISION" | undefined) ||
    resolvePlanTierFromStrings({
      selectedPlan:
        user.weightManagementIntakes[0]?.selectedPlan ||
        user.consultationBookings[0]?.selectedPlan,
      subscriptionTier: user.subscriptionTier,
    }) ||
    (subscription.metadata?.selectedPlan as "CORE" | "PRECISION" | undefined) ||
    "CORE";

  if (!billingPrice) {
    billingPrice = await findDefaultRecurringPrice(planTier, "MONTHLY");
  }

  if (!billingPrice) {
    console.warn("[billing/sync] No billing price for subscription", subscription.id);
    return null;
  }

  const period = getSubscriptionPeriod(subscription);
  const status = mapStripeStatus(subscription.status);
  const subData = subscription as unknown as Record<string, unknown>;
  const canceledAt =
    typeof subData.canceled_at === "number"
      ? new Date(subData.canceled_at * 1000)
      : null;

  const existing = await prisma.memberSubscription.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: billingPrice.productId,
      },
    },
    include: { billingPrice: { include: { product: true } }, product: true },
  });

  const memberSub = await prisma.memberSubscription.upsert({
    where: {
      userId_productId: {
        userId,
        productId: billingPrice.productId,
      },
    },
    create: {
      userId,
      productId: billingPrice.productId,
      billingPriceId: billingPrice.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId || billingPrice.stripePriceId,
      status,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      cancelledAt: canceledAt,
      activatedAt: period.start,
    },
    update: {
      billingPriceId: billingPrice.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId || billingPrice.stripePriceId,
      status,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      cancelledAt: canceledAt,
      activatedAt: existing?.activatedAt ?? period.start,
    },
    include: {
      product: true,
      billingPrice: true,
    },
  });

  if (
    existing &&
    existing.billingPriceId &&
    existing.billingPriceId !== billingPrice.id
  ) {
    await prisma.memberSubscriptionHistory.create({
      data: {
        memberSubscriptionId: memberSub.id,
        fromBillingPriceId: existing.billingPriceId,
        toBillingPriceId: billingPrice.id,
        fromPlanTier: existing.product?.planTier || existing.billingPrice?.product?.planTier || null,
        toPlanTier: memberSub.product.planTier,
        changeType: options?.changeType || "stripe_sync",
        changedBy: options?.changedBy,
        stripeEventId: options?.stripeEventId,
        effectiveAt: new Date(),
      },
    });
  } else if (!existing) {
    await prisma.memberSubscriptionHistory.create({
      data: {
        memberSubscriptionId: memberSub.id,
        toBillingPriceId: billingPrice.id,
        toPlanTier: memberSub.product.planTier,
        changeType: options?.changeType || "created",
        changedBy: options?.changedBy,
        stripeEventId: options?.stripeEventId,
        effectiveAt: period.start,
      },
    });
  }

  // Keep legacy MembershipSubscription in sync for backward compatibility
  const amountAud = billingPrice.amountCents / 100;
  await prisma.membershipSubscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId || billingPrice.stripePriceId,
      planName: memberSub.product.name,
      amount: amountAud,
      currency: billingPrice.currency,
      billingCycle: billingIntervalShort(billingPrice.billingInterval),
      status,
      startDate: period.start,
      currentPeriodEnd: period.end,
      cancelledAt: canceledAt,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId || billingPrice.stripePriceId,
      planName: memberSub.product.name,
      amount: amountAud,
      currency: billingPrice.currency,
      billingCycle: billingIntervalShort(billingPrice.billingInterval),
      status,
      currentPeriodEnd: period.end,
      cancelledAt: canceledAt,
    },
  });

  if (status === "ACTIVE") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionTier: `sanative_${planTier.toLowerCase()}`,
        renewalDate: period.end,
      },
    });
  }

  return memberSub;
}

export async function syncLegacyMembershipFromMemberSub(userId: string) {
  const memberSub = await prisma.memberSubscription.findFirst({
    where: { userId },
    include: { product: true, billingPrice: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!memberSub?.billingPrice) return;

  await prisma.membershipSubscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: memberSub.stripeCustomerId,
      stripeSubscriptionId: memberSub.stripeSubscriptionId,
      stripePriceId: memberSub.stripePriceId,
      planName: memberSub.product.name,
      amount: memberSub.billingPrice.amountCents / 100,
      currency: memberSub.billingPrice.currency,
      billingCycle: billingIntervalShort(memberSub.billingPrice.billingInterval),
      status: memberSub.status,
      startDate: memberSub.currentPeriodStart || memberSub.activatedAt || new Date(),
      currentPeriodEnd: memberSub.currentPeriodEnd,
      cancelledAt: memberSub.cancelledAt,
    },
    update: {
      planName: memberSub.product.name,
      amount: memberSub.billingPrice.amountCents / 100,
      billingCycle: billingIntervalShort(memberSub.billingPrice.billingInterval),
      status: memberSub.status,
      currentPeriodEnd: memberSub.currentPeriodEnd,
    },
  });
}

export function formatBillingCycleLabel(interval: string): string {
  const map: Record<string, string> = {
    mo: "monthly",
    qtr: "quarterly",
    "6mo": "biannual",
    yr: "yearly",
    once: "one-time",
    monthly: "monthly",
    quarterly: "quarterly",
    biannual: "biannual",
    yearly: "yearly",
  };
  return map[interval] || interval;
}

export async function backfillFromLegacyMembership(userId: string) {
  const legacy = await prisma.membershipSubscription.findUnique({
    where: { userId },
  });

  if (!legacy?.stripeSubscriptionId || !process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  const existing = await prisma.memberSubscription.findFirst({
    where: { userId },
  });
  if (existing?.stripeSubscriptionId) return existing;

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(
    legacy.stripeSubscriptionId
  );

  return syncMemberSubscriptionFromStripe(subscription, {
    userId,
    changeType: "backfill",
  });
}

export { billingIntervalLabel };
