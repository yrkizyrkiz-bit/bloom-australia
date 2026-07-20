import { getStripe } from "@/lib/stripe";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { resolveBiomarkersCheckoutQuote } from "@/lib/billing/portal-pricing";
import type { BiomarkersPanelTier, OrganCareBillingTerm } from "@/lib/programs/offers";
import { isOrganCareBillingTerm } from "@/lib/programs/offers";
import { getOrCreateStripeCustomer } from "@/lib/portal/stripe-customer";
import {
  hasProcessedPortalPayment,
  recordPortalPaymentInvoice,
} from "@/lib/portal/purchase-invoice";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import {
  createIncompleteSubscription,
  createActiveSubscription,
  ensureStripePriceForBillingPrice,
} from "@/lib/portal/stripe-subscription";
import { prisma } from "@/lib/prisma";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import { syncMemberSubscriptionFromPaymentIntent } from "@/lib/billing/sync-payment-subscription";

export type BiomarkersCheckoutIntentInput = {
  userId: string;
  panelTier: BiomarkersPanelTier;
  addOrganCare: boolean;
  organCareTerm?: OrganCareBillingTerm;
  quizAnswers?: Record<string, unknown>;
};

function isValidPanelTier(value: string): value is BiomarkersPanelTier {
  return value === "essential" || value === "extended" || value === "comprehensive";
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

export async function createBiomarkersPanelPaymentIntent(input: BiomarkersCheckoutIntentInput) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  if (!isValidPanelTier(input.panelTier)) {
    throw new Error("Invalid panel tier");
  }

  const organCareTerm: OrganCareBillingTerm =
    input.organCareTerm && isOrganCareBillingTerm(input.organCareTerm)
      ? input.organCareTerm
      : "annual";

  const quote = await resolveBiomarkersCheckoutQuote(
    input.panelTier,
    input.addOrganCare,
    organCareTerm
  );
  const { customerId, user } = await getOrCreateStripeCustomer(input.userId);

  const baseMetadata = {
    source: "portal_biomarkers",
    userId: user.id,
    customerEmail: user.email,
    panelTier: input.panelTier,
    addOrganCare: input.addOrganCare ? "true" : "false",
    organCareTerm: input.addOrganCare ? organCareTerm : "",
    panelBillingPriceId: quote.panel.id,
    organBillingPriceId: quote.organ?.id ?? "",
    priceLabel: quote.priceLabel,
  };

  // Panel-only: single annual subscription checkout.
  if (!input.addOrganCare) {
    const panelStripePrice = await resolveStripePriceId({
      billingPriceId: quote.panel.id,
      amountCents: quote.panel.amountCents,
      billingInterval: quote.panel.billingInterval,
      productName: `Biomarkers — ${input.panelTier}`,
      metadata: { panelTier: input.panelTier, source: "portal_biomarkers" },
    });

    const { clientSecret, paymentIntentId, subscriptionId } = await createIncompleteSubscription({
      customerId,
      items: [{ priceId: panelStripePrice }],
      description: `${input.panelTier} panel (annual)`,
      metadata: baseMetadata,
    });

    return {
      clientSecret,
      paymentIntentId,
      subscriptionId,
      amountAud: quote.totalAud,
      panelTier: input.panelTier,
      addOrganCare: false,
      organCareTerm: null,
      priceLabel: quote.priceLabel,
      dueTodayLabel: quote.dueTodayLabel,
    };
  }

  // Panel + Organ Care (mixed cadences): one PaymentIntent, subscriptions created on activation.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: quote.panel.amountCents + (quote.organ?.amountCents ?? 0),
    currency: "aud",
    customer: customerId,
    metadata: baseMetadata,
    payment_method_types: ["card"],
    description: `${input.panelTier} panel + Organ Care (${organCareTerm})`,
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Could not create payment");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    subscriptionId: null,
    amountAud: quote.totalAud,
    panelTier: input.panelTier,
    addOrganCare: true,
    organCareTerm,
    priceLabel: quote.priceLabel,
    dueTodayLabel: quote.dueTodayLabel,
  };
}

