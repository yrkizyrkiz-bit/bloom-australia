import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// GAP-015: Create ongoing subscription after doctor approval
// This is called after the doctor approves the patient
// First month was already charged via PaymentIntent, this creates the recurring subscription

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Price IDs for ongoing monthly subscriptions
const STRIPE_ONGOING_PRICES = {
  CORE: process.env.STRIPE_WM_CORE_MONTHLY_PRICE_ID,
  PRECISION: process.env.STRIPE_WM_PRECISION_MONTHLY_PRICE_ID,
};

// Plan amounts in cents
const PLAN_AMOUNTS = {
  CORE: 34900, // $349/month
  PRECISION: 49900, // $499/month
};

interface CreateSubscriptionRequest {
  userId: string;
  selectedPlan: "CORE" | "PRECISION";
  startDate?: string; // ISO date for when billing should start (defaults to ~30 days after first payment)
  firstPaymentIntentId?: string; // Reference to the first month payment
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await req.json();
    const { userId, selectedPlan, startDate, firstPaymentIntentId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!selectedPlan || !["CORE", "PRECISION"].includes(selectedPlan)) {
      return NextResponse.json({ error: "Valid plan (CORE or PRECISION) is required" }, { status: 400 });
    }

    // Get user and verify they're approved
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        approvalStatus: true,
        journeyStatus: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // GAP-015: Only create subscription if doctor has approved
    if (user.approvalStatus !== "APPROVED") {
      return NextResponse.json({
        error: "Patient must be approved by doctor before creating subscription",
        approvalStatus: user.approvalStatus,
      }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string;
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          userId: user.id,
          sanativePatient: "true",
        },
      });
      customerId = customer.id;
    }

    // Calculate billing anchor date (when subscription billing starts)
    // Default: 30 days from now (after first month is complete)
    const billingAnchor = startDate
      ? Math.floor(new Date(startDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

    // Get the Stripe price ID for the plan
    const stripePriceId = STRIPE_ONGOING_PRICES[selectedPlan];

    // Create the subscription - use price ID if available, otherwise use inline pricing
    let subscription: Stripe.Subscription;

    if (stripePriceId) {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        billing_cycle_anchor: billingAnchor,
        proration_behavior: "none",
        metadata: {
          userId: user.id,
          selectedPlan,
          sanativeProgram: "WEIGHT_MANAGEMENT",
          firstPaymentIntentId: firstPaymentIntentId || "",
          createdBy: "doctor_approval",
        },
      });
    } else {
      // Create product and price inline
      console.warn(`[STRIPE] No Stripe Price ID configured for ${selectedPlan}, creating with inline pricing`);

      const product = await stripe.products.create({
        name: `Sanative ${selectedPlan === "CORE" ? "Core" : "Precision"} - Monthly`,
        metadata: {
          sanative_plan: selectedPlan,
          type: "weight_management",
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: PLAN_AMOUNTS[selectedPlan],
        currency: "aud",
        recurring: { interval: "month" },
      });

      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        billing_cycle_anchor: billingAnchor,
        proration_behavior: "none",
        metadata: {
          userId: user.id,
          selectedPlan,
          sanativeProgram: "WEIGHT_MANAGEMENT",
          firstPaymentIntentId: firstPaymentIntentId || "",
          createdBy: "doctor_approval",
        },
      });
    }

    // Update user with subscription info (using existing schema fields)
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionTier: `sanative_${selectedPlan.toLowerCase()}`,
      },
    });

    // Log the subscription creation
    await prisma.activityLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "stripe_subscription",
        entityId: subscription.id,
        details: {
          selectedPlan,
          monthlyAmount: PLAN_AMOUNTS[selectedPlan],
          billingAnchor: new Date(billingAnchor * 1000).toISOString(),
          firstPaymentIntentId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
        },
      },
    });

    // Create internal note
    await prisma.internalNote.create({
      data: {
        userId,
        category: "BILLING",
        title: "Ongoing Subscription Created",
        content: `Monthly subscription created for Sanative ${selectedPlan}. Billing starts ${new Date(billingAnchor * 1000).toLocaleDateString("en-AU")}. Monthly amount: $${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}. Subscription ID: ${subscription.id}`,
        createdBy: "system",
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      customerId,
      selectedPlan,
      monthlyAmount: PLAN_AMOUNTS[selectedPlan],
      billingStartDate: new Date(billingAnchor * 1000).toISOString(),
      status: subscription.status,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check activity log for subscription ID
    const subscriptionActivity = await prisma.activityLog.findFirst({
      where: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "stripe_subscription",
      },
      orderBy: { createdAt: "desc" },
    });

    let stripeSubscription = null;
    const subscriptionId = (subscriptionActivity?.details as Record<string, string>)?.stripeSubscriptionId;

    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        // Access subscription data from the response
        const subData = sub as unknown as {
          id: string;
          status: string;
          current_period_end?: number;
        };
        stripeSubscription = {
          id: subData.id,
          status: subData.status,
          currentPeriodEnd: subData.current_period_end
            ? new Date(subData.current_period_end * 1000).toISOString()
            : null,
        };
      } catch {
        // Subscription may have been deleted
      }
    }

    return NextResponse.json({
      userId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionTier: user.subscriptionTier,
      approvalStatus: user.approvalStatus,
      hasActiveSubscription: stripeSubscription?.status === "active",
      stripeSubscription,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel subscription (for declined patients)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const reason = searchParams.get("reason") || "declined";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the subscription ID from activity log
    const subscriptionActivity = await prisma.activityLog.findFirst({
      where: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "stripe_subscription",
      },
      orderBy: { createdAt: "desc" },
    });

    const subscriptionId = (subscriptionActivity?.details as Record<string, string>)?.stripeSubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({
        success: true,
        message: "No subscription to cancel",
      });
    }

    // Cancel the subscription immediately
    const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "CANCELLED",
      },
    });

    // Log the cancellation
    await prisma.activityLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CANCELLED",
        entity: "stripe_subscription",
        entityId: subscriptionId,
        details: {
          reason,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: cancelledSubscription.id,
      status: cancelledSubscription.status,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
