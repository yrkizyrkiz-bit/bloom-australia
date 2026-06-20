import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { ORGAN_CARE_CHECKOUT_DESCRIPTION } from "@/lib/programs/organ-care-public-offer";

// Lazy-initialized Stripe client (avoids build-time errors when env var is missing)
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeClient;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const body = await request.json();
    const { email, firstName, lastName, program } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`.trim() || undefined,
        metadata: {
          program: program || "general",
        },
      });
    }

    const pricing = await getPublicOrganCareAnnualPricing();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountCents,
      currency: "aud",
      customer: customer.id,
      metadata: {
        type: "organ_care_membership",
        program: program || "organ_care",
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
