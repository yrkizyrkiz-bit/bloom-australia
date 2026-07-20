import { getStripe } from "@/lib/stripe";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { resolveOrganCareCheckoutQuote } from "@/lib/billing/portal-pricing";
import type { BiomarkersPanelTier, OrganCareBillingTerm } from "@/lib/programs/offers";
import { isBiomarkersPanelTier, isOrganCareBillingTerm } from "@/lib/programs/offers";
import { getOrCreateStripeCustomer } from "@/lib/portal/stripe-customer";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import {
  createActiveSubscription,
  createIncompleteSubscription,
  ensureStripePriceForBillingPrice,
} from "@/lib/portal/stripe-subscription";
import { prisma } from "@/lib/prisma";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import { syncMemberSubscriptionFromPaymentIntent } from "@/lib/billing/sync-payment-subscription";

export type OrganCareCheckoutIntentInput = {
  userId: string;
  organCareTerm: OrganCareBillingTerm;
  addBiomarkers?: boolean;
  panelTier?: BiomarkersPanelTier;
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

export async function createOrganCarePaymentIntent(input: OrganCareCheckoutIntentInput) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const organCareTerm: OrganCareBillingTerm =
    input.organCareTerm && isOrganCareBillingTerm(input.organCareTerm)
      ? input.organCareTerm
      : "annual";

  const panelTier: BiomarkersPanelTier =
    input.panelTier && isBiomarkersPanelTier(input.panelTier)
      ? input.panelTier
      : "essential";

  const addBiomarkers = Boolean(input.addBiomarkers);
  const quote = await resolveOrganCareCheckoutQuote(organCareTerm, addBiomarkers, panelTier);
  const { customerId, user } = await getOrCreateStripeCustomer(input.userId);

  const baseMetadata = {
    source: "portal_organ_care",
    userId: user.id,
    customerEmail: user.email,
    organCareTerm,
    addBiomarkers: addBiomarkers ? "true" : "false",
    panelTier: addBiomarkers ? panelTier : "",
    organBillingPriceId: quote.organ.id,
    panelBillingPriceId: quote.panel?.id ?? "",
    priceLabel: quote.priceLabel,
  };

  const organStripePrice = await resolveStripePriceId({
    billingPriceId: quote.organ.id,
    amountCents: quote.organ.amountCents,
    billingInterval: quote.organ.billingInterval,
    productName: "Organ & Metabolic Care",
    metadata: { scope: "ORGAN_CARE", source: "portal_organ_care" },
  });

  if (!addBiomarkers) {
    const { clientSecret, paymentIntentId, subscriptionId } = await createIncompleteSubscription({
      customerId,
      items: [{ priceId: organStripePrice }],
      description: `Organ & Metabolic Care (${organCareTerm})`,
      metadata: baseMetadata,
    });

    return {
      clientSecret,
      paymentIntentId,
      subscriptionId,
      amountAud: quote.totalAud,
      organCareTerm,
      addBiomarkers: false,
      panelTier: null,
      priceLabel: quote.priceLabel,
      dueTodayLabel: quote.dueTodayLabel,
    };
  }

  const panelStripePrice = await resolveStripePriceId({
    billingPriceId: quote.panel!.id,
    amountCents: quote.panel!.amountCents,
    billingInterval: quote.panel!.billingInterval,
    productName: `Biomarkers — ${panelTier}`,
    metadata: { panelTier, source: "portal_organ_care" },
  });

  const { clientSecret, paymentIntentId, subscriptionId } = await createIncompleteSubscription({
    customerId,
    items: [{ priceId: organStripePrice }, { priceId: panelStripePrice }],
    description: `Organ Care (${organCareTerm}) + ${panelTier} biomarkers panel`,
    metadata: baseMetadata,
  });

  return {
    clientSecret,
    paymentIntentId,
    subscriptionId,
    amountAud: quote.totalAud,
    organCareTerm,
    addBiomarkers: true,
    panelTier,
    priceLabel: quote.priceLabel,
    dueTodayLabel: quote.dueTodayLabel,
  };
}

