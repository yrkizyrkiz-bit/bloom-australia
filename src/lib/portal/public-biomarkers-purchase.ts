import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  panelIncludesOrganCare,
  publicTierToBillingTier,
  isValidPublicPanelTier,
} from "@/lib/biomarkers/public-checkout-tier-map";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { resolveBiomarkersCheckoutQuote } from "@/lib/billing/portal-pricing";
import { createIncompleteSubscription, ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";
import {
  grantEntitlement,
  revokeEntitlement,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import { getBiomarkerSubscriptionPlan } from "@/lib/biomarkers/public-subscription-panels";
import { syncMemberSubscriptionFromPaymentIntent } from "@/lib/billing/sync-payment-subscription";
import { grantProgramPanelEntitlementsAtPayment } from "@/lib/portal/grant-program-panel-at-payment";
import { savePublicFunnelQuizFromIntake } from "@/lib/portal/public-funnel-quiz-submission";

export type PublicBiomarkersCheckoutDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  postcode?: string;
};

function resolveSourceProgram(
  value: string | null | undefined
): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function shouldBundleOrganCare(
  publicPanelTier: BiomarkerSubscriptionTier,
  sourceProgram?: string | null
) {
  return panelIncludesOrganCare(publicPanelTier, { sourceProgram });
}

async function resolveStripePriceId(params: {
  billingPriceId: string;
  amountCents: number;
  billingInterval: import("@prisma/client").BillingInterval;
  productName: string;
  metadata: Record<string, string>;
}) {
  const row = await prisma.billingPrice.findUnique({ where: { id: params.billingPriceId } });
  if (row?.stripePriceId) return row.stripePriceId;

  const stripePriceId = await ensureStripePriceForBillingPrice({
    billingPriceId: params.billingPriceId,
    amountCents: params.amountCents,
    billingInterval: params.billingInterval,
    productName: params.productName,
    metadata: params.metadata,
  });

  await prisma.billingPrice.update({
    where: { id: params.billingPriceId },
    data: { stripePriceId },
  });

  return stripePriceId;
}

export async function createPublicBiomarkersPaymentIntent(input: {
  publicPanelTier: BiomarkerSubscriptionTier;
  details: PublicBiomarkersCheckoutDetails;
  sourceProgram?: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const sourceProgram = resolveSourceProgram(input.sourceProgram);
  const billingTier = publicTierToBillingTier(input.publicPanelTier);
  const quote = await resolveBiomarkersCheckoutQuote(billingTier, false, "annual");
  const plan = getBiomarkerSubscriptionPlan(input.publicPanelTier);
  const email = input.details.email.toLowerCase().trim();
  const includesOrganCare = shouldBundleOrganCare(input.publicPanelTier, sourceProgram);

  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({
      email,
      name: `${input.details.firstName} ${input.details.lastName}`.trim(),
      phone: input.details.phone || undefined,
      metadata: {
        source: "public_biomarkers",
        publicPanelTier: input.publicPanelTier,
        ...(sourceProgram ? { sourceProgram } : {}),
      },
    }));

  const metadata = {
    source: "public_biomarkers",
    customerEmail: email,
    publicPanelTier: input.publicPanelTier,
    panelTier: billingTier,
    panelBillingPriceId: quote.panel.id,
    priceLabel: quote.priceLabel,
    includesOrganCare: includesOrganCare ? "true" : "false",
    sourceProgram: sourceProgram ?? "",
    firstName: input.details.firstName,
    lastName: input.details.lastName,
    phone: input.details.phone,
    postcode: input.details.postcode ?? "",
  };

  const panelStripePrice = await resolveStripePriceId({
    billingPriceId: quote.panel.id,
    amountCents: quote.panel.amountCents,
    billingInterval: quote.panel.billingInterval,
    productName: `${plan.name} Biomarkers Panel`,
    metadata: { panelTier: billingTier, source: "public_biomarkers" },
  });

  const { clientSecret, paymentIntentId, subscriptionId } = await createIncompleteSubscription({
    customerId: customer.id,
    items: [{ priceId: panelStripePrice }],
    description: `${plan.name} biomarkers panel (annual)`,
    metadata,
  });

  return {
    clientSecret,
    paymentIntentId,
    subscriptionId,
    amountAud: quote.totalAud,
    publicPanelTier: input.publicPanelTier,
    priceLabel: quote.priceLabel,
    customerId: customer.id,
  };
}

export async function activatePublicBiomarkersAfterPayment(input: {
  paymentIntentId: string;
  consentRecordId?: string;
  details: PublicBiomarkersCheckoutDetails;
  dateOfBirth?: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const pi = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (pi.metadata?.source !== "public_biomarkers") {
    throw new Error("Invalid payment type");
  }
  if (pi.status !== "succeeded") {
    throw new Error("Payment has not succeeded yet");
  }

  const publicPanelTier = pi.metadata.publicPanelTier;
  if (!isValidPublicPanelTier(publicPanelTier)) {
    throw new Error("Missing panel tier on payment");
  }

  const email = (input.details.email || pi.metadata.customerEmail || "").toLowerCase().trim();
  if (!email) throw new Error("Email is required");

  let user = await prisma.user.findUnique({ where: { email } });
  const dob = input.dateOfBirth ? new Date(input.dateOfBirth) : null;

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: input.details.firstName || user.firstName,
        lastName: input.details.lastName || user.lastName,
        phone: input.details.phone || user.phone,
        dateOfBirth: dob ?? user.dateOfBirth,
        postcode: input.details.postcode ?? user.postcode,
        journeyStatus:
          user.journeyStatus === "ACTIVE" ? user.journeyStatus : "CONSULTATION_PAID",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        firstName: input.details.firstName,
        lastName: input.details.lastName,
        phone: input.details.phone,
        dateOfBirth: dob,
        postcode: input.details.postcode ?? null,
        role: "MEMBER",
        journeyStatus: "CONSULTATION_PAID",
      },
    });
  }

  await stripe.paymentIntents.update(input.paymentIntentId, {
    metadata: { ...pi.metadata, userId: user.id },
  });

  await syncMemberSubscriptionFromPaymentIntent({
    userId: user.id,
    paymentIntentId: input.paymentIntentId,
    changeType: "PUBLIC_BIOMARKERS_PAYMENT",
    extraMetadata: {
      scope: "BIOLOGICAL_CLOCK",
      publicPanelTier,
      source: "public_biomarkers",
    },
  }).catch((err) =>
    console.error("[public_biomarkers] subscription sync failed:", err)
  );

  const plan = getBiomarkerSubscriptionPlan(publicPanelTier);
  const sourceProgram = resolveSourceProgram(pi.metadata.sourceProgram);

  await grantEntitlement({
    userId: user.id,
    type: "SCOPE",
    key: "BIOLOGICAL_CLOCK",
    status: "PENDING",
    source: "PORTAL_PURCHASE",
    notes: `Public biomarkers ${publicPanelTier} — paid, quiz pending. PI ${input.paymentIntentId}`,
  });

  if (shouldBundleOrganCare(publicPanelTier, sourceProgram)) {
    await grantEntitlement({
      userId: user.id,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "PENDING",
      source: "PORTAL_PURCHASE",
      notes: `Organ Care bundled with ${plan.name} — paid, quiz pending. PI ${input.paymentIntentId}`,
    });
  }

  if (!(await hasProcessedPortalPayment(input.paymentIntentId))) {
    await recordPortalPaymentInvoice({
      userId: user.id,
      paymentIntentId: input.paymentIntentId,
      amountAud: pi.amount_received / 100,
      description: `Biomarkers: ${getBiomarkerSubscriptionPlan(publicPanelTier).name} panel (pending quiz)`,
    });
  }

  await syncEntitlementsFromSignals(user.id).catch((err) =>
    console.error("[public_biomarkers] entitlement sync failed:", err)
  );

  return {
    userId: user.id,
    email: user.email,
    publicPanelTier,
    paymentIntentId: input.paymentIntentId,
    alreadyActivated: pi.metadata.userId === user.id && pi.metadata.activated === "true",
  };
}

