import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  panelIncludesOrganCare,
  publicTierToBillingTier,
  isValidPublicPanelTier,
} from "@/lib/biomarkers/public-checkout-tier-map";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { resolveBiomarkersCheckoutQuote } from "@/lib/billing/portal-pricing";
import {
  createIncompleteSubscription,
  ensureStripePriceForBillingPrice,
  getOrCreateOneTimePrice,
} from "@/lib/portal/stripe-subscription";
import { BIOMARKERS_RETEST_ADDON_AUD } from "@/lib/biomarkers/checkout-addons";
import {
  grantEntitlement,
  revokeEntitlement,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import {
  enqueuePortalPurchaseTriage,
  memberHasConsultInTriage,
} from "@/lib/portal/triage-enqueue";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import { getBiomarkerSubscriptionPlan } from "@/lib/biomarkers/public-subscription-panels";
import { syncMemberSubscriptionFromPaymentIntent } from "@/lib/billing/sync-payment-subscription";
import { grantProgramPanelEntitlementsAtPayment } from "@/lib/portal/grant-program-panel-at-payment";
import { appendPublicFunnelQuizFromIntake } from "@/lib/portal/public-funnel-quiz-submission";
import {
  resolveMensHealthCanonicalKey,
  resolveWomensHealthCanonicalKey,
} from "@/lib/funnel/public-consult-programs";
import { normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";
import { upsertProgramMemberEnrollment } from "@/lib/portal/program-member-upsert";
import {
  loadPriorQuizAnswersForEnrollment,
  persistPriorProgramQuizAtCheckout,
} from "@/lib/portal/persist-prior-program-quiz";

export type PublicBiomarkersCheckoutDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  postcode?: string;
  address?: string;
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
  const stripe = getStripe();
  const row = await prisma.billingPrice.findUnique({ where: { id: params.billingPriceId } });

  if (row?.stripePriceId && stripe) {
    try {
      const existing = await stripe.prices.retrieve(row.stripePriceId);
      if (existing.active && existing.unit_amount === params.amountCents) {
        return row.stripePriceId;
      }
    } catch {
      // Recreate below when the stored Stripe price is missing or drifted.
    }
  }

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
  includeRetestAddon?: boolean;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const sourceProgram = resolveSourceProgram(input.sourceProgram);
  const billingTier = publicTierToBillingTier(input.publicPanelTier);
  const quote = await resolveBiomarkersCheckoutQuote(billingTier, false, "annual");
  const plan = getBiomarkerSubscriptionPlan(input.publicPanelTier);
  const email = input.details.email.toLowerCase().trim();
  const includesOrganCare = shouldBundleOrganCare(input.publicPanelTier, sourceProgram);
  const includeRetestAddon = Boolean(input.includeRetestAddon);

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

  const chargedAmountCents =
    quote.panel.amountCents +
    (includeRetestAddon ? BIOMARKERS_RETEST_ADDON_AUD * 100 : 0);

  const metadata = {
    source: "public_biomarkers",
    customerEmail: email,
    publicPanelTier: input.publicPanelTier,
    panelTier: billingTier,
    panelBillingPriceId: quote.panel.id,
    priceLabel: quote.priceLabel,
    includesOrganCare: includesOrganCare ? "true" : "false",
    includeRetestAddon: includeRetestAddon ? "true" : "false",
    chargedAmountCents: String(chargedAmountCents),
    sourceProgram: sourceProgram ?? "",
    firstName: input.details.firstName,
    lastName: input.details.lastName,
    phone: input.details.phone,
    postcode: input.details.postcode ?? "",
    address: input.details.address ?? "",
  };

  const panelStripePrice = await resolveStripePriceId({
    billingPriceId: quote.panel.id,
    amountCents: quote.panel.amountCents,
    billingInterval: quote.panel.billingInterval,
    productName: `${plan.name} Biomarkers Panel`,
    metadata: { panelTier: billingTier, source: "public_biomarkers" },
  });

  const addInvoiceItems: Array<{ priceId: string }> = [];
  if (includeRetestAddon) {
    const retestPriceId = await getOrCreateOneTimePrice({
      productName: "6-month biomarker retest (50% off)",
      amountAud: BIOMARKERS_RETEST_ADDON_AUD,
      productMetadata: {
        scope: "biomarkers_retest_addon",
        source: "public_biomarkers",
      },
    });
    addInvoiceItems.push({ priceId: retestPriceId });
  }

  const { clientSecret, paymentIntentId, subscriptionId } = await createIncompleteSubscription({
    customerId: customer.id,
    items: [{ priceId: panelStripePrice }],
    addInvoiceItems,
    description: includeRetestAddon
      ? `${plan.name} biomarkers panel (annual) + 6-month retest`
      : `${plan.name} biomarkers panel (annual)`,
    metadata,
  });

  const amountAud = chargedAmountCents / 100;

  return {
    clientSecret,
    paymentIntentId,
    subscriptionId,
    amountAud,
    publicPanelTier: input.publicPanelTier,
    priceLabel: quote.priceLabel,
    includeRetestAddon,
    customerId: customer.id,
  };
}

export async function activatePublicBiomarkersAfterPayment(input: {
  paymentIntentId: string;
  consentRecordId?: string;
  details: PublicBiomarkersCheckoutDetails;
  dateOfBirth?: string;
  sourceProgram?: string;
  priorQuizAnswers?: Record<string, unknown>;
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
        address: input.details.address?.trim()
          ? input.details.address.trim()
          : user.address,
        addressLine1: input.details.address?.trim()
          ? input.details.address.trim()
          : user.addressLine1,
        journeyStatus:
          user.journeyStatus === "ACTIVE" ? user.journeyStatus : "CONSULTATION_PAID",
        memberStatus: "MEMBER",
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
        address: input.details.address?.trim() || null,
        addressLine1: input.details.address?.trim() || null,
        role: "MEMBER",
        journeyStatus: "CONSULTATION_PAID",
        memberStatus: "MEMBER",
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
  const sourceProgram =
    resolveSourceProgram(input.sourceProgram) ||
    resolveSourceProgram(pi.metadata.sourceProgram);

  if (
    sourceProgram &&
    input.priorQuizAnswers &&
    Object.keys(input.priorQuizAnswers).length > 0
  ) {
    await persistPriorProgramQuizAtCheckout({
      userId: user.id,
      sourceProgram,
      priorQuizAnswers: input.priorQuizAnswers,
      paymentIntentId: input.paymentIntentId,
      firstName: input.details.firstName,
      lastName: input.details.lastName,
      email: input.details.email,
      phone: input.details.phone,
      dateOfBirth: dob,
    }).catch((err) =>
      console.error("[public_biomarkers] prior program quiz persist failed:", err)
    );
  }

  await grantEntitlement({
    userId: user.id,
    type: "SCOPE",
    key: "BIOLOGICAL_CLOCK",
    status: "PENDING",
    source: "PORTAL_PURCHASE",
    notes: `Public biomarkers ${publicPanelTier}, paid, quiz pending. PI ${input.paymentIntentId}`,
  });

  if (shouldBundleOrganCare(publicPanelTier, sourceProgram)) {
    await grantEntitlement({
      userId: user.id,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "PENDING",
      source: "PORTAL_PURCHASE",
      notes: `Organ Care bundled with ${plan.name}, paid, quiz pending. PI ${input.paymentIntentId}`,
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
  const fromMensHealth = input.sourceProgram === "mens_health";
  const fromWomensHealth =
    input.sourceProgram === "womens_health" ||
    input.sourceProgram === "womens_health_sexual" ||
    input.sourceProgram === "womens_health_vitality";

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
        // Paid – New until booking confirm promotes to In Triage.
        journeyStatus: "CONSULTATION_PAID",
        memberStatus: "MEMBER",
      },
    });
  }

  // Men's funnel: unlock program + Advanced panel at payment (Architecture A).
  if (fromMensHealth) {
    const mensProgramKey = resolveMensProgramKeyFromPriorAnswers(
      input.priorQuizAnswers,
      input.sourceProgram
    );
    if (mensProgramKey) {
      await grantEntitlement({
        userId: input.userId,
        type: "PROGRAM",
        key: mensProgramKey,
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
        notes: `Men's Health (${mensProgramKey}) unlocked with ${plan.name} biomarkers checkout. PI ${input.paymentIntentId}`,
      });
    }
    await revokeEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
    });
    await ensureMensHealthMemberRecords({
      userId: input.userId,
      paymentIntentId: input.paymentIntentId,
      priorQuizAnswers: input.priorQuizAnswers,
      programKey: mensProgramKey,
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        subscriptionTier: "mens_health",
        journeyStatus: "CONSULTATION_PAID",
        memberStatus: "MEMBER",
      },
    });
  }

  // Women's funnel: same pattern as hair, unlock program + Advanced panel at payment.
  // Never keep Organ Care from Advanced panel bundling on this path.
  if (fromWomensHealth) {
    const womensProgramKey = resolveWomensProgramKeyFromPriorAnswers(
      input.priorQuizAnswers,
      input.sourceProgram
    );
    if (womensProgramKey) {
      await grantEntitlement({
        userId: input.userId,
        type: "PROGRAM",
        key: womensProgramKey,
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
        notes: `Women's Health (${womensProgramKey}) unlocked with ${plan.name} biomarkers checkout. PI ${input.paymentIntentId}`,
      });
    }
    await revokeEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
    });
    await ensureWomensHealthMemberRecords({
      userId: input.userId,
      paymentIntentId: input.paymentIntentId,
      priorQuizAnswers: input.priorQuizAnswers,
      programKey: womensProgramKey,
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        subscriptionTier: "womens_health",
        journeyStatus: "CONSULTATION_PAID",
        memberStatus: "MEMBER",
      },
    });
  }

  if (existingEntitlement) {
    // Program funnels already applied unlocks above; generic biomarkers is idempotent.
    await syncEntitlementsFromSignals(input.userId).catch(() => undefined);
    return { alreadyProcessed: true as const, userId: input.userId };
  }

  await grantProgramPanelEntitlementsAtPayment({
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    programKey: fromHairLoss
      ? "HAIR_LOSS"
      : fromMensHealth
        ? resolveMensProgramKeyFromPriorAnswers(
            input.priorQuizAnswers,
            input.sourceProgram
          )
        : fromWomensHealth
          ? resolveWomensProgramKeyFromPriorAnswers(
              input.priorQuizAnswers,
              input.sourceProgram
            )
          : null,
    publicPanelTier: input.publicPanelTier,
    billingPanelTier: billingTier,
    sourceProgram: fromHairLoss
      ? "hair_loss"
      : fromMensHealth
        ? "mens_health"
        : fromWomensHealth
          ? "womens_health"
          : input.sourceProgram,
    source: "public_biomarkers",
  });

  // First booking already In Triage (public consult → program + panel), keep one
  // care-partner booking; do not create a separate biomarkers Pre-Triage task.
  const consultInTriage = await memberHasConsultInTriage(input.userId);
  const keepSingleInTriageBooking =
    consultInTriage || fromHairLoss || fromMensHealth || fromWomensHealth;

  // Public biomarkers checkout books a consult first; stay Paid – New until booking
  // confirm promotes to In Triage. Standalone flows without a consult may go ACTIVE.
  const journeyStatus = keepSingleInTriageBooking ? "CONSULTATION_PAID" : "ACTIVE";

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      journeyStatus,
      subscriptionStatus: "ACTIVE",
      memberStatus: "MEMBER",
      ...(fromHairLoss ? { subscriptionTier: "hair_loss" } : {}),
      ...(fromMensHealth ? { subscriptionTier: "mens_health" } : {}),
      ...(fromWomensHealth ? { subscriptionTier: "womens_health" } : {}),
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
      : fromMensHealth
        ? `Men's Health + ${plan.name} biomarkers panel (annual)`
        : fromWomensHealth
          ? `Women's Health + ${plan.name} biomarkers panel (annual)`
          : `Biomarkers: ${plan.name} panel (annual)`,
  }).catch(() => undefined);

  // Doctor/consult path already owns In Triage, don't duplicate into Pre-Triage Queue.
  if (!keepSingleInTriageBooking) {
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
      ...(fromMensHealth ? { sourceProgram: "mens_health", program: "mens_health" } : {}),
      ...(fromWomensHealth
        ? { sourceProgram: "womens_health", program: "womens_health" }
        : {}),
    },
  }).catch((err) =>
    console.error("[public_biomarkers] enrollment subscription sync failed:", err)
  );

  await syncEntitlementsFromSignals(input.userId).catch((err) =>
    console.error("[public_biomarkers] enrollment entitlement sync failed:", err)
  );

  return { alreadyProcessed: false as const, userId: input.userId };
}

