import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { ensureBillingCatalog } from "./catalog";
import { syncMemberSubscriptionFromStripe } from "./sync-subscription";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function changeMemberPlan(input: {
  memberId: string;
  targetBillingPriceId: string;
  effective?: "immediate" | "next_period";
  changedBy: string;
  notes?: string;
}) {
  await ensureBillingCatalog();

  const { memberId, targetBillingPriceId, changedBy, notes } = input;
  const effective = input.effective || "next_period";

  const targetPrice = await prisma.billingPrice.findUnique({
    where: { id: targetBillingPriceId },
    include: { product: true },
  });

  if (!targetPrice || !targetPrice.isActive || targetPrice.isFirstMonth) {
    throw new Error("Invalid billing price");
  }

  if (!targetPrice.stripePriceId) {
    throw new Error(
      `Stripe price not configured for ${targetPrice.label || targetPrice.billingInterval}. Add the price ID in Stripe and env.`
    );
  }

  const memberSub = await prisma.memberSubscription.findFirst({
    where: {
      userId: memberId,
      productId: targetPrice.productId,
    },
    include: { billingPrice: true, product: true },
  });

  if (!memberSub?.stripeSubscriptionId) {
    throw new Error("Member has no active Stripe subscription to update");
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(
    memberSub.stripeSubscriptionId
  );

  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Stripe subscription has no items");
  }

  const updated = await stripe.subscriptions.update(memberSub.stripeSubscriptionId, {
    items: [{ id: itemId, price: targetPrice.stripePriceId }],
    proration_behavior: effective === "immediate" ? "create_prorations" : "none",
  });

  const synced = await syncMemberSubscriptionFromStripe(updated, {
    userId: memberId,
    changedBy,
    changeType: "cadence_change",
  });

  if (synced && memberSub.billingPriceId !== targetPrice.id) {
    await prisma.memberSubscriptionHistory.create({
      data: {
        memberSubscriptionId: synced.id,
        fromBillingPriceId: memberSub.billingPriceId,
        toBillingPriceId: targetPrice.id,
        fromPlanTier: memberSub.product.planTier,
        toPlanTier: targetPrice.product.planTier,
        changeType: "cadence_change",
        changedBy,
        notes,
        effectiveAt: new Date(),
      },
    });
  }

  await prisma.internalNote.create({
    data: {
      userId: memberId,
      category: "BILLING",
      title: "Billing cadence changed",
      content: `Changed from ${memberSub.billingPrice?.label || "previous"} to ${targetPrice.label || targetPrice.billingInterval}. Effective: ${effective}. ${notes || ""}`,
      createdBy: changedBy,
    },
  });

  return {
    success: true,
    subscriptionId: updated.id,
    newBillingInterval: targetPrice.billingInterval,
    currentPeriodEnd: synced?.currentPeriodEnd?.toISOString() ?? null,
  };
}

export async function upgradeMemberTier(_input: {
  memberId: string;
  targetPlanTier: "PRECISION";
  effective?: "immediate" | "next_period";
  changedBy: string;
  notes?: string;
}): Promise<never> {
  throw new Error(
    "Sanative Precision is no longer a billed product. Weight Management uses the weight_management plan."
  );
}

let portalCancellationDisabled = false;

/** Members update a card here. Cancellation stays with the care team, so the portal has no cancel button. */
async function ensurePortalCancellationDisabled(stripe: Stripe) {
  if (portalCancellationDisabled) return;

  const list = await stripe.billingPortal.configurations.list({ limit: 20, active: true });
  const targets = list.data.filter((config) => config.is_default);
  const configs = targets.length > 0 ? targets : list.data;

  for (const config of configs) {
    if (!config.features.subscription_cancel?.enabled) continue;
    await stripe.billingPortal.configurations.update(config.id, {
      features: {
        subscription_cancel: { enabled: false },
      },
    });
  }

  portalCancellationDisabled = true;
}

export async function createBillingPortalSession(memberId: string, returnUrl: string) {
  const memberSub = await prisma.memberSubscription.findFirst({
    where: { userId: memberId },
    orderBy: { updatedAt: "desc" },
  });

  const legacy = await prisma.membershipSubscription.findUnique({
    where: { userId: memberId },
  });

  const customerId =
    memberSub?.stripeCustomerId || legacy?.stripeCustomerId;

  if (!customerId) {
    throw new Error("No Stripe customer on file");
  }

  const stripe = getStripe();
  await ensurePortalCancellationDisabled(stripe);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