export async function completePublicBiomarkersEnrollment(input: {
  userId: string;
  paymentIntentId: string;
  publicPanelTier: BiomarkerSubscriptionTier;
  quizAnswers?: Record<string, string>;
  quizResult?: Record<string, unknown>;
  /** When true, enrollment proceeds without the biomarkers panel quiz (e.g. hair funnel already completed). */
  skipQuiz?: boolean;
  sourceProgram?: string;
  /** Hair assessment answers from the public funnel (stored on member form as HAIR_LOSS). */
  priorQuizAnswers?: Record<string, unknown>;
}) {
  const billingTier = publicTierToBillingTier(input.publicPanelTier);
  const plan = getBiomarkerSubscriptionPlan(input.publicPanelTier);
  const fromHairLoss = input.sourceProgram === "hair_loss";

  const sourceNote = input.sourceProgram
    ? ` via ${input.sourceProgram}`
    : input.skipQuiz
      ? " (quiz skipped — prior program assessment)"
      : "";

  const existingEntitlement = await prisma.entitlement.findFirst({
    where: {
      userId: input.userId,
      type: "SCOPE",
      key: "BIOLOGICAL_CLOCK",
      status: "ACTIVE",
    },
  });

  // Hair funnel: always ensure Hair Loss + biomarkers unlocks, even on retry.
  // Never keep Organ Care from Advanced panel bundling on this path.
  if (fromHairLoss) {
    await grantEntitlement({
      userId: input.userId,
      type: "PROGRAM",
      key: "HAIR_LOSS",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Hair Loss unlocked with Advanced biomarkers checkout. PI ${input.paymentIntentId}`,
    });
    await grantEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "PROGRAM_ESSENTIAL",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Hair Loss essential biomarkers via Advanced panel. PI ${input.paymentIntentId}`,
    });
    await revokeEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
    });
    await ensureHairLossMemberRecords({
      userId: input.userId,
      paymentIntentId: input.paymentIntentId,
      priorQuizAnswers: input.priorQuizAnswers,
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        subscriptionTier: "hair_loss",
        // Booking confirm already queued care-partner triage — stay in In Triage.
        journeyStatus: "PRE_TRIAGE_PENDING",
        memberStatus: "MEMBER",
      },
    });
  }

  if (existingEntitlement) {
    await syncEntitlementsFromSignals(input.userId).catch(() => undefined);
    return { alreadyProcessed: true as const, userId: input.userId };
  }

  await grantProgramPanelEntitlementsAtPayment({
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    programKey: fromHairLoss ? "HAIR_LOSS" : null,
    publicPanelTier: input.publicPanelTier,
    billingPanelTier: billingTier,
    sourceProgram: fromHairLoss ? "hair_loss" : input.sourceProgram,
    source: "public_biomarkers",
  });

  const bookingLinkedTriage = await prisma.preTriageTask.findFirst({
    where: {
      patientId: input.userId,
      status: "PENDING",
      bookingId: { not: null },
    },
    select: { id: true },
  });

  // Public biomarkers checkout books a consult first; keep members in care-partner triage
  // until the consult path advances them. Hair funnel must not jump to ACTIVE.
  const journeyStatus = bookingLinkedTriage || fromHairLoss ? "PRE_TRIAGE_PENDING" : "ACTIVE";

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      journeyStatus,
      subscriptionStatus: "ACTIVE",
      memberStatus: "MEMBER",
      ...(fromHairLoss ? { subscriptionTier: "hair_loss" } : {}),
    },
  });

  const stripe = getStripe();
  const pi = stripe ? await stripe.paymentIntents.retrieve(input.paymentIntentId) : null;
  const amountAud = pi ? pi.amount_received / 100 : plan.priceAud;

  await recordPortalPaymentInvoice({
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    amountAud,
    description: fromHairLoss
      ? `Hair Loss + ${plan.name} biomarkers panel (annual)`
      : `Biomarkers: ${plan.name} panel (annual)`,
  }).catch(() => undefined);

  // Doctor booking already created the single pre-triage task — don't duplicate into Pre-Triage Queue.
  if (!bookingLinkedTriage && !fromHairLoss) {
    await enqueuePortalPurchaseTriage({
      source: "portal_biomarkers",
      userId: input.userId,
      paymentIntentId: input.paymentIntentId,
      panelTier: billingTier,
      addOrganCare: shouldBundleOrganCare(input.publicPanelTier, input.sourceProgram),
      priceLabel: `$${plan.priceAud}/yr`,
      label: `${plan.name} biomarkers panel`,
    }).catch(() => undefined);

    await createOnboardingPreTriageTask({
      userId: input.userId,
      programLabel: `${plan.name} Biomarkers`,
      programSlug: "biomarkers",
      paymentIntentId: input.paymentIntentId,
    }).catch(() => undefined);
  }

  if (stripe && pi) {
    await stripe.paymentIntents.update(input.paymentIntentId, {
      metadata: { ...pi.metadata, activated: "true", userId: input.userId },
    });
  }

  await syncMemberSubscriptionFromPaymentIntent({
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    changeType: "PUBLIC_BIOMARKERS_ENROLLMENT",
    extraMetadata: {
      scope: "BIOLOGICAL_CLOCK",
      publicPanelTier: input.publicPanelTier,
      source: "public_biomarkers",
      ...(fromHairLoss ? { sourceProgram: "hair_loss", program: "hair_loss" } : {}),
    },
  }).catch((err) =>
    console.error("[public_biomarkers] enrollment subscription sync failed:", err)
  );

  await syncEntitlementsFromSignals(input.userId).catch((err) =>
    console.error("[public_biomarkers] enrollment entitlement sync failed:", err)
  );

  return { alreadyProcessed: false as const, userId: input.userId };
}

