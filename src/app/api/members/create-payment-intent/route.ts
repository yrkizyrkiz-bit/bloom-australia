import { NextRequest, NextResponse } from "next/server";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { ORGAN_CARE_CHECKOUT_DESCRIPTION } from "@/lib/programs/organ-care-public-offer";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import { getStripe } from "@/lib/stripe";
import { LEGACY_MEMBERS_CHECKOUT_PAYMENT_TYPE } from "@/lib/stripe/verify-legacy-members-checkout-payment";

export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "create-payment-intent:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { success: false, message: "Payment is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, program } = body;
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customer = (
      await stripe.customers.list({
        email: normalizedEmail,
        limit: 1,
      })
    ).data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email: normalizedEmail,
        name: `${firstName || ""} ${lastName || ""}`.trim() || undefined,
        metadata: {
          program: program || "general",
        },
      });
    }

    const pricing = await getPublicOrganCareAnnualPricing();
    const resolvedProgram =
      typeof program === "string" && program.trim() ? program.trim() : "organ_care";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountCents,
      currency: "aud",
      customer: customer.id,
      metadata: {
        type: LEGACY_MEMBERS_CHECKOUT_PAYMENT_TYPE,
        program: resolvedProgram,
        email: normalizedEmail,
        firstName: firstName || "",
        lastName: lastName || "",
      },
      payment_method_types: ["card"],
      description: ORGAN_CARE_CHECKOUT_DESCRIPTION,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
