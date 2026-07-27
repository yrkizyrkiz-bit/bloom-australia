import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getBiomarkersPanelPrice } from "@/lib/billing/portal-pricing";
import { BIOMARKERS_RETEST_ADDON_AUD } from "@/lib/biomarkers/checkout-addons";
import { getStripe } from "@/lib/stripe";
import { isValidPanelTier } from "@/lib/portal/biomarkers-purchase";

export type VerifyBiomarkersPanelBookingPaymentParams = {
  paymentIntentId: string;
  userId: string;
  bookingHoldId: string;
};

export type VerifyBiomarkersPanelBookingPaymentResult =
  | { ok: true; paymentIntent: Stripe.PaymentIntent }
  | { ok: false; error: string; status: number };

const BIOMARKERS_PAYMENT_SOURCES = new Set(["public_biomarkers", "portal_biomarkers"]);
const RETEST_ADDON_CENTS = BIOMARKERS_RETEST_ADDON_AUD * 100;

export function isBiomarkersPanelBookingNotes(notes?: string | null): boolean {
  return (notes || "").includes("Biomarkers Panel");
}

export function isBiomarkersPaymentMetadata(metadata: Record<string, string>): boolean {
  return BIOMARKERS_PAYMENT_SOURCES.has(metadata.source ?? "");
}

/** Pure amount check used by booking confirm (panel ± optional retest add-on). */
export function biomarkerPaymentAmountAllowed(
  paidCents: number,
  panelBaseAmountsCents: number[],
  options?: { includeRetestAddon?: boolean }
): boolean {
  const includeRetest = Boolean(options?.includeRetestAddon);
  for (const base of panelBaseAmountsCents) {
    if (paidCents === base) return true;
    if (paidCents === base + RETEST_ADDON_CENTS) return true;
  }
  if (includeRetest) {
    for (const base of panelBaseAmountsCents) {
      if (paidCents === base + RETEST_ADDON_CENTS) return true;
    }
  }
  return false;
}

/** Collect allowed base panel amounts (catalog + linked Stripe price, if drifted). */
async function collectPanelBaseAmountsCents(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
): Promise<number[]> {
  const bases = new Set<number>();
  const metadata = paymentIntent.metadata ?? {};

  const chargedMeta = Number(metadata.chargedAmountCents);
  if (Number.isFinite(chargedMeta) && chargedMeta > 0) {
    // chargedAmountCents may already include the retest add-on — handled by caller.
    bases.add(chargedMeta);
    if (chargedMeta > RETEST_ADDON_CENTS) {
      bases.add(chargedMeta - RETEST_ADDON_CENTS);
    }
  }

  const addFromBillingPriceId = async (billingPriceId: string | undefined) => {
    if (!billingPriceId?.trim()) return;
    const row = await prisma.billingPrice.findUnique({
      where: { id: billingPriceId },
      select: { amountCents: true, stripePriceId: true },
    });
    if (!row) return;
    bases.add(row.amountCents);
    if (row.stripePriceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(row.stripePriceId);
        if (typeof stripePrice.unit_amount === "number" && stripePrice.unit_amount > 0) {
          bases.add(stripePrice.unit_amount);
        }
      } catch {
        // Stale/deleted Stripe price — catalog amount above is enough.
      }
    }
  };

  await addFromBillingPriceId(metadata.panelBillingPriceId);

  const tiers = ["essential", "extended", "comprehensive"] as const;
  const preferredTier = metadata.panelTier;
  const orderedTiers = preferredTier && isValidPanelTier(preferredTier)
    ? [preferredTier, ...tiers.filter((t) => t !== preferredTier)]
    : [...tiers];

  for (const panelTier of orderedTiers) {
    const price = await getBiomarkersPanelPrice(panelTier);
    if (!price) continue;
    bases.add(price.amountCents);
    await addFromBillingPriceId(price.id);
  }

  return [...bases];
}

export async function amountMatchesBiomarkersPanel(
  paymentIntent: Stripe.PaymentIntent
): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  const metadata = paymentIntent.metadata ?? {};
  const bases = await collectPanelBaseAmountsCents(stripe, paymentIntent);
  return biomarkerPaymentAmountAllowed(paymentIntent.amount, bases, {
    includeRetestAddon: metadata.includeRetestAddon === "true",
  });
}

/** Biomarkers panel already paid — attach PI when confirming initial consultation. */
export async function verifyBiomarkersPanelBookingPayment(
  params: VerifyBiomarkersPanelBookingPaymentParams
): Promise<VerifyBiomarkersPanelBookingPaymentResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Payment verification is not configured", status: 503 };
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  } catch {
    return { ok: false, error: "Invalid payment intent", status: 400 };
  }

  if (paymentIntent.status !== "succeeded") {
    return { ok: false, error: "Biomarkers payment not completed", status: 402 };
  }

  const metadata = paymentIntent.metadata ?? {};
  if (!isBiomarkersPaymentMetadata(metadata)) {
    return { ok: false, error: "Invalid biomarkers payment", status: 400 };
  }

  const metaUserId = metadata.userId?.trim();
  if (metaUserId && metaUserId !== params.userId) {
    return { ok: false, error: "Payment does not belong to this member", status: 403 };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true },
  });

  if (!user?.email) {
    return { ok: false, error: "User not found", status: 404 };
  }

  const piEmail = (metadata.customerEmail || metadata.email || "").toLowerCase().trim();
  if (piEmail && piEmail !== user.email.toLowerCase().trim()) {
    return { ok: false, error: "Payment does not belong to this member", status: 403 };
  }

  if (!(await amountMatchesBiomarkersPanel(paymentIntent))) {
    return { ok: false, error: "Invalid payment amount", status: 400 };
  }

  const existingConfirmed = await prisma.consultationBooking.findFirst({
    where: {
      paymentIntentId: params.paymentIntentId,
      status: "BOOKING_CONFIRMED",
      id: { not: params.bookingHoldId },
    },
    select: { id: true },
  });

  if (existingConfirmed) {
    return {
      ok: false,
      error: "This biomarkers payment is already linked to a confirmed consultation",
      status: 409,
    };
  }

  return { ok: true, paymentIntent };
}
