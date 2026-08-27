import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ensureBillingCatalog, billingModelsAvailable } from "@/lib/billing/catalog";
import {
  grantEntitlement,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import { normalizeProgramKey } from "@/lib/membership/keys";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import { isClinicalProgramMembershipFunnel } from "@/lib/funnel/clinical-program-funnel";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { getStripe } from "@/lib/stripe";
import { ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";

export const SANATIVE_MEMBERSHIP_PRODUCT_SLUG = "sanative_membership";

/** Display fallbacks only, the DB catalog is the source of truth. */
const FALLBACK_AMOUNT_CENTS = 36500;

export type SanativeMembershipPricing = {
  productId: string | null;
  billingPriceId: string | null;
  billingInterval: BillingInterval;
  amountCents: number;
  amountAud: number;
  priceLabel: string;
  productName: string;
};

/** Annual Sanative Membership price from the admin-managed catalog. */
async function loadSanativeMembershipPricing(): Promise<SanativeMembershipPricing> {
  await ensureBillingCatalog();

  const product = billingModelsAvailable()
    ? await prisma.product.findUnique({
        where: { slug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG },
        include: {
          billingPrices: {
            where: { isActive: true, billingInterval: "YEARLY", isFirstMonth: false },
          },
        },
      })
    : null;

  const price = product?.billingPrices[0] ?? null;
  const amountCents = price?.amountCents ?? FALLBACK_AMOUNT_CENTS;
  const amountAud = amountCents / 100;

  return {
    productId: product?.id ?? null,
    billingPriceId: price?.id ?? null,
    billingInterval: price?.billingInterval ?? "YEARLY",
    amountCents,
    amountAud,
    priceLabel: `$${amountAud % 1 === 0 ? amountAud.toFixed(0) : amountAud.toFixed(2)}/yr`,
    productName: product?.name ?? "Sanative Membership",
  };
}

export const getSanativeMembershipPricing = unstable_cache(
  loadSanativeMembershipPricing,
  ["sanative-membership-pricing"],
  { revalidate: 3600, tags: ["billing-catalog"] },
);

/**
 * Resolve (or create) the Stripe Price for Sanative Membership so we can
 * create an auto-renewing annual subscription with card-on-file.
 *
 * Reads the catalog live (not the display cache) so a catalog rebuild cannot
 * leave payment using a deleted BillingPrice id.
 */
export async function resolveSanativeMembershipStripePriceId(): Promise<{
  stripePriceId: string;
  pricing: SanativeMembershipPricing;
}> {
  const pricing = await loadSanativeMembershipPricing();
  if (!pricing.billingPriceId) {
    throw new Error("Sanative Membership price is not configured in the catalog");
  }

  const stripe = getStripe();
  const row = await prisma.billingPrice.findUnique({
    where: { id: pricing.billingPriceId },
  });
  if (!row) {
    throw new Error("Sanative Membership price is not configured in the catalog");
  }

  if (row.stripePriceId && stripe) {
    try {
      const existing = await stripe.prices.retrieve(row.stripePriceId);
      if (existing.active && existing.unit_amount === pricing.amountCents) {
        return { stripePriceId: row.stripePriceId, pricing };
      }
    } catch {
      // Recreate below when the stored Stripe price is missing or drifted.
    }
  }

  const stripePriceId = await ensureStripePriceForBillingPrice({
    billingPriceId: row.id,
    amountCents: pricing.amountCents,
    billingInterval: pricing.billingInterval,
    productName: pricing.productName,
    metadata: {
      productSlug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG,
      purchaseType: "sanative_membership",
      programKey: "MEMBERSHIP",
      billingTerm: "annual",
    },
  });

  await prisma.billingPrice.update({
    where: { id: row.id },
    data: { stripePriceId },
  });

  return { stripePriceId, pricing };
}

export type ActivateSanativeMembershipInput = {
  paymentIntentId: string;
  /** Stripe Subscription id, required for card-on-file auto-renewal. */
  stripeSubscriptionId?: string | null;
  customerId?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  /** Treatment program the member came for (e.g. WEIGHT_MANAGEMENT). */
  intentProgram?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

export type ActivateSanativeMembershipResult = {
  userId: string;
  email: string;
  alreadyProcessed: boolean;
};

/**
 * Idempotent activation for the consolidated Sanative Membership funnel.
 *
 * Membership is ACTIVE immediately, no doctor approval. Doctor approval only
 * gates treatment programs (weight management, hair loss, etc.), which the
 * member activates later from the portal.
 */
export async function activateSanativeMembership(
  input: ActivateSanativeMembershipInput
): Promise<ActivateSanativeMembershipResult> {
  const userEmail = input.email.toLowerCase().trim();
  if (!userEmail) {
    throw new Error("Email is required to activate membership");
  }

  const pricing = await loadSanativeMembershipPricing();

  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  const alreadyProcessed = await hasProcessedPortalPayment(input.paymentIntentId);

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName || user.firstName,
        lastName: input.lastName || user.lastName,
        phone: input.phone ?? user.phone,
        dateOfBirth: input.dateOfBirth ?? user.dateOfBirth,
        addressLine1: input.addressLine1 ?? user.addressLine1,
        addressLine2: input.addressLine2 ?? user.addressLine2,
        suburb: input.suburb ?? user.suburb,
        state: input.state ?? user.state,
        postcode: input.postcode ?? user.postcode,
        ...(input.gender ? { gender: input.gender } : {}),
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "membership",
        journeyStatus: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        addressLine1: input.addressLine1 ?? null,
        addressLine2: input.addressLine2 ?? null,
        suburb: input.suburb ?? null,
        state: input.state ?? null,
        postcode: input.postcode ?? null,
        ...(input.gender ? { gender: input.gender } : {}),
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "membership",
        journeyStatus: "ACTIVE",
        role: "MEMBER",
      },
    });
  }

  const now = new Date();
  const currentPeriodStart = input.currentPeriodStart ?? now;
  const currentPeriodEnd =
    input.currentPeriodEnd ??
    (() => {
      const end = new Date(currentPeriodStart);
      end.setFullYear(end.getFullYear() + 1);
      return end;
    })();

  // Canonical subscription record against the catalog product.
  if (pricing.productId) {
    await prisma.memberSubscription.upsert({
      where: {
        userId_productId: { userId: user.id, productId: pricing.productId },
      },
      update: {
        billingPriceId: pricing.billingPriceId,
        stripeCustomerId: input.customerId ?? undefined,
        stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        activatedAt: now,
      },
      create: {
        userId: user.id,
        productId: pricing.productId,
        billingPriceId: pricing.billingPriceId,
        stripeCustomerId: input.customerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
        activatedAt: now,
      },
    });
  }

  // Legacy single-row membership record, portal billing overview still reads it.
  await prisma.membershipSubscription.upsert({
    where: { userId: user.id },
    update: {
      stripeCustomerId: input.customerId ?? undefined,
      stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      status: "ACTIVE",
      startDate: currentPeriodStart,
      currentPeriodEnd,
      amount: pricing.amountAud,
      currency: "AUD",
      billingCycle: "yearly",
      planName: pricing.productName,
    },
    create: {
      userId: user.id,
      stripeCustomerId: input.customerId ?? undefined,
      stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      status: "ACTIVE",
      startDate: currentPeriodStart,
      currentPeriodEnd,
      amount: pricing.amountAud,
      currency: "AUD",
      billingCycle: "yearly",
      planName: pricing.productName,
    },
  });

  await grantEntitlement({
    userId: user.id,
    type: "SCOPE",
    key: "MEMBERSHIP",
    status: "ACTIVE",
    source: "SUBSCRIPTION",
    notes: `Sanative Membership. PI ${input.paymentIntentId}${
      input.stripeSubscriptionId ? ` · sub ${input.stripeSubscriptionId}` : ""
    }`,
  }).catch((err) =>
    console.error("[sanative_membership] entitlement grant failed:", err)
  );

  const intentProgramKey = normalizeProgramKey(input.intentProgram);
  if (intentProgramKey) {
    await grantEntitlement({
      userId: user.id,
      type: "PROGRAM",
      key: intentProgramKey,
      status: "ACTIVE",
      source: "SUBSCRIPTION",
      notes: `First 30 days included with Sanative Membership. PI ${input.paymentIntentId}`,
    }).catch((err) =>
      console.error("[sanative_membership] program entitlement grant failed:", err)
    );
  }

  await syncEntitlementsFromSignals(user.id).catch((err) =>
    console.error("[sanative_membership] entitlement sync failed:", err)
  );

    if (!alreadyProcessed) {
    await recordPortalPaymentInvoice({
      userId: user.id,
      paymentIntentId: input.paymentIntentId,
      amountAud: pricing.amountAud,
      description: `${pricing.productName}: annual auto-renew (includes Essential biomarker panel)`,
    }).catch((err) =>
      console.error("[sanative_membership] invoice record failed:", err)
    );

    const isClinicalFunnel = isClinicalProgramMembershipFunnel({
      purchaseType: "sanative_membership",
      intentProgram: input.intentProgram || "",
    });
    // Clinical public funnels book a doctor next and must land in In Triage, not Pre-Triage Queue.
    if (!isClinicalFunnel) {
      await createOnboardingPreTriageTask({
        userId: user.id,
        programLabel: pricing.productName,
        programSlug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG,
        paymentIntentId: input.paymentIntentId,
        context: input.intentProgram ? { intentProgram: input.intentProgram } : undefined,
      }).catch((err) =>
        console.error("[sanative_membership] triage enqueue failed:", err)
      );
    }
  }

  return { userId: user.id, email: user.email, alreadyProcessed };
}