function resolveMensProgramKeyFromPriorAnswers(
  priorQuizAnswers: Record<string, unknown> | undefined,
  _sourceProgram?: string
): ProgramKey | null {
  const resolved =
    typeof priorQuizAnswers?.resolvedProgram === "string"
      ? priorQuizAnswers.resolvedProgram
      : typeof priorQuizAnswers?.canonicalProgramKey === "string"
        ? priorQuizAnswers.canonicalProgramKey
        : null;
  if (resolved) {
    const normalized = normalizeProgramKey(resolved);
    if (normalized === "MENS_HEALTH_SEXUAL" || normalized === "MENS_HEALTH_VITALITY") {
      return normalized;
    }
  }

  const concern =
    typeof priorQuizAnswers?.concern === "string" ? priorQuizAnswers.concern : "";
  return resolveMensHealthCanonicalKey(concern);
}

function resolveWomensProgramKeyFromPriorAnswers(
  priorQuizAnswers: Record<string, unknown> | undefined,
  sourceProgram?: string
): ProgramKey | null {
  if (sourceProgram === "womens_health_sexual") return "WOMENS_HEALTH_SEXUAL";
  if (sourceProgram === "womens_health_vitality") return "WOMENS_HEALTH_VITALITY";

  const resolved =
    typeof priorQuizAnswers?.resolvedProgram === "string"
      ? priorQuizAnswers.resolvedProgram
      : typeof priorQuizAnswers?.canonicalProgramKey === "string"
        ? priorQuizAnswers.canonicalProgramKey
        : null;
  if (resolved) {
    const normalized = normalizeProgramKey(resolved);
    if (
      normalized === "WOMENS_HEALTH_SEXUAL" ||
      normalized === "WOMENS_HEALTH_VITALITY"
    ) {
      return normalized;
    }
  }

  const category =
    typeof priorQuizAnswers?.category === "string" ? priorQuizAnswers.category : "";
  return resolveWomensHealthCanonicalKey(category);
}

