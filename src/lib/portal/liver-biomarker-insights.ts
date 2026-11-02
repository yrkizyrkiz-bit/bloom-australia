import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { billingModelsAvailable, ensureBillingCatalog } from "@/lib/billing/catalog";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";
import { LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY } from "@/lib/membership/liver-biomarker-insights-access";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { getOrCreateOneTimePrice } from "@/lib/portal/stripe-subscription";
import { findEstablishedPhoneOwner } from "@/lib/auth/assert-phone-available";
import {
  buildProtectedActivationProfileUpdate,
  isEstablishedMember,
} from "@/lib/auth/member-identity-guard";

export { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG };

const FALLBACK_AMOUNT_CENTS = 7900;
const FALLBACK_NAME = "Liver Biomarker Insights";
const FALLBACK_INTERVAL_LABEL = "2 months Liver portal access";
const ACCESS_MONTHS = 2;

export type LiverBiomarkerInsightsPricing = {
  productId: string | null;
  billingPriceId: string | null;
  billingInterval: BillingInterval;
  amountCents: number;
  amountAud: number;
  productName: string;
  intervalLabel: string;
};

/** Catalog price for Liver Biomarker Insights. No invented Stripe price ID. */
export async function loadLiverBiomarkerInsightsPricing(): Promise<LiverBiomarkerInsightsPricing> {
  await ensureBillingCatalog();

  const product = billingModelsAvailable()
    ? await prisma.product.findUnique({
        where: { slug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG },
        include: {
          billingPrices: {
            where: { isActive: true, isFirstMonth: false },
            orderBy: [{ isDefault: "desc" }, { amountCents: "asc" }],
          },
        },
      })
    : null;

  const price =
    product?.billingPrices.find((row) => row.billingInterval === "ONE_TIME") ??
    product?.billingPrices[0] ??
    null;
  const amountCents = price?.amountCents ?? FALLBACK_AMOUNT_CENTS;
  const amountAud = amountCents / 100;

  return {
    productId: product?.id ?? null,
    billingPriceId: price?.id ?? null,
    billingInterval: price?.billingInterval ?? "ONE_TIME",
    amountCents,
    amountAud,
    productName: product?.name ?? FALLBACK_NAME,
    intervalLabel: price?.label?.trim() || FALLBACK_INTERVAL_LABEL,
  };
}

/**
 * Create or reuse a Stripe Price for the catalog row when possible.
 * Charging still uses the catalog amount on a one-time PaymentIntent.
 */
export async function resolveLiverBiomarkerInsightsStripePriceId(): Promise<{
  stripePriceId: string | null;
  pricing: LiverBiomarkerInsightsPricing;
}> {
  const pricing = await loadLiverBiomarkerInsightsPricing();
  if (!pricing.billingPriceId) {
    return { stripePriceId: null, pricing };
  }

  const row = await prisma.billingPrice.findUnique({
    where: { id: pricing.billingPriceId },
  });
  if (!row) {
    return { stripePriceId: null, pricing };
  }

  if (row.stripePriceId) {
    return { stripePriceId: row.stripePriceId, pricing };
  }

  try {
    const stripePriceId = await getOrCreateOneTimePrice({
      productName: pricing.productName,
      productMetadata: {
        productSlug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        purchaseType: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        scope: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        billingPriceId: row.id,
      },
      amountAud: pricing.amountAud,
    });
    await prisma.billingPrice.update({
      where: { id: row.id },
      data: { stripePriceId },
    });
    return { stripePriceId, pricing };
  } catch {
    return { stripePriceId: null, pricing };
  }
}

export type ActivateLiverBiomarkerInsightsInput = {
  paymentIntentId: string;
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
};

export type ActivateLiverBiomarkerInsightsResult = {
  userId: string;
  email: string;
  alreadyProcessed: boolean;
};

function twoMonthsFrom(start: Date): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + ACCESS_MONTHS);
  return end;
}

/**
 * Activate the $79 Liver Biomarker Insights purchase: account + 2 months
 * liver portal access. Does not create a $365 Sanative Membership subscription.
 */
