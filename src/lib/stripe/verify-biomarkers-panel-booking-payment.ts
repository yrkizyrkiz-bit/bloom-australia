import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getBiomarkersPanelPrice } from "@/lib/billing/portal-pricing";
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

export function isBiomarkersPanelBookingNotes(notes?: string | null): boolean {
  return (notes || "").includes("Biomarkers Panel");
}

export function isBiomarkersPaymentMetadata(metadata: Record<string, string>): boolean {
  return BIOMARKERS_PAYMENT_SOURCES.has(metadata.source ?? "");
}

async function amountMatchesBiomarkersPanel(paymentIntent: Stripe.PaymentIntent): Promise<boolean> {
  const tier = paymentIntent.metadata?.panelTier;
  if (tier && isValidPanelTier(tier)) {
    const price = await getBiomarkersPanelPrice(tier);
    if (price && paymentIntent.amount === price.amountCents) {
      return true;
    }
  }

  const tiers = ["essential", "extended", "comprehensive"] as const;
  for (const panelTier of tiers) {
    const price = await getBiomarkersPanelPrice(panelTier);
    if (price && paymentIntent.amount === price.amountCents) {
      return true;
    }
  }

  return false;
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