async function ensureWomensHealthMemberRecords(input: {
  userId: string;
  paymentIntentId: string;
  priorQuizAnswers?: Record<string, unknown>;
  programKey: ProgramKey | null;
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
    programType: "WOMENS_HEALTH",
    resolvedProgram: input.programKey,
    canonicalProgramKey: input.programKey,
    undiagnosed: !input.programKey,
    completedAt:
      (typeof answers?.completedAt === "string" && answers.completedAt) ||
      new Date().toISOString(),
    source: "womens_health_biomarkers_checkout",
    paymentIntentId: input.paymentIntentId,
  };

  if (answers && Object.keys(answers).length > 0) {
    await appendPublicFunnelQuizFromIntake({
      userId: input.userId,
      program: "WOMENS_HEALTH",
      intakeData,
      source: "public_funnel",
    }).catch((err) =>
      console.error("[public_biomarkers] women's quiz save failed:", err)
    );
  }

  await upsertProgramMemberEnrollment({
    userId: input.userId,
    email: user.email,
    program: "WOMENS_HEALTH",
    firstName: user.firstName || String(answers?.firstName || ""),
    lastName: user.lastName || String(answers?.lastName || ""),
    mobile: user.phone || String(answers?.phone || ""),
    dob: user.dateOfBirth || new Date(),
    intakeData,
    membershipStatus: "PENDING",
  });
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
    canonicalProgramKey: "HAIR_LOSS",
  };

  if (answers && Object.keys(answers).length > 0) {
    await appendPublicFunnelQuizFromIntake({
      userId: input.userId,
      program: "HAIR_LOSS",
      intakeData,
      source: "public_funnel",
    }).catch((err) =>
      console.error("[public_biomarkers] hair quiz save failed:", err)
    );
  }

  await upsertProgramMemberEnrollment({
    userId: input.userId,
    email: user.email,
    program: "HAIR_LOSS",
    firstName: user.firstName || String(answers?.firstName || ""),
    lastName: user.lastName || String(answers?.lastName || ""),
    mobile: user.phone || String(answers?.phone || ""),
    dob: user.dateOfBirth || new Date(),
    intakeData,
    membershipStatus: "PENDING",
  });
}

