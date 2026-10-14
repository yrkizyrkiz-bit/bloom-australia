import type Stripe from "stripe";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const LEGACY_MEMBERS_CHECKOUT_PAYMENT_TYPE = "organ_care_membership";

export type VerifyLegacyMembersCheckoutPaymentParams = {
  paymentIntentId: string;
  email: string;
  program?: string | null;
  stripeCustomerId?: string | null;
};

export type VerifyLegacyMembersCheckoutPaymentResult =
  | {
      ok: true;
      paymentIntent: Stripe.PaymentIntent;
      customerId: string | null;
    }
  | { ok: false; error: string; status: number };

/**
 * Server-side verification for /api/members/checkout.
 * An unverified browser-supplied PaymentIntent ID must never create membership.
 */
export async function verifyLegacyMembersCheckoutPayment(
  params: VerifyLegacyMembersCheckoutPaymentParams
): Promise<VerifyLegacyMembersCheckoutPaymentResult> {
  const paymentIntentId = params.paymentIntentId?.trim();
  if (!paymentIntentId) {
    return { ok: false, error: "Payment intent is required", status: 400 };
  }

  const email = params.email.toLowerCase().trim();
  if (!email) {
    return { ok: false, error: "Email is required", status: 400 };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Payment verification is not configured", status: 503 };
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return { ok: false, error: "Invalid payment intent", status: 400 };
  }

  if (paymentIntent.status !== "succeeded") {
    return { ok: false, error: "Payment not completed", status: 402 };
  }

  if (paymentIntent.metadata?.type !== LEGACY_MEMBERS_CHECKOUT_PAYMENT_TYPE) {
    return { ok: false, error: "Payment does not match this checkout", status: 400 };
  }

  const piEmail = (paymentIntent.metadata?.email || "").toLowerCase().trim();
  if (piEmail && piEmail !== email) {
    return { ok: false, error: "Payment does not match this checkout", status: 403 };
  }

  // Prefer metadata email; if missing (older intents), require Stripe customer email match
  if (!piEmail) {
    const customerId =
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id || null;
    if (!customerId) {
      return { ok: false, error: "Payment does not match this checkout", status: 403 };
    }
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || !("email" in customer) || !customer.email) {
        return { ok: false, error: "Payment does not match this checkout", status: 403 };
      }
      if (customer.email.toLowerCase().trim() !== email) {
        return { ok: false, error: "Payment does not match this checkout", status: 403 };
      }
    } catch {
      return { ok: false, error: "Payment does not match this checkout", status: 403 };
    }
  }

  if (params.stripeCustomerId) {
    const piCustomer =
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id || null;
    if (piCustomer && piCustomer !== params.stripeCustomerId) {
      return { ok: false, error: "Payment does not match this checkout", status: 403 };
    }
  }

  if (params.program) {
    const piProgram = (paymentIntent.metadata?.program || "").trim();
    if (piProgram && piProgram !== params.program) {
      return { ok: false, error: "Payment does not match this checkout", status: 400 };
    }
  }

  const pricing = await getPublicOrganCareAnnualPricing();
  if (paymentIntent.amount !== pricing.amountCents || paymentIntent.currency !== "aud") {
    return { ok: false, error: "Payment amount does not match membership pricing", status: 400 };
  }

  // Prevent replaying the same successful PaymentIntent to create another member
  const alreadyUsed = await prisma.programMember.findFirst({
    where: {
      OR: [
        {
          intakeData: {
            path: ["stripePaymentIntentId"],
            equals: paymentIntentId,
          },
        },
        {
          intakeData: {
            path: ["verifiedPaymentIntentId"],
            equals: paymentIntentId,
          },
        },
      ],
    },
    select: { id: true },
  });

  if (alreadyUsed) {
    return {
      ok: false,
      error: "This payment has already been used for a membership",
      status: 409,
    };
  }

  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id || null;

  return { ok: true, paymentIntent, customerId };
}
