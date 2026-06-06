import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

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

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sanative-secret-key';

// Membership price ID
const MEMBERSHIP_PRICE_ID = process.env.STRIPE_MEMBERSHIP_PRICE_ID || 'price_membership_yearly';

// ============================================
// WEIGHT MANAGEMENT STRIPE PRICE IDS
// ============================================
// These should be set in your environment variables after creating
// the products/prices in Stripe Dashboard.
//
// Required Stripe Products to Create:
// 1. "Sanative Core - First Month" - $249 AUD (one-time)
// 2. "Sanative Core - Monthly" - $349 AUD (recurring monthly)
// 3. "Sanative Precision - First Month" - $399 AUD (one-time)
// 4. "Sanative Precision - Monthly" - $499 AUD (recurring monthly)
// ============================================

const STRIPE_WM_PRICES = {
  CORE_FIRST_MONTH: process.env.STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID,
  CORE_MONTHLY: process.env.STRIPE_WM_CORE_MONTHLY_PRICE_ID,
  PRECISION_FIRST_MONTH: process.env.STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID,
  PRECISION_MONTHLY: process.env.STRIPE_WM_PRECISION_MONTHLY_PRICE_ID,
};

// Weight Management Price IDs - NEW TWO-PLAN STRUCTURE
const WM_PRICES: Record<string, {
  amount: number;
  name: string;
  duration: string;
  firstMonthAmount?: number;
  ongoingAmount?: number;
  discount?: number;
  stripePriceId?: string;
  stripeOngoingPriceId?: string;
}> = {
  // NEW: Sanative Core Plan
  sanative_core_first_month: {
    amount: 24900, // $249 first month
    name: "Sanative Core - First Month",
    duration: "first_month",
    firstMonthAmount: 24900,
    ongoingAmount: 34900,
    discount: 10000, // $100 off
    stripePriceId: STRIPE_WM_PRICES.CORE_FIRST_MONTH,
    stripeOngoingPriceId: STRIPE_WM_PRICES.CORE_MONTHLY,
  },
  sanative_core_monthly: {
    amount: 34900, // $349/month ongoing
    name: "Sanative Core - Monthly",
    duration: "monthly",
    stripePriceId: STRIPE_WM_PRICES.CORE_MONTHLY,
  },
  // NEW: Sanative Precision Plan
  sanative_precision_first_month: {
    amount: 39900, // $399 first month
    name: "Sanative Precision - First Month",
    duration: "first_month",
    firstMonthAmount: 39900,
    ongoingAmount: 49900,
    discount: 10000, // $100 off
    stripePriceId: STRIPE_WM_PRICES.PRECISION_FIRST_MONTH,
    stripeOngoingPriceId: STRIPE_WM_PRICES.PRECISION_MONTHLY,
  },
  sanative_precision_monthly: {
    amount: 49900, // $499/month ongoing
    name: "Sanative Precision - Monthly",
    duration: "monthly",
    stripePriceId: STRIPE_WM_PRICES.PRECISION_MONTHLY,
  },
  // GAP-016: Legacy plans REMOVED - no longer accessible
  // Only Sanative Core ($249/$349) and Sanative Precision ($399/$499) are valid
  //
  // Simple core/precision lookup (for quiz checkout)
  core: {
    amount: 24900,
    name: "Sanative Core",
    duration: "first_month",
    firstMonthAmount: 24900,
    ongoingAmount: 34900,
    discount: 10000,
    stripePriceId: STRIPE_WM_PRICES.CORE_FIRST_MONTH,
    stripeOngoingPriceId: STRIPE_WM_PRICES.CORE_MONTHLY,
  },
  precision: {
    amount: 39900,
    name: "Sanative Precision",
    duration: "first_month",
    firstMonthAmount: 39900,
    ongoingAmount: 49900,
    discount: 10000,
    stripePriceId: STRIPE_WM_PRICES.PRECISION_FIRST_MONTH,
    stripeOngoingPriceId: STRIPE_WM_PRICES.PRECISION_MONTHLY,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a weight management plan purchase
    if (body.userId && body.planId) {
      return handleWeightManagementPayment(body);
    }

    // Otherwise, handle original membership subscription flow
    return handleMembershipSubscription(body);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// Handle weight management plan payment
async function handleWeightManagementPayment(body: {
  userId: string;
  planId: string;
  billingType?: "one_time" | "subscription";
  selectedPlan?: "core" | "precision";
  firstMonthAmount?: number;
  ongoingMonthlyAmount?: number;
  discountAmount?: number;
  consultationDate?: string;
  consultationTime?: string;
  customerEmail?: string;
  customerName?: string;
  bookingHoldId?: string;
  intakeId?: string;
}) {
  const stripe = getStripeClient();

  const {
    userId,
    planId,
    selectedPlan,
    firstMonthAmount,
    ongoingMonthlyAmount,
    discountAmount,
    consultationDate,
    consultationTime,
    customerEmail,
    customerName,
    bookingHoldId,
    intakeId,
  } = body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, approvalStatus: true, journeyStatus: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Allow payment for users in quiz flow (LEAD or later) OR already approved users
  // GAP-007: Using valid JourneyStatus values only
  const allowedStatuses = ['LEAD', 'CONSENTED', 'SURVEY_COMPLETED', 'CONSULTATION_BOOKING_STARTED', 'CONSULTATION_BOOKED', 'PRE_TRIAGE_PENDING', 'AWAITING_DOCTOR_DECISION', 'APPROVED', 'ACTIVE'];
  const isApproved = user.approvalStatus === "APPROVED";
  const isInQuizFlow = user.journeyStatus && allowedStatuses.includes(user.journeyStatus);

  if (!isApproved && !isInQuizFlow) {
    return NextResponse.json({ error: "Please complete the assessment first" }, { status: 403 });
  }

  // GAP-016: Block legacy pricing paths - only allow core and precision
  const validPlanIds = ['core', 'precision', 'sanative_core_first_month', 'sanative_precision_first_month'];
  const effectivePlanId = selectedPlan || planId;

  if (!validPlanIds.includes(effectivePlanId)) {
    console.warn(`[STRIPE] Blocked legacy plan access attempt: ${effectivePlanId}`);
    return NextResponse.json({
      error: "This pricing option is no longer available. Please select Sanative Core or Sanative Precision.",
      validPlans: ["core", "precision"],
    }, { status: 400 });
  }

  const planDetails = WM_PRICES[effectivePlanId];
  if (!planDetails) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  // Use provided amounts or defaults from plan
  const chargeAmount = firstMonthAmount ? firstMonthAmount : planDetails.amount;
  const planName = selectedPlan === 'precision' ? 'Sanative Precision' : selectedPlan === 'core' ? 'Sanative Core' : planDetails.name;

  // Get or create Stripe customer
  let customerId: string;
  const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargeAmount,
    currency: 'aud',
    customer: customerId,
    metadata: {
      // GAP-004: Include all required Weight Management metadata
      type: 'weight_management_plan',
      program: 'weight_management',
      planId: effectivePlanId,
      planName,
      userId: user.id,
      customerEmail: customerEmail || user.email,
      customerName: customerName || `${user.firstName} ${user.lastName}`.trim(),
      selectedPlan: selectedPlan || effectivePlanId,
      firstMonthAmount: String(firstMonthAmount || planDetails.firstMonthAmount || 0),
      ongoingAmount: String(ongoingMonthlyAmount || planDetails.ongoingAmount || 0),
      discountAmount: String(discountAmount || planDetails.discount || 0),
      consultationDate: consultationDate || '',
      consultationTime: consultationTime || '',
      stripePriceId: planDetails.stripePriceId || '',
      stripeOngoingPriceId: planDetails.stripeOngoingPriceId || '',
      // GAP-004: Include booking and intake tracking
      bookingHoldId: bookingHoldId || '',
      intakeId: intakeId || '',
      journeyStatus: user.journeyStatus || 'CONSULTATION_BOOKING_STARTED',
    },
    automatic_payment_methods: { enabled: true },
    description: `Sanative ${planName} - First Month (Weight Management)`,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    customerId,
    amount: chargeAmount,
    currency: 'aud',
    planName,
    ongoingAmount: ongoingMonthlyAmount || planDetails.ongoingAmount,
    stripePriceId: planDetails.stripePriceId,
    stripeOngoingPriceId: planDetails.stripeOngoingPriceId,
  });
}

