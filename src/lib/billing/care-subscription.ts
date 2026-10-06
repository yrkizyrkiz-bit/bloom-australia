import type Stripe from "stripe";
import type { BillingInterval, BillingPrice, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureBillingCatalog, billingModelsAvailable } from "@/lib/billing/catalog";
import { ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import { getStripe } from "@/lib/stripe";

export type CareBillingPrice = BillingPrice & { product: Product };

const WM_CARE_SLUGS = ["weight_management", "wm_care"] as const;

/**
 * Canonical Weight Management care product: $360 every 3 months (first 30 days
 * included with membership). Never returns legacy Core/Precision monthly rows.
 */
export async function resolveWeightManagementCareBillingPrice(): Promise<CareBillingPrice> {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) {
    throw new Error("Billing catalog is unavailable");
  }

  for (const slug of WM_CARE_SLUGS) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true, program: "WEIGHT_MANAGEMENT" },
      include: {
        billingPrices: {
          where: {
            isActive: true,
            isFirstMonth: false,
            billingInterval: "QUARTERLY",
          },
          orderBy: [{ isDefault: "desc" }, { amountCents: "asc" }],
        },
      },
    });
    if (product?.billingPrices[0]) {
      return { ...product.billingPrices[0], product };
    }
  }

  const product =
    (await prisma.product.findFirst({
      where: {
        program: "WEIGHT_MANAGEMENT",
        isActive: true,
        OR: [{ planTier: null }, { planTier: "" }],
        NOT: { slug: { in: ["wm_core", "wm_precision"] } },
      },
      orderBy: { sortOrder: "asc" },
    })) ??
    (await prisma.product.create({
      data: {
        slug: "weight_management",
        name: "Weight Management",
        program: "WEIGHT_MANAGEMENT",
        planTier: null,
        sortOrder: 1,
        isActive: true,
      },
    }));

  let price = await prisma.billingPrice.findFirst({
    where: {
      productId: product.id,
      billingInterval: "QUARTERLY",
      isFirstMonth: false,
      isActive: true,
    },
    include: { product: true },
  });

  if (!price) {
    price = await prisma.billingPrice.create({
      data: {
        productId: product.id,
        billingInterval: "QUARTERLY",
        amountCents: 36000,
        currency: "AUD",
        isDefault: true,
        isFirstMonth: false,
        isActive: true,
        label: "Every 3 months",
      },
      include: { product: true },
    });
  }

  return price;
}

export async function ensureStripePriceOnBillingPrice(
  billingPrice: CareBillingPrice
): Promise<string> {
  if (billingPrice.stripePriceId) {
    return billingPrice.stripePriceId;
  }

  const stripePriceId = await ensureStripePriceForBillingPrice({
    billingPriceId: billingPrice.id,
    amountCents: billingPrice.amountCents,
    billingInterval: billingPrice.billingInterval,
    productName: billingPrice.product.name,
    metadata: {
      programKey: billingPrice.product.program,
      source: "catalog_price",
      productSlug: billingPrice.product.slug,
      billingTerm: billingPrice.billingInterval.toLowerCase(),
    },
  });

  // Another BillingPrice may already own this Stripe price id (shared amount).
  const owner = await prisma.billingPrice.findFirst({
    where: { stripePriceId },
    select: { id: true },
  });
  if (owner && owner.id !== billingPrice.id) {
    // Create a dedicated Stripe price for this catalog row via unique lookup key.
    const dedicated = await ensureStripePriceForBillingPrice({
      billingPriceId: billingPrice.id,
      amountCents: billingPrice.amountCents,
      billingInterval: billingPrice.billingInterval,
      productName: `${billingPrice.product.name} (${billingPrice.billingInterval})`,
      metadata: {
        programKey: billingPrice.product.program,
        source: "catalog_price_dedicated",
        productSlug: billingPrice.product.slug,
        billingTerm: `${billingPrice.billingInterval.toLowerCase()}_${billingPrice.id.slice(-6)}`,
      },
    });
    await prisma.billingPrice.update({
      where: { id: billingPrice.id },
      data: { stripePriceId: dedicated },
    });
    return dedicated;
  }

  await prisma.billingPrice.update({
    where: { id: billingPrice.id },
    data: { stripePriceId },
  });

  return stripePriceId;
}

