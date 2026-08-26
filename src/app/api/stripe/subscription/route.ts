import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { activateOrganCarePublicMembership } from "@/lib/portal/organ-care-membership";
import { ORGAN_CARE_CHECKOUT_DESCRIPTION } from "@/lib/programs/organ-care-public-offer";
import {
  assertUserEligibleForCheckout,
  validateActiveBookingHold,
} from "@/lib/stripe/route-guards";
import { rejectMismatchedBodyUserId } from "@/lib/security/session-user-id";
import {
  type CheckoutProgramType,
  resolveFirstMonthCheckoutCharge,
} from "@/lib/stripe/plan-pricing";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

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

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "stripe-subscription:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await req.json();

    const userIdMismatch = await rejectMismatchedBodyUserId(body.userId);
    if (userIdMismatch) {
      return userIdMismatch;
    }

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
  programType?: CheckoutProgramType;
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
    programType = "weight_management",
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

  const eligibility = await assertUserEligibleForCheckout(userId);
  if ("error" in eligibility) {
    return eligibility.error;
  }

  // Unified checkout (WM funnel) always sends bookingHoldId, validate it when present
  if (bookingHoldId || intakeId) {
    if (!bookingHoldId) {
      return NextResponse.json(
        { error: "A valid booking hold is required before payment" },
        { status: 400 }
      );
    }

    const holdCheck = await validateActiveBookingHold(bookingHoldId, userId);
    if ("error" in holdCheck) {
      return holdCheck.error;
    }
  }

  // Server-owned pricing, client amounts are ignored
  const chargeDetails = resolveFirstMonthCheckoutCharge(programType, planId);
  if (!chargeDetails) {
    console.warn(`[STRIPE] Blocked invalid plan access attempt: ${planId}`);
    return NextResponse.json({
      error: "This pricing option is no longer available. Please select Sanative Core or Sanative Precision.",
      validPlans: ["core", "precision"],
    }, { status: 400 });
  }

  const {
    amountCents: chargeAmount,
    planName,
    selectedPlan,
    effectivePlanId,
    ongoingAmountCents,
    discountCents,
    stripePriceId,
    stripeOngoingPriceId,
  } = chargeDetails;

  const programLabel =
    programType === "weight_management"
      ? "Weight Management"
      : programType === "hair_loss"
        ? "Hair Loss"
        : programType === "mens_health"
          ? "Men's Health"
          : programType === "womens_health"
            ? "Women's Health"
            : "Weight Management";

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
      type: `${programType}_plan`,
      program: programType,
      planId: effectivePlanId,
      planName,
      userId: user.id,
      customerEmail: customerEmail || user.email,
      customerName: customerName || `${user.firstName} ${user.lastName}`.trim(),
      selectedPlan,
      firstMonthAmount: String(chargeAmount),
      ongoingAmount: String(ongoingAmountCents),
      discountAmount: String(discountCents),
      consultationDate: consultationDate || '',
      consultationTime: consultationTime || '',
      stripePriceId: stripePriceId || '',
      stripeOngoingPriceId: stripeOngoingPriceId || '',
      // GAP-004: Include booking and intake tracking
      bookingHoldId: bookingHoldId || '',
      intakeId: intakeId || '',
      journeyStatus: user.journeyStatus || 'CONSULTATION_BOOKING_STARTED',
    },
    automatic_payment_methods: { enabled: true },
    description: `Sanative ${planName} - First Month (${programLabel})`,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    customerId,
    amount: chargeAmount,
    currency: 'aud',
    planName,
    ongoingAmount: ongoingAmountCents,
    stripePriceId,
    stripeOngoingPriceId,
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

  const pricing = await getPublicOrganCareAnnualPricing();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pricing.amountCents,
    currency: 'aud',
    customer: customerId,
    metadata: {
      type: 'organ_care_membership',
      email: userEmail,
      postcode: postcode || '',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      priceId: MEMBERSHIP_PRICE_ID,
    },
    payment_method_types: ['card'],
    description: ORGAN_CARE_CHECKOUT_DESCRIPTION,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    customerId,
    amount: pricing.amountCents,
    amountAud: pricing.amountAud,
    priceLabel: pricing.priceLabel,
    currency: 'aud',
  });
}

// PUT handler for completing subscription
export async function PUT(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "stripe-subscription:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const stripe = getStripeClient();
    const body = await req.json();
    const { paymentIntentId, consentRecordId, sessionToken, firstName, lastName, email, phone, dateOfBirth, address, addressLine1, addressLine2, suburb, state, postcode } = body;

    let tokenData: { contact: string; type: string; verified: boolean; userId: string | null };
    try {
      tokenData = verify(sessionToken, JWT_SECRET) as typeof tokenData;
    } catch {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const userEmail = email || tokenData.contact;
    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      userId: tokenData.userId ?? undefined,
      email: userEmail,
    });

    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const resolvedEmail = email || paymentIntent.metadata.email || userEmail;
    const result = await activateOrganCarePublicMembership({
      paymentIntentId,
      customerId: paymentIntent.customer as string,
      email: resolvedEmail,
      firstName,
      lastName,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
    });

    return NextResponse.json({
      success: true,
      userId: result.userId,
      email: result.email,
      subscriptionStatus: "ACTIVE",
    });
  } catch (error) {
    console.error("Error completing subscription:", error);
    return NextResponse.json({ error: "Failed to complete subscription" }, { status: 500 });
  }
}