async function handleMembershipSubscription(body: {
  sessionToken: string;
  email?: string;
  postcode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const stripe = getStripeClient();
  const { sessionToken, email, postcode, firstName, lastName, phone } = body;

  let tokenData: { contact: string; type: string; verified: boolean; userId: string | null };
  try {
    tokenData = verify(sessionToken, JWT_SECRET) as typeof tokenData;
    if (!tokenData.verified) {
      return NextResponse.json({ error: "Session not verified" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const userEmail = email || (tokenData.type === 'email' ? tokenData.contact : null);
  if (!userEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });
  if (existingUser) {
    const existingSubscription = await prisma.membershipSubscription.findUnique({
      where: { userId: existingUser.id },
    });
    if (existingSubscription?.status === 'ACTIVE') {
      return NextResponse.json({ error: "You already have an active membership" }, { status: 400 });
    }
  }

  let customerId: string;
  const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
    await stripe.customers.update(customerId, {
      name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      metadata: { postcode: postcode || '', phone: phone || '' },
    });
  } else {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      metadata: { postcode: postcode || '', phone: phone || '', source: 'membership_checkout' },
    });
    customerId = customer.id;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 19900,
    currency: 'aud',
    customer: customerId,
    metadata: {
      type: 'membership_subscription',
      email: userEmail,
      postcode: postcode || '',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      priceId: MEMBERSHIP_PRICE_ID,
    },
    automatic_payment_methods: { enabled: true },
    description: 'Sanative Membership - Annual ($199/year)',
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    customerId,
    amount: 19900,
    currency: 'aud',
  });
}

