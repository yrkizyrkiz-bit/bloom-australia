import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type VerifyOrganCareBookingPaymentParams = {
  paymentIntentId: string;
  userId: string;
  bookingHoldId: string;
};

export type VerifyOrganCareBookingPaymentResult =
  | { ok: true; paymentIntent: Stripe.PaymentIntent }
  | { ok: false; error: string; status: number };

/** Membership already paid — attach organ care PI when confirming initial consultation. */
export async function verifyOrganCareMembershipBookingPayment(
  params: VerifyOrganCareBookingPaymentParams
): Promise<VerifyOrganCareBookingPaymentResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Payment verification is not configured", status: 503 };
  }

  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: params.userId,
      key: "ORGAN_CARE",
      status: { in: ["ACTIVE", "PENDING"] },
    },
    select: { id: true },
  });

  if (!entitlement) {
    return { ok: false, error: "Organ care membership is required", status: 403 };
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  } catch {
    return { ok: false, error: "Invalid payment intent", status: 400 };
  }

  if (paymentIntent.status !== "succeeded") {
    return { ok: false, error: "Membership payment not completed", status: 402 };
  }

  if (paymentIntent.metadata?.type !== "organ_care_membership") {
    return { ok: false, error: "Invalid membership payment", status: 400 };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true },
  });

  if (!user?.email) {
    return { ok: false, error: "User not found", status: 404 };
  }

  const piEmail = (paymentIntent.metadata?.email || "").toLowerCase().trim();
  if (piEmail && piEmail !== user.email.toLowerCase().trim()) {
    return { ok: false, error: "Payment does not belong to this member", status: 403 };
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
      error: "This membership payment is already linked to a confirmed consultation",
      status: 409,
    };
  }

  return { ok: true, paymentIntent };
}
