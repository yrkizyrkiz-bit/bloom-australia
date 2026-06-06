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

export async function upgradeMemberTier(input: {
  memberId: string;
  targetPlanTier: "PRECISION";
  effective?: "immediate" | "next_period";
  changedBy: string;
  notes?: string;
}) {
  await ensureBillingCatalog();

  const { memberId, changedBy, notes } = input;
  const effective = input.effective || "next_period";

  const memberSub = await prisma.memberSubscription.findFirst({
    where: {
      userId: memberId,
      product: { program: "WEIGHT_MANAGEMENT" },
    },
    include: { billingPrice: true, product: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!memberSub?.stripeSubscriptionId) {
    throw new Error("Member has no active Stripe subscription to upgrade");
  }

  if (memberSub.product.planTier === "PRECISION") {
    throw new Error("Member is already on Precision");
  }

  const interval = memberSub.billingPrice?.billingInterval || "MONTHLY";
  const precisionProduct = await prisma.product.findFirst({
    where: { slug: "wm_precision", isActive: true },
  });

  if (!precisionProduct) {
    throw new Error("Precision product not configured");
  }

  const targetPrice = await prisma.billingPrice.findFirst({
    where: {
      productId: precisionProduct.id,
      billingInterval: interval,
      isFirstMonth: false,
      isActive: true,
    },
    include: { product: true },
  });

  if (!targetPrice?.stripePriceId) {
    throw new Error(
      `Stripe price not configured for Precision ${interval.toLowerCase()}`
    );
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

  const oldMemberSubId = memberSub.id;
  const oldBillingPriceId = memberSub.billingPriceId;
  const oldProductId = memberSub.productId;

  const synced = await syncMemberSubscriptionFromStripe(updated, {
    userId: memberId,
    changedBy,
    changeType: "tier_upgrade",
  });

  if (oldProductId !== precisionProduct.id) {
    await prisma.memberSubscription.deleteMany({
      where: { userId: memberId, productId: oldProductId },
    });
  }

  if (synced) {
    await prisma.memberSubscriptionHistory.create({
      data: {
        memberSubscriptionId: synced.id,
        fromBillingPriceId: oldBillingPriceId,
        toBillingPriceId: targetPrice.id,
        fromPlanTier: "CORE",
        toPlanTier: "PRECISION",
        changeType: "tier_upgrade",
        changedBy,
        notes,
        effectiveAt: new Date(),
      },
    });
  }

  const program = await prisma.memberProgram.findUnique({
    where: { userId: memberId },
  });
  if (program) {
    await prisma.memberProgram.update({
      where: { id: program.id },
      data: {
        planTier: "PRECISION",
        playbookId: "wm_precision_v1",
      },
    });
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { subscriptionTier: "sanative_precision" },
  });

  await prisma.weightManagementIntake.updateMany({
    where: { userId: memberId },
    data: { selectedPlan: "PRECISION" },
  });

  await prisma.internalNote.create({
    data: {
      userId: memberId,
      category: "BILLING",
      title: "Upgraded to Sanative Precision",
      content: `Tier upgrade Core → Precision (${interval}, effective: ${effective}). ${notes || ""}`,
      createdBy: changedBy,
    },
  });

  return {
    success: true,
    subscriptionId: updated.id,
    planTier: "PRECISION" as const,
    billingInterval: interval,
    currentPeriodEnd: synced?.currentPeriodEnd?.toISOString() ?? null,
    previousMemberSubscriptionId: oldMemberSubId,
  };
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
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
