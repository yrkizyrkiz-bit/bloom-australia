import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Lazy-initialized Stripe client (avoids build-time errors when env var is missing)
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

const PROGRAM_NAMES: Record<string, string> = {
  weight_management: "Weight Management Consultation",
  womens_health: "Women's Health Consultation",
  mens_health: "Men's Health Consultation",
  hair_loss: "Hair Loss Consultation",
  fatty_liver: "Fatty Liver Health Consultation",
};

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    const { amount, userId, program, discount, discountType } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing Stripe customer or create one
    let customerId: string | undefined;

    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim() || undefined,
        metadata: {
          userId: user.id,
          program,
        },
      });
      customerId = customer.id;
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "aud",
      customer: customerId,
      metadata: {
        userId: user.id,
        customerEmail: user.email,
        consultationType: program,
        programName: PROGRAM_NAMES[program] || "Consultation",
        type: "membership",
        program: PROGRAM_NAMES[program] || "Consultation",
        discount: discount ? String(discount) : "0",
        discountType: discountType || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // UAT9-GAP-009: Updated fallback text from "Consultation Fee" to "Health Program"
      description: discount > 0
        ? `${PROGRAM_NAMES[program] || "Health Program"} (New Member Discount: ${discount})`
        : PROGRAM_NAMES[program] || "Health Program",
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

// Allow GET for checking status
export async function GET(req: NextRequest) {
  const paymentIntentId = req.nextUrl.searchParams.get("payment_intent");

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Missing payment_intent parameter" },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment intent" },
      { status: 500 }
    );
  }
}
