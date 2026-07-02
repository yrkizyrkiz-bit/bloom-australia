import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  panelIncludesOrganCare,
  publicTierToBillingTier,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-checkout-tier-map";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { resolveBiomarkersCheckoutQuote } from "@/lib/billing/portal-pricing";
import { createIncompleteSubscription, ensureStripePriceForBillingPrice } from "@/lib/portal/stripe-subscription";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import { getBiomarkerSubscriptionPlan } from "@/lib/biomarkers/public-subscription-panels";

export type PublicBiomarkersCheckoutDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  postcode?: string;
};

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
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const billingTier = publicTierToBillingTier(input.publicPanelTier);
  const quote = await resolveBiomarkersCheckoutQuote(billingTier, false, "annual");
  const plan = getBiomarkerSubscriptionPlan(input.publicPanelTier);
  const email = input.details.email.toLowerCase().trim();

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
      },
    }));

  const metadata = {
    source: "public_biomarkers",
    customerEmail: email,
    publicPanelTier: input.publicPanelTier,
    panelTier: billingTier,
    panelBillingPriceId: quote.panel.id,
    priceLabel: quote.priceLabel,
    includesOrganCare: panelIncludesOrganCare(input.publicPanelTier) ? "true" : "false",
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

  if (!(await hasProcessedPortalPayment(input.paymentIntentId))) {
    await recordPortalPaymentInvoice({
      userId: user.id,
      paymentIntentId: input.paymentIntentId,
      amountAud: pi.amount_received / 100,
      description: `Biomarkers: ${getBiomarkerSubscriptionPlan(publicPanelTier).name} panel (pending quiz)`,
    });
  }

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
  quizAnswers: Record<string, string>;
  quizResult: Record<string, unknown>;
}) {
  const existingEntitlement = await prisma.entitlement.findFirst({
    where: {
      userId: input.userId,
      type: "SCOPE",
      key: "BIOLOGICAL_CLOCK",
      status: "ACTIVE",
    },
  });
  if (existingEntitlement) {
    return { alreadyProcessed: true as const, userId: input.userId };
  }

  const billingTier = publicTierToBillingTier(input.publicPanelTier);
  const plan = getBiomarkerSubscriptionPlan(input.publicPanelTier);

  await grantEntitlement({
    userId: input.userId,
    type: "SCOPE",
    key: "BIOLOGICAL_CLOCK",
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Public biomarkers ${input.publicPanelTier} panel (${billingTier}). PI ${input.paymentIntentId}`,
  });

  if (panelIncludesOrganCare(input.publicPanelTier)) {
    await grantEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Organ Care bundled with ${plan.name} biomarkers panel. PI ${input.paymentIntentId}`,
    });
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      journeyStatus: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  });

  const stripe = getStripe();
  const pi = stripe ? await stripe.paymentIntents.retrieve(input.paymentIntentId) : null;
  const amountAud = pi ? pi.amount_received / 100 : plan.priceAud;

  await recordPortalPaymentInvoice({
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    amountAud,
    description: `Biomarkers: ${plan.name} panel (annual)`,
  }).catch(() => undefined);

  await enqueuePortalPurchaseTriage({
    source: "portal_biomarkers",
    userId: input.userId,
    paymentIntentId: input.paymentIntentId,
    panelTier: billingTier,
    addOrganCare: panelIncludesOrganCare(input.publicPanelTier),
    priceLabel: `$${plan.priceAud}/yr`,
    label: `${plan.name} biomarkers panel`,
  }).catch(() => undefined);

  await createOnboardingPreTriageTask({
    userId: input.userId,
    programLabel: `${plan.name} Biomarkers`,
    programSlug: "biomarkers",
    paymentIntentId: input.paymentIntentId,
  }).catch(() => undefined);

  if (stripe && pi) {
    await stripe.paymentIntents.update(input.paymentIntentId, {
      metadata: { ...pi.metadata, activated: "true", userId: input.userId },
    });
  }

  return { alreadyProcessed: false as const, userId: input.userId };
}