async function ensureBiomarkersSubscriptions(params: {
  userId: string;
  customerId: string;
  panelTier: BiomarkersPanelTier;
  panelBillingPriceId: string;
  organBillingPriceId?: string;
  organCareTerm?: string;
}) {
  const stripe = getStripe();
  if (!stripe) return;

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
    metadata: { panelTier: params.panelTier, source: "portal_biomarkers" },
  });

  const panelSub = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: panelStripePrice }],
    metadata: {
      userId: params.userId,
      source: "portal_biomarkers",
      panelTier: params.panelTier,
      scope: "BIOLOGICAL_CLOCK",
    },
  });
  await syncMemberSubscriptionFromStripe(panelSub, {
    userId: params.userId,
    changeType: "PORTAL_BIOMARKERS_PANEL",
  }).catch(() => undefined);

  if (params.organBillingPriceId) {
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
      metadata: { scope: "ORGAN_CARE", source: "portal_biomarkers" },
    });

    const organSub = await createActiveSubscription({
      customerId: params.customerId,
      stripePriceId: organStripePrice,
      metadata: {
        userId: params.userId,
        source: "portal_biomarkers",
        scope: "ORGAN_CARE",
        organCareTerm: params.organCareTerm ?? "",
      },
    });
    await syncMemberSubscriptionFromStripe(
      await stripe.subscriptions.retrieve(organSub),
      { userId: params.userId, changeType: "PORTAL_ORGAN_CARE" }
    ).catch(() => undefined);
  }
}

export async function activateBiomarkersPanelPurchase(params: {
  userId: string;
  panelTier: BiomarkersPanelTier;
  addOrganCare: boolean;
  organCareTerm?: string;
  paymentIntentId: string;
  amountAud: number;
  priceLabel?: string;
  customerId?: string;
  panelBillingPriceId?: string;
  organBillingPriceId?: string;
  subscriptionId?: string;
}) {
  if (await hasProcessedPortalPayment(params.paymentIntentId)) {
    return { alreadyProcessed: true as const };
  }

  const organTermLabel =
    params.organCareTerm === "monthly"
      ? "monthly"
      : params.organCareTerm === "annual"
        ? "annual"
        : "";

  const label = params.addOrganCare
    ? `${params.panelTier} panel + Organ Care (${organTermLabel || "add-on"})`
    : `${params.panelTier} panel (annual)`;

  await grantEntitlement({
    userId: params.userId,
    type: "SCOPE",
    key: "BIOLOGICAL_CLOCK",
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Biomarkers subscription (${params.panelTier}). PI ${params.paymentIntentId}`,
  });

  if (params.addOrganCare) {
    await grantEntitlement({
      userId: params.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Organ Care ${organTermLabel} with biomarkers panel. PI ${params.paymentIntentId}`,
    });
  }

  if (
    !params.addOrganCare
  ) {
    await syncMemberSubscriptionFromPaymentIntent({
      userId: params.userId,
      paymentIntentId: params.paymentIntentId,
      changeType: "PORTAL_BIOMARKERS_PANEL",
      extraMetadata: {
        scope: "BIOLOGICAL_CLOCK",
        panelTier: params.panelTier,
        source: "portal_biomarkers",
      },
    }).catch((err) => console.error("[biomarkers] subscription sync failed:", err));
  } else if (
    params.addOrganCare &&
    params.customerId &&
    params.panelBillingPriceId
  ) {
    await ensureBiomarkersSubscriptions({
      userId: params.userId,
      customerId: params.customerId,
      panelTier: params.panelTier,
      panelBillingPriceId: params.panelBillingPriceId,
      organBillingPriceId: params.organBillingPriceId,
      organCareTerm: params.organCareTerm,
    }).catch((err) => console.error("[biomarkers] subscription setup failed:", err));
  }

  await recordPortalPaymentInvoice({
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    amountAud: params.amountAud,
    description: `Biomarkers: ${label}`,
  });

  await enqueuePortalPurchaseTriage({
    source: "portal_biomarkers",
    userId: params.userId,
    paymentIntentId: params.paymentIntentId,
    panelTier: params.panelTier,
    addOrganCare: params.addOrganCare,
    priceLabel: params.priceLabel ?? `$${params.amountAud}`,
    label,
  });

  return { alreadyProcessed: false as const };
}

export async function confirmBiomarkersPanelPayment(params: {
  userId: string;
  paymentIntentId: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (pi.metadata?.userId !== params.userId) {
    throw new Error("Payment does not belong to this member");
  }
  if (pi.metadata?.source !== "portal_biomarkers") {
    throw new Error("Invalid payment type");
  }
  if (pi.status !== "succeeded") {
    throw new Error("Payment has not succeeded yet");
  }

  const panelTier = pi.metadata.panelTier;
  if (!isValidPanelTier(panelTier)) throw new Error("Missing panel tier on payment");

  return activateBiomarkersPanelPurchase({
    userId: params.userId,
    panelTier,
    addOrganCare: pi.metadata.addOrganCare === "true",
    organCareTerm: pi.metadata.organCareTerm || undefined,
    paymentIntentId: pi.id,
    amountAud: pi.amount_received / 100,
    priceLabel: pi.metadata.priceLabel,
    customerId: (pi.customer as string) || undefined,
    panelBillingPriceId: pi.metadata.panelBillingPriceId || undefined,
    organBillingPriceId: pi.metadata.organBillingPriceId || undefined,
    subscriptionId: pi.metadata.subscriptionId || undefined,
  });
}

export { isValidPanelTier };
