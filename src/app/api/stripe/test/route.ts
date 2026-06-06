import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy-initialized Stripe client (avoids build-time errors when env var is missing)
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil",
    });
  }
  return stripeClient;
}

// Test endpoint to verify Stripe integration
// GET /api/stripe/test
export async function GET() {
  try {
    // 1. Verify API key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: "STRIPE_SECRET_KEY not configured",
        step: "config_check"
      }, { status: 500 });
    }

    const stripe = getStripeClient();

    // 2. Test creating a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 24900, // $249.00 AUD (Sanative Core first month)
      currency: "aud",
      metadata: {
        test: "true",
        plan: "sanative_core_first_month",
        timestamp: new Date().toISOString(),
      },
      description: "Stripe Integration Test - Sanative Weight Management",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 3. Return success with test info
    return NextResponse.json({
      success: true,
      message: "Stripe integration working correctly",
      test_payment_intent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret_preview: paymentIntent.client_secret?.slice(0, 20) + "...",
      },
      test_cards: {
        success: "4242 4242 4242 4242",
        decline: "4000 0000 0000 0002",
        requires_auth: "4000 0025 0000 3155",
        insufficient_funds: "4000 0000 0000 9995",
        note: "Use any future date for expiry, any 3 digits for CVC, any postcode",
      },
      instructions: [
        "1. Go to /weight-management/assessment",
        "2. Complete the quiz to step 20 (booking)",
        "3. Select a time slot and continue to payment",
        "4. Use test card 4242 4242 4242 4242 to test successful payment",
        "5. Check that booking is confirmed after payment",
      ],
    });
  } catch (error) {
    console.error("Stripe test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      step: "payment_intent_creation",
    }, { status: 500 });
  }
}