// PUT handler for completing subscription
export async function PUT(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    const body = await req.json();
    const { paymentIntentId, sessionToken, firstName, lastName, email, phone, dateOfBirth, address, addressLine1, addressLine2, suburb, state, postcode } = body;

    let tokenData: { contact: string; type: string; verified: boolean; userId: string | null };
    try {
      tokenData = verify(sessionToken, JWT_SECRET) as typeof tokenData;
    } catch {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const userEmail = email || paymentIntent.metadata.email;
    let user = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: phone || user.phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : user.dateOfBirth,
          address: address || user.address,
          addressLine1: addressLine1 || user.addressLine1,
          addressLine2: addressLine2 || user.addressLine2,
          suburb: suburb || user.suburb,
          state: state || user.state,
          postcode: postcode || user.postcode,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'membership',
          journeyStatus: 'ACTIVE',
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: userEmail.toLowerCase(),
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address, addressLine1, addressLine2, suburb, state, postcode,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'membership',
          journeyStatus: 'ACTIVE',
          role: 'MEMBER',
        },
      });
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    await prisma.membershipSubscription.upsert({
      where: { userId: user.id },
      update: {
        stripeCustomerId: paymentIntent.customer as string,
        status: 'ACTIVE',
        startDate: new Date(),
        currentPeriodEnd,
        amount: 199,
        currency: 'AUD',
        billingCycle: 'yearly',
      },
      create: {
        userId: user.id,
        stripeCustomerId: paymentIntent.customer as string,
        status: 'ACTIVE',
        startDate: new Date(),
        currentPeriodEnd,
        amount: 199,
        currency: 'AUD',
        billingCycle: 'yearly',
        planName: 'Sanative Membership',
      },
    });

    return NextResponse.json({ success: true, userId: user.id, email: user.email, subscriptionStatus: 'ACTIVE' });
  } catch (error) {
    console.error("Error completing subscription:", error);
    return NextResponse.json({ error: "Failed to complete subscription" }, { status: 500 });
  }
}