async function ensureMensHealthMemberRecords(input: {
  userId: string;
  paymentIntentId: string;
  priorQuizAnswers?: Record<string, unknown>;
  programKey: ProgramKey | null;
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
    programType: "MENS_HEALTH",
    resolvedProgram: input.programKey,
    canonicalProgramKey: input.programKey,
    completedAt:
      (typeof answers?.completedAt === "string" && answers.completedAt) ||
      new Date().toISOString(),
    source: "mens_health_biomarkers_checkout",
    paymentIntentId: input.paymentIntentId,
  };

  if (answers && Object.keys(answers).length > 0) {
    await appendPublicFunnelQuizFromIntake({
      userId: input.userId,
      program: "MENS_HEALTH",
      intakeData,
      source: "public_funnel",
    }).catch((err) =>
      console.error("[public_biomarkers] men's quiz save failed:", err)
    );
  }

  await upsertProgramMemberEnrollment({
    userId: input.userId,
    email: user.email,
    program: "MENS_HEALTH",
    firstName: user.firstName || String(answers?.firstName || ""),
    lastName: user.lastName || String(answers?.lastName || ""),
    mobile: user.phone || String(answers?.phone || ""),
    dob: user.dateOfBirth || new Date(),
    intakeData,
    membershipStatus: "PENDING",
  });
}
