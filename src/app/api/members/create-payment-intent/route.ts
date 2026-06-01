import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(request: NextRequest) {
  try {
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

    // Create payment intent for $199 membership
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 19900, // $199.00 in cents
      currency: "aud",
      customer: customer.id,
      metadata: {
        type: "membership",
        program: program || "general",
        firstName: firstName || "",
        lastName: lastName || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
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