async function ensureOrganCareSubscriptions(params: {
  userId: string;
  customerId: string;
  organBillingPriceId: string;
  panelBillingPriceId?: string;
  panelTier?: string;
  organCareTerm?: string;
}) {
  const stripe = getStripe();
  if (!stripe) return;

  const organRow = await prisma.billingPrice.findUnique({
    where: { id: params.organBillingPriceId },
    include: { product: true },
  });
  if (!organRow) return;

  const organStripePrice = await resolveStripePriceId({
    billingPriceId: organRow.id,
    amountCents: organRow.amountCents,
    billingInterval: organRow.billingInterval,
    productName: organRow.product.name,
    metadata: { scope: "ORGAN_CARE", source: "portal_organ_care" },
  });

  const organSub = await createActiveSubscription({
    customerId: params.customerId,
    stripePriceId: organStripePrice,
    metadata: {
      userId: params.userId,
      source: "portal_organ_care",
      scope: "ORGAN_CARE",
      organCareTerm: params.organCareTerm ?? "",
    },
  });
  await syncMemberSubscriptionFromStripe(await stripe.subscriptions.retrieve(organSub), {
    userId: params.userId,
    changeType: "PORTAL_ORGAN_CARE",
  }).catch(() => undefined);

  if (!params.panelBillingPriceId) return;

  const panelRow = await prisma.billingPrice.findUnique({
    where: { id: params.panelBillingPriceId },
    include: { product: true },
  });
  if (!panelRow) return;

  const panelStripePrice = await resolveStripePriceId({
    billingPriceId: panelRow.id,
    amountCents: panelRow.amountCents,
    billingInterval: panelRow.billingInterval,
    productName: panelRow.product.name,
    metadata: {
      panelTier: params.panelTier ?? "",
      scope: "BIOLOGICAL_CLOCK",
      source: "portal_organ_care",
    },
  });

  const panelSub = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: panelStripePrice }],
    metadata: {
      userId: params.userId,
      source: "portal_organ_care",
      panelTier: params.panelTier ?? "",
      scope: "BIOLOGICAL_CLOCK",
    },
  });
  await syncMemberSubscriptionFromStripe(panelSub, {
    userId: params.userId,
    changeType: "PORTAL_BIOMARKERS_PANEL",
  }).catch(() => undefined);
}

export async function activateOrganCarePurchase(params: {
  userId: string;
  organCareTerm: OrganCareBillingTerm;
  addBiomarkers: boolean;
  panelTier?: BiomarkersPanelTier;
  paymentIntentId: string;
  amountAud: number;
  priceLabel?: string;
  customerId?: string;
  organBillingPriceId?: string;
  panelBillingPriceId?: string;
  subscriptionId?: string;
}) {
  if (await hasProcessedPortalPayment(params.paymentIntentId)) {
    return { alreadyProcessed: true as const };
  }

  const organTermLabel = params.organCareTerm === "monthly" ? "monthly" : "annual";
  const label = params.addBiomarkers
    ? `Organ Care (${organTermLabel}) + ${params.panelTier ?? "essential"} biomarkers panel`
    : `Organ & Metabolic Care (${organTermLabel})`;

  await grantEntitlement({
    userId: params.userId,
    type: "SCOPE",
    key: "ORGAN_CARE",
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Organ Care ${organTermLabel}. PI ${params.paymentIntentId}`,
  });

  if (params.addBiomarkers) {
    await grantEntitlement({
      userId: params.userId,
      type: "SCOPE",
      key: "BIOLOGICAL_CLOCK",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Biomarkers panel with organ care checkout. PI ${params.paymentIntentId}`,
    });
  }

  if (!params.addBiomarkers) {
    await syncMemberSubscriptionFromPaymentIntent({
      userId: params.userId,
      paymentIntentId: params.paymentIntentId,
      changeType: "PORTAL_ORGAN_CARE",
      extraMetadata: {
        scope: "ORGAN_CARE",
        organCareTerm: params.organCareTerm,
        source: "portal_organ_care",
      },
    }).catch((err) => console.error("[organ-care] subscription sync failed:", err));
  } else if (params.customerId && params.organBillingPriceId) {
    await ensureOrganCareSubscriptions({
      userId: params.userId,
      customerId: params.customerId,
      organBillingPriceId: params.organBillingPriceId,
      panelBillingPriceId: params.panelBillingPriceId,
      panelTier: params.panelTier,
      organCareTerm: params.organCareTerm,
    }).catch((err) => console.error("[organ-care] subscription setup failed:", err));
  }

  await recordPortalPaymentInvoice({
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    amountAud: params.amountAud,
    description: `Organ Care: ${label}`,
  });

  await enqueuePortalPurchaseTriage({
    source: "portal_organ_care",
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    panelTier: params.addBiomarkers ? params.panelTier : undefined,
    addOrganCare: true,
    priceLabel: params.priceLabel ?? `$${params.amountAud}`,
    label,
  });

  return { alreadyProcessed: false as const };
}

export async function confirmOrganCarePayment(params: {
  userId: string;
  paymentIntentId: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (pi.metadata?.userId !== params.userId) {
    throw new Error("Payment does not belong to this member");
  }
  if (pi.metadata?.source !== "portal_organ_care") {
    throw new Error("Invalid payment type");
  }
  if (pi.status !== "succeeded") {
    throw new Error("Payment has not succeeded yet");
  }

  const organCareTerm =
    pi.metadata.organCareTerm === "monthly" ? "monthly" : "annual";
  const addBiomarkers = pi.metadata.addBiomarkers === "true";
  const panelTier = (pi.metadata.panelTier || "essential") as BiomarkersPanelTier;

  return activateOrganCarePurchase({
    userId: params.userId,
    organCareTerm,
    addBiomarkers,
    panelTier: addBiomarkers ? panelTier : undefined,
    paymentIntentId: params.paymentIntentId,
    amountAud: (pi.amount ?? 0) / 100,
    priceLabel: pi.metadata.priceLabel,
    customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
    organBillingPriceId: pi.metadata.organBillingPriceId,
    panelBillingPriceId: pi.metadata.panelBillingPriceId || undefined,
    subscriptionId: pi.metadata.subscriptionId || undefined,
  });
}