async function ensureHairLossMemberRecords(input: {
  userId: string;
  paymentIntentId: string;
  priorQuizAnswers?: Record<string, unknown>;
}) {
  const answers =
    input.priorQuizAnswers && typeof input.priorQuizAnswers === "object"
      ? input.priorQuizAnswers
      : null;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
    },
  });
  if (!user) return;

  const intakeData = {
    ...(answers ?? {}),
    programType: "HAIR_LOSS",
    completedAt:
      (typeof answers?.completedAt === "string" && answers.completedAt) ||
      new Date().toISOString(),
    source: "hair_loss_biomarkers_checkout",
    paymentIntentId: input.paymentIntentId,
  };

  const existingMember = await prisma.programMember.findFirst({
    where: {
      OR: [
        { userId: input.userId, program: "HAIR_LOSS" },
        ...(user.email ? [{ email: user.email, program: "HAIR_LOSS" }] : []),
      ],
    },
    select: { id: true, intakeData: true },
    orderBy: { createdAt: "desc" },
  });

  if (existingMember) {
    const current =
      existingMember.intakeData && typeof existingMember.intakeData === "object"
        ? (existingMember.intakeData as Record<string, unknown>)
        : {};
    await prisma.programMember.update({
      where: { id: existingMember.id },
      data: {
        userId: input.userId,
        intakeData: { ...current, ...intakeData },
        membershipStatus: "PENDING",
      },
    });
  } else {
    const membershipEnd = new Date();
    membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);
    await prisma.programMember.create({
      data: {
        userId: input.userId,
        firstName: user.firstName || String(answers?.firstName || ""),
        lastName: user.lastName || String(answers?.lastName || ""),
        email: user.email,
        mobile: user.phone || String(answers?.phone || ""),
        dob: user.dateOfBirth || new Date(),
        program: "HAIR_LOSS",
        intakeData,
        membershipStatus: "PENDING",
        membershipStart: new Date(),
        membershipEnd,
      },
    });
  }

  await savePublicFunnelQuizFromIntake({
    userId: input.userId,
    program: "HAIR_LOSS",
    intakeData: {
      ...intakeData,
      canonicalProgramKey: "HAIR_LOSS",
    },
    source: "public_funnel",
  }).catch((err) =>
    console.error("[public_biomarkers] hair quiz save failed:", err)
  );
}