function intervalLabel(interval: BillingInterval, amountCents: number): string {
  const aud = (amountCents / 100).toFixed(2);
  if (interval === "QUARTERLY") return `$${aud} every 3 months`;
  if (interval === "YEARLY") return `$${aud}/year`;
  if (interval === "MONTHLY") return `$${aud}/month`;
  return `$${aud}`;
}

/**
 * After doctor approval: schedule Weight Management Care from the Product table
 * (not hardcoded Core/Precision monthly prices).
 */
export async function createWeightManagementCareSubscription(params: {
  userId: string;
  userEmail: string;
  userName: string;
  firstPaymentIntentId?: string | null;
  billingAnchorUnix?: number;
  createdBy?: string;
}): Promise<{ success: boolean; subscriptionId?: string; error?: string; amountLabel?: string }> {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return { success: false, error: "Stripe not configured" };
    }

    const billingPrice = await resolveWeightManagementCareBillingPrice();
    const stripePriceId = await ensureStripePriceOnBillingPrice(billingPrice);
    const amountLabel = intervalLabel(
      billingPrice.billingInterval,
      billingPrice.amountCents
    );

    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: params.userEmail,
      limit: 1,
    });
    if (existingCustomers.data[0]) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: params.userEmail,
        name: params.userName,
        metadata: { userId: params.userId, sanativePatient: "true" },
      });
      customerId = customer.id;
    }

    // Avoid duplicate active WM care subs on the same catalog product
    const existingMemberSub = await prisma.memberSubscription.findUnique({
      where: {
        userId_productId: {
          userId: params.userId,
          productId: billingPrice.productId,
        },
      },
    });
    if (
      existingMemberSub?.stripeSubscriptionId &&
      existingMemberSub.status === "ACTIVE"
    ) {
      return {
        success: true,
        subscriptionId: existingMemberSub.stripeSubscriptionId,
        amountLabel,
      };
    }

    const billingAnchor =
      params.billingAnchorUnix ??
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePriceId }],
      billing_cycle_anchor: billingAnchor,
      proration_behavior: "none",
      metadata: {
        userId: params.userId,
        sanativeProgram: "WEIGHT_MANAGEMENT",
        programKey: "WEIGHT_MANAGEMENT",
        productSlug: billingPrice.product.slug,
        billingPriceId: billingPrice.id,
        firstPaymentIntentId: params.firstPaymentIntentId || "",
        createdBy: params.createdBy || "doctor_approval",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { subscriptionTier: true },
    });
    const tier = user?.subscriptionTier || "";
    const shouldReplaceTier =
      !tier ||
      tier.startsWith("sanative_core") ||
      tier.startsWith("sanative_precision");

    await prisma.user.update({
      where: { id: params.userId },
      data: {
        subscriptionStatus: "ACTIVE",
        ...(shouldReplaceTier ? { subscriptionTier: "weight_management" } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "stripe_subscription",
        entityId: subscription.id,
        details: {
          productSlug: billingPrice.product.slug,
          productName: billingPrice.product.name,
          billingPriceId: billingPrice.id,
          amountCents: billingPrice.amountCents,
          billingInterval: billingPrice.billingInterval,
          amountLabel,
          billingAnchor: new Date(billingAnchor * 1000).toISOString(),
          firstPaymentIntentId: params.firstPaymentIntentId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
        },
      },
    });

    await prisma.internalNote.create({
      data: {
        userId: params.userId,
        category: "BILLING",
        title: "Weight Management Care subscription created",
        content: `${billingPrice.product.name} subscription created (${amountLabel}). Billing starts ${new Date(billingAnchor * 1000).toLocaleDateString("en-AU")}. Subscription ID: ${subscription.id}`,
        createdBy: "system",
      },
    });

    await syncMemberSubscriptionFromStripe(subscription, {
      userId: params.userId,
      changedBy: params.createdBy || "doctor_approval",
      changeType: "created",
    });

    // Cancel legacy Core/Precision member rows so billing UI does not show $349
    await cancelLegacyWmCoreMemberSubscriptions(params.userId, stripe);

    console.log(
      `[care-subscription] Created ${subscription.id} for ${params.userId} (${amountLabel})`
    );

    return { success: true, subscriptionId: subscription.id, amountLabel };
  } catch (error) {
    console.error("[care-subscription] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function cancelLegacyWmCoreMemberSubscriptions(
  userId: string,
  stripe: Stripe
) {
  const legacy = await prisma.memberSubscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      product: { slug: { in: ["wm_core", "wm_precision"] } },
    },
    include: { product: true },
  });

  for (const row of legacy) {
    if (row.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(row.stripeSubscriptionId);
      } catch (err) {
        console.warn(
          "[care-subscription] Could not cancel legacy Stripe sub",
          row.stripeSubscriptionId,
          err
        );
      }
    }
    await prisma.memberSubscription.update({
      where: { id: row.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
  }
}

/**
 * Move an existing member off legacy Core/Precision onto catalog WM care pricing.
 */
export async function migrateMemberToWeightManagementCare(userId: string): Promise<{
  ok: boolean;
  message: string;
  subscriptionId?: string;
}> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, message: "Stripe not configured" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!user) return { ok: false, message: "User not found" };

  const billingPrice = await resolveWeightManagementCareBillingPrice();
  const stripePriceId = await ensureStripePriceOnBillingPrice(billingPrice);

  const legacy = await prisma.memberSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      product: { slug: { in: ["wm_core", "wm_precision"] } },
    },
    include: { product: true, billingPrice: true },
  });

  let subscription: Stripe.Subscription;

  if (legacy?.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(legacy.stripeSubscriptionId);
    const itemId = existing.items.data[0]?.id;
    if (!itemId) {
      return { ok: false, message: "Legacy subscription has no items" };
    }

    subscription = await stripe.subscriptions.update(legacy.stripeSubscriptionId, {
      items: [{ id: itemId, price: stripePriceId }],
      proration_behavior: "none",
      metadata: {
        ...existing.metadata,
        userId,
        sanativeProgram: "WEIGHT_MANAGEMENT",
        programKey: "WEIGHT_MANAGEMENT",
        productSlug: billingPrice.product.slug,
        billingPriceId: billingPrice.id,
        migratedFrom: legacy.product.slug,
        createdBy: "care_price_migration",
      },
    });

    await prisma.memberSubscription.update({
      where: { id: legacy.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  } else {
    const result = await createWeightManagementCareSubscription({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      createdBy: "care_price_migration",
      billingAnchorUnix: Math.floor(Date.now() / 1000) + 60,
    });
    if (!result.success || !result.subscriptionId) {
      return { ok: false, message: result.error || "Failed to create care subscription" };
    }
    return {
      ok: true,
      message: `Created Weight Management Care (${result.amountLabel})`,
      subscriptionId: result.subscriptionId,
    };
  }

  await syncMemberSubscriptionFromStripe(subscription, {
    userId,
    changedBy: "care_price_migration",
    changeType: "migrated_to_wm_care",
  });

  // sync maps by stripe price → may still miss if price was just created; force product link
  await prisma.memberSubscription.upsert({
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
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      status: "ACTIVE",
      currentPeriodStart: new Date(
        ((subscription as unknown as { current_period_start?: number }).current_period_start ||
          0) * 1000
      ),
      currentPeriodEnd: new Date(
        ((subscription as unknown as { current_period_end?: number }).current_period_end || 0) *
          1000
      ),
      activatedAt: new Date(),
    },
    update: {
      billingPriceId: billingPrice.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      status: "ACTIVE",
      cancelledAt: null,
    },
  });

  await prisma.internalNote.create({
    data: {
      userId,
      category: "BILLING",
      title: "Migrated to Weight Management Care pricing",
      content: `Moved from ${legacy?.product.name || "legacy Core/Precision"} to ${billingPrice.product.name} at $${(billingPrice.amountCents / 100).toFixed(0)} every 3 months. Stripe subscription: ${subscription.id}`,
      createdBy: "system",
    },
  });

  return {
    ok: true,
    message: `Migrated to ${billingPrice.product.name} ($${(billingPrice.amountCents / 100).toFixed(0)} / 3 months)`,
    subscriptionId: subscription.id,
  };
}
