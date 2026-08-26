import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { activateSanativeMembership } from "@/lib/portal/sanative-membership";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import { getStripeSubscriptionPeriod } from "@/lib/stripe/subscription-period";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

function parseAuDate(value?: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Activate Sanative Membership after a public-funnel (non-OTP) membership payment.
 */
export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "membership-checkout-funnel-complete:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const {
      userId,
      paymentIntentId,
      subscriptionId: bodySubscriptionId,
      consentRecordId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      gender,
      intentProgram,
    } = body as Record<string, string | undefined>;

    if (!paymentIntentId || !userId) {
      return NextResponse.json({ error: "Payment and account are required" }, { status: 400 });
    }

    const resolvedEmail = (email || "").toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user || !resolvedEmail || user.email.toLowerCase() !== resolvedEmail) {
      return NextResponse.json({ error: "Account not found" }, { status: 403 });
    }

    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      userId: user.id,
      email: resolvedEmail,
    });
    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }
    if (paymentIntent.metadata?.purchaseType !== "sanative_membership") {
      return NextResponse.json({ error: "Payment does not match this checkout" }, { status: 400 });
    }
    if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to this account" }, { status: 403 });
    }

    const stripeSubscriptionId =
      bodySubscriptionId || paymentIntent.metadata?.subscriptionId || null;

    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const period = getStripeSubscriptionPeriod(subscription);
      periodStart = period.start;
      periodEnd = period.end;
    }

    const genderValue =
      gender === "MALE" || gender === "male"
        ? "MALE"
        : gender === "FEMALE" || gender === "female"
          ? "FEMALE"
          : null;

    const result = await activateSanativeMembership({
      paymentIntentId,
      stripeSubscriptionId,
      customerId: (paymentIntent.customer as string) || null,
      email: resolvedEmail,
      firstName,
      lastName,
      phone: phone || null,
      dateOfBirth: parseAuDate(dateOfBirth),
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      gender: genderValue,
      intentProgram: intentProgram || paymentIntent.metadata?.intentProgram || "weight_management",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      await syncMemberSubscriptionFromStripe(subscription, {
        userId: result.userId,
        changeType: "SANATIVE_MEMBERSHIP_ACTIVATED",
      }).catch((err) =>
        console.error("[membership-checkout/funnel-complete] subscription sync failed:", err)
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      email: result.email,
      subscriptionId: stripeSubscriptionId,
      subscriptionStatus: "ACTIVE",
    });
  } catch (error) {
    console.error("[public/membership-checkout/funnel-complete]", error);
    return NextResponse.json({ error: "Failed to activate membership" }, { status: 500 });
  }
}