/**
 * Apply a successful Stripe renewal invoice to an existing Sanative Membership.
 * Extends the period, clears PAST_DUE, and re-syncs entitlements.
 */
export async function renewSanativeMembershipFromStripe(params: {
  stripeSubscriptionId: string;
  customerId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  invoiceId?: string | null;
  amountAud?: number | null;
}): Promise<{ userId: string } | null> {
  const memberSub = await prisma.memberSubscription.findFirst({
    where: { stripeSubscriptionId: params.stripeSubscriptionId },
    include: { product: { select: { slug: true } } },
  });

  const legacy = await prisma.membershipSubscription.findFirst({
    where: { stripeSubscriptionId: params.stripeSubscriptionId },
    select: { userId: true },
  });

  const isMembershipProduct =
    memberSub?.product.slug === SANATIVE_MEMBERSHIP_PRODUCT_SLUG;
  if (!isMembershipProduct && !legacy) return null;

  const userId = memberSub?.userId || legacy?.userId;
  if (!userId) return null;

  const now = new Date();
  const currentPeriodStart = params.currentPeriodStart ?? now;
  const currentPeriodEnd =
    params.currentPeriodEnd ??
    (() => {
      const end = new Date(currentPeriodStart);
      end.setFullYear(end.getFullYear() + 1);
      return end;
    })();

  if (memberSub) {
    await prisma.memberSubscription.update({
      where: { id: memberSub.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        stripeCustomerId: params.customerId ?? undefined,
      },
    });
  }

  await prisma.membershipSubscription
    .updateMany({
      where: { userId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripeCustomerId: params.customerId ?? undefined,
      },
    })
    .catch(() => undefined);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionTier: "membership",
    },
  });

  await grantEntitlement({
    userId,
    type: "SCOPE",
    key: "MEMBERSHIP",
    status: "ACTIVE",
    source: "SUBSCRIPTION",
    notes: params.invoiceId
      ? `Sanative Membership renewal. Invoice ${params.invoiceId}`
      : "Sanative Membership renewal",
  }).catch((err) =>
    console.error("[sanative_membership] renewal entitlement grant failed:", err)
  );
  await syncEntitlementsFromSignals(userId).catch((err) =>
    console.error("[sanative_membership] renewal entitlement sync failed:", err)
  );

  if (params.invoiceId && params.amountAud != null) {
    await prisma.invoice
      .upsert({
        where: { stripeId: params.invoiceId },
        update: {
          status: "PAID",
          paidAt: now,
          amount: params.amountAud,
        },
        create: {
          userId,
          stripeId: params.invoiceId,
          amount: params.amountAud,
          currency: "AUD",
          status: "PAID",
          paidAt: now,
          description: "Sanative Membership: annual renewal",
        },
      })
      .catch((err) =>
        console.error("[sanative_membership] renewal invoice record failed:", err)
      );
  }

  return { userId };
}
