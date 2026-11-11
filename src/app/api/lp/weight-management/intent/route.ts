import { NextRequest, NextResponse } from "next/server";
import { STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES } from "@/lib/checkout/stripe-payment-methods";
import {
  LP_WM_APPOINTMENT_TYPE,
  LP_WM_ASSESSMENT_CENTS,
  readLpWmContact,
  stripeMetadataFromFunnel,
  validateLpWmContact,
  validateLpWmSlot,
} from "@/lib/lp/weight-management-funnel";
import { PRICING } from "@/lib/lp/weight-management";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import { getStripe } from "@/lib/stripe";

const REUSABLE_PI_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Payments are not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const existingId = String(body.paymentIntentId || "").trim();
    const hasExistingIntent = existingId.startsWith("pi_");

    // Reusing a PaymentIntent is not a new charge. Counting those hits
    // blocked real checkouts after the form pre-warmed payment.
    if (!hasExistingIntent) {
      const ipLimited = await enforceIpRateLimit(
        req,
        "lp-wm-intent:ip",
        RATE_LIMITS.lpWmIntentIp
      );
      if (!ipLimited.allowed) {
        return rateLimitExceededResponse(ipLimited.retryAfterSec);
      }
    }

    const hasSlot = Boolean(String(body.slotId || "").trim());
    const slot = hasSlot ? validateLpWmSlot(body) : null;
    if (hasSlot && slot && !slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 400 });
    }
    const slotValue = slot && slot.ok ? slot.value : { slotId: "", startTime: "", endTime: "" };

    const contact = readLpWmContact(body);
    const metadata = stripeMetadataFromFunnel({ ...contact, ...slotValue });
    const contactValid = validateLpWmContact(contact);

    if (existingId.startsWith("pi_")) {
      const existing = await stripe.paymentIntents.retrieve(existingId);
      if (REUSABLE_PI_STATUSES.has(existing.status) && existing.client_secret) {
        const updated = await stripe.paymentIntents.update(existingId, {
          metadata,
          ...(contactValid.ok ? { receipt_email: contactValid.value.email } : {}),
        });
        if (!updated.client_secret) {
          return NextResponse.json({ error: "Could not initialise payment" }, { status: 500 });
        }
        return NextResponse.json({
          clientSecret: updated.client_secret,
          paymentIntentId: updated.id,
          amountAud: PRICING.assessmentFee,
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: LP_WM_ASSESSMENT_CENTS,
      currency: "aud",
      payment_method_types: [...STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES],
      metadata,
      description: `Sanative clinical assessment · ${LP_WM_APPOINTMENT_TYPE}`,
      ...(contactValid.ok ? { receipt_email: contactValid.value.email } : {}),
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Could not initialise payment" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountAud: PRICING.assessmentFee,
    });
  } catch (error) {
    console.error("[lp/weight-management/intent]", error);
    return NextResponse.json({ error: "Failed to initialise payment" }, { status: 500 });
  }
}