export async function activateLiverBiomarkerInsights(
  input: ActivateLiverBiomarkerInsightsInput
): Promise<ActivateLiverBiomarkerInsightsResult> {
  const userEmail = input.email.toLowerCase().trim();
  if (!userEmail) {
    throw new Error("Email is required to activate Liver Biomarker Insights");
  }

  const pricing = await loadLiverBiomarkerInsightsPricing();
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  const alreadyProcessed = await hasProcessedPortalPayment(input.paymentIntentId);

  const activationPhone = input.phone ?? null;
  const phoneConflictOwner = await findEstablishedPhoneOwner(
    activationPhone,
    user?.id ?? null
  ).catch(() => null);

  if (user) {
    const protectPii = isEstablishedMember({
      passwordHash: user.passwordHash,
      subscriptionStatus: user.subscriptionStatus,
      journeyStatus: user.journeyStatus,
      memberStatus: user.memberStatus,
    });
    const profileUpdate = buildProtectedActivationProfileUpdate(
      user,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: activationPhone,
        dateOfBirth: input.dateOfBirth,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        suburb: input.suburb,
        state: input.state,
        postcode: input.postcode,
        gender: input.gender,
      },
      protectPii
    );

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...profileUpdate,
        subscriptionStatus: "ACTIVE",
        subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        journeyStatus: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        phone: activationPhone,
        dateOfBirth: input.dateOfBirth ?? null,
        addressLine1: input.addressLine1 ?? null,
        addressLine2: input.addressLine2 ?? null,
        suburb: input.suburb ?? null,
        state: input.state ?? null,
        postcode: input.postcode ?? null,
        ...(input.gender ? { gender: input.gender } : {}),
        subscriptionStatus: "ACTIVE",
        subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        journeyStatus: "ACTIVE",
        role: "MEMBER",
      },
    });
  }

  const now = new Date();
  const currentPeriodEnd = twoMonthsFrom(now);

  if (pricing.productId) {
    await prisma.memberSubscription.upsert({
      where: {
        userId_productId: { userId: user.id, productId: pricing.productId },
      },
      update: {
        billingPriceId: pricing.billingPriceId,
        stripeCustomerId: input.customerId ?? undefined,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd,
        cancelAtPeriodEnd: true,
        cancelledAt: null,
        activatedAt: now,
      },
      create: {
        userId: user.id,
        productId: pricing.productId,
        billingPriceId: pricing.billingPriceId,
        stripeCustomerId: input.customerId ?? null,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd,
        cancelAtPeriodEnd: true,
        activatedAt: now,
      },
    });
  }

  const entitlementNotes = `${pricing.productName}: ${pricing.intervalLabel}. PI ${input.paymentIntentId}`;
  await Promise.all([
    grantEntitlement({
      userId: user.id,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      expiresAt: currentPeriodEnd,
      notes: entitlementNotes,
    }).catch((err) =>
      console.error("[liver_biomarker_insights] entitlement grant failed:", err)
    ),
    grantEntitlement({
      userId: user.id,
      type: "SCOPE",
      key: LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY,
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      expiresAt: currentPeriodEnd,
      notes: entitlementNotes,
    }).catch((err) =>
      console.error("[liver_biomarker_insights] product entitlement grant failed:", err)
    ),
  ]);

  if (!alreadyProcessed) {
    await recordPortalPaymentInvoice({
      userId: user.id,
      paymentIntentId: input.paymentIntentId,
      amountAud: pricing.amountAud,
      description: `${pricing.productName}: ${pricing.intervalLabel}`,
    }).catch((err) =>
      console.error("[liver_biomarker_insights] invoice record failed:", err)
    );

    await createOnboardingPreTriageTask({
      userId: user.id,
      programLabel: pricing.productName,
      programSlug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      paymentIntentId: input.paymentIntentId,
    }).catch((err) =>
      console.error("[liver_biomarker_insights] triage enqueue failed:", err)
    );

    if (phoneConflictOwner && activationPhone) {
      const otherName = [phoneConflictOwner.firstName, phoneConflictOwner.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      await prisma.internalNote
        .create({
          data: {
            userId: user.id,
            memberId: user.id,
            authorId: "system",
            authorName: "System",
            createdBy: "system",
            category: "SUPPORT",
            title: "Duplicate mobile — triage check",
            content: [
              `This member completed Liver Biomarker Insights signup with mobile ${activationPhone}, which is also on another Sanative account.`,
              `Other account: ${otherName || "member"} (${phoneConflictOwner.email}, id ${phoneConflictOwner.id}).`,
              "Confirm the correct contact details and that this is not a shared/household number before the consult.",
              `Payment intent: ${input.paymentIntentId}.`,
            ].join(" "),
            isPinned: true,
          },
        })
        .catch((err) =>
          console.error("[liver_biomarker_insights] duplicate phone triage note failed:", err)
        );
    }
  }

  return { userId: user.id, email: userEmail, alreadyProcessed };
}
