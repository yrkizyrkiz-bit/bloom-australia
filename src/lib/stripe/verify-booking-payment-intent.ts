import type Stripe from "stripe";
import {
  normalizeCheckoutProgramSlug,
  resolvePublicConsultProgramFromContext,
} from "@/lib/funnel/public-consult-programs";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  expectedVerifiedPaymentCents,
  isSanativeMembershipPaymentMetadata,
  normalizeWmSelectedPlan,
  paymentMetadataMatchesSelectedPlan,
} from "@/lib/stripe/plan-pricing";

export type VerifyFirstMonthPaymentParams = {
  paymentIntentId: string;
  userId: string;
  bookingHoldId?: string;
  consultationId?: string;
  selectedPlan?: string | null;
};

export type VerifyBookingPaymentSuccess = {
  paymentIntent: Stripe.PaymentIntent;
  expectedAmountCents: number;
  normalizedPlan: "CORE" | "PRECISION" | null;
  bookingId: string;
};

export type VerifyBookingPaymentFailure = {
  error: string;
  status: number;
};

type VerifyPaymentIntentCoreParams = {
  paymentIntentId: string;
  bookingHoldId: string;
  bookingUserId: string;
  bookingIntakeId: string | null;
  selectedPlan: string | null | undefined;
  userEmail: string;
  linkedBookingPaymentIntentId?: string | null;
};

function resolveSelectedPlanForVerification(
  bookingSelectedPlan: string | null | undefined,
  metadata: Record<string, string>
): string | null | undefined {
  return metadata.selectedPlan || metadata.planId || bookingSelectedPlan;
}

/**
 * Shared first-month payment verification for checkout confirm and doctor approval.
 * Loads booking + user context, then validates the Stripe PaymentIntent server-side.
 */
export async function verifyFirstMonthPaymentForBooking(
  params: VerifyFirstMonthPaymentParams
): Promise<VerifyBookingPaymentSuccess | VerifyBookingPaymentFailure> {
  const bookingId = params.bookingHoldId || params.consultationId;
  if (!bookingId) {
    return { error: "Booking reference is required", status: 400 };
  }

  if (!params.paymentIntentId?.trim()) {
    return { error: "Payment intent is required", status: 400 };
  }

  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      intakeId: true,
      selectedPlan: true,
      notes: true,
      paymentIntentId: true,
    },
  });

  if (!booking) {
    return { error: "Booking not found", status: 404 };
  }

  if (booking.userId && booking.userId !== params.userId) {
    return { error: "Booking does not belong to this user", status: 403 };
  }

  if (booking.paymentIntentId && booking.paymentIntentId !== params.paymentIntentId) {
    return { error: "Payment does not match booking record", status: 400 };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, email: true, subscriptionTier: true },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Payment verification is not configured", status: 503 };
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
      expand: ["latest_charge"],
    });
  } catch {
    return { error: "Invalid payment intent", status: 400 };
  }

  const paymentMetadata = paymentIntent.metadata ?? {};

  const consultProgram = resolvePublicConsultProgramFromContext({
    subscriptionTier: user.subscriptionTier,
    bookingNotes: booking.notes,
    paymentMetadata,
  });

  const selectedPlan = params.selectedPlan ?? booking.selectedPlan;

  const coreResult = await verifyPaymentIntentCore({
    paymentIntentId: params.paymentIntentId,
    bookingHoldId: bookingId,
    bookingUserId: params.userId,
    bookingIntakeId: booking.intakeId,
    selectedPlan,
    userEmail: user.email,
    consultProgram,
    linkedBookingPaymentIntentId: booking.paymentIntentId,
    paymentIntent,
  });

  if ("error" in coreResult) {
    return coreResult;
  }

  return { ...coreResult, bookingId };
}

/** @deprecated Use verifyFirstMonthPaymentForBooking */
export async function verifyBookingPaymentIntent(
  params: VerifyFirstMonthPaymentParams & {
    bookingUserId?: string;
    bookingIntakeId?: string | null;
    consultProgram?: unknown;
    userEmail?: string;
  }
): Promise<VerifyBookingPaymentSuccess | VerifyBookingPaymentFailure> {
  return verifyFirstMonthPaymentForBooking({
    paymentIntentId: params.paymentIntentId,
    userId: params.userId ?? params.bookingUserId!,
    bookingHoldId: params.bookingHoldId,
    consultationId: params.consultationId,
    selectedPlan: params.selectedPlan,
  });
}

async function verifyPaymentIntentCore(
  params: VerifyPaymentIntentCoreParams & {
    consultProgram: ReturnType<typeof resolvePublicConsultProgramFromContext>;
    paymentIntent?: Stripe.PaymentIntent;
  }
): Promise<VerifyBookingPaymentSuccess | VerifyBookingPaymentFailure> {
  const stripe = getStripe();
  if (!stripe) {
    return { error: "Payment verification is not configured", status: 503 };
  }

  let paymentIntent = params.paymentIntent;
  if (!paymentIntent) {
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
        expand: ["latest_charge"],
      });
    } catch {
      return { error: "Invalid payment intent", status: 400 };
    }
  }

  if (paymentIntent.status !== "succeeded") {
    return { error: "Payment not completed", status: 402 };
  }

  const refundError = await assertPaymentNotRefunded(stripe, paymentIntent);
  if (refundError) {
    return refundError;
  }

  const metadata = paymentIntent.metadata ?? {};
  const resolvedSelectedPlan = resolveSelectedPlanForVerification(
    params.selectedPlan,
    metadata
  );

  const isMembershipPayment = isSanativeMembershipPaymentMetadata(metadata);
  const expectedAmountCents = expectedVerifiedPaymentCents({
    metadata,
    consultProgram: params.consultProgram,
    selectedPlan: resolvedSelectedPlan,
  });

  if (paymentIntent.amount !== expectedAmountCents) {
    return { error: "Invalid payment amount", status: 400 };
  }

  if (paymentIntent.currency !== "aud") {
    return { error: "Invalid payment currency", status: 400 };
  }

  const metaUserId = metadata.userId?.trim();
  if (!metaUserId || metaUserId !== params.bookingUserId) {
    return { error: "Payment does not belong to this user", status: 403 };
  }

  const metaHoldId = metadata.bookingHoldId?.trim();
  if (metaHoldId && metaHoldId !== params.bookingHoldId) {
    return { error: "Payment does not match booking hold", status: 400 };
  }
  if (
    !metaHoldId &&
    params.linkedBookingPaymentIntentId &&
    params.linkedBookingPaymentIntentId !== params.paymentIntentId
  ) {
    return { error: "Payment does not match booking hold", status: 400 };
  }

  if (params.bookingIntakeId) {
    const metaIntakeId = metadata.intakeId?.trim();
    if (metaIntakeId && metaIntakeId !== params.bookingIntakeId) {
      return { error: "Payment does not match intake record", status: 400 };
    }
  }

  if (!isMembershipPayment && params.consultProgram.isWeightManagement) {
    const normalizedPlan = normalizeWmSelectedPlan(resolvedSelectedPlan);
    if (!paymentMetadataMatchesSelectedPlan(metadata, normalizedPlan)) {
      return { error: "Payment does not match selected plan", status: 400 };
    }
  } else if (!isMembershipPayment) {
    const metaProgram = normalizeCheckoutProgramSlug(
      metadata.program || metadata.type || ""
    );
    const expectedProgram = normalizeCheckoutProgramSlug(params.consultProgram.slug);
    if (metaProgram && metaProgram !== expectedProgram) {
      return { error: "Payment does not match program", status: 400 };
    }
  }

  const existingConfirmedBooking = await prisma.consultationBooking.findFirst({
    where: {
      paymentIntentId: params.paymentIntentId,
      status: "BOOKING_CONFIRMED",
      id: { not: params.bookingHoldId },
    },
    select: { id: true },
  });

  if (existingConfirmedBooking) {
    return { error: "Payment intent has already been used", status: 409 };
  }

  const existingPaidIntake = await prisma.weightManagementIntake.findFirst({
    where: {
      paymentIntentId: params.paymentIntentId,
      paymentStatus: "PAID",
    },
    select: { id: true, bookingId: true },
  });

  if (
    existingPaidIntake &&
    existingPaidIntake.bookingId &&
    existingPaidIntake.bookingId !== params.bookingHoldId
  ) {
    return { error: "Payment intent has already been used", status: 409 };
  }

  const customerError = await assertPaymentCustomerMatchesUser(
    stripe,
    paymentIntent,
    params.userEmail,
    params.bookingUserId
  );
  if (customerError) {
    return customerError;
  }

  return {
    paymentIntent,
    expectedAmountCents,
    normalizedPlan: params.consultProgram.isWeightManagement
      ? normalizeWmSelectedPlan(resolvedSelectedPlan)
      : null,
    bookingId: params.bookingHoldId,
  };
}

async function assertPaymentNotRefunded(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
): Promise<VerifyBookingPaymentFailure | null> {
  const latestCharge = paymentIntent.latest_charge;
  if (latestCharge) {
    const charge =
      typeof latestCharge === "string"
        ? await stripe.charges.retrieve(latestCharge)
        : latestCharge;
    if (charge.refunded) {
      return { error: "Payment has been refunded", status: 402 };
    }
    if (charge.amount_refunded > 0) {
      return { error: "Payment has been refunded", status: 402 };
    }
  }

  const refunds = await stripe.refunds.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  if (refunds.data.length > 0) {
    return { error: "Payment has been refunded", status: 402 };
  }

  return null;
}

async function assertPaymentCustomerMatchesUser(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent,
  userEmail: string,
  userId: string
): Promise<VerifyBookingPaymentFailure | null> {
  if (!paymentIntent.customer) {
    return null;
  }

  const piCustomerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer.id;

  const existing = await stripe.customers.list({ email: userEmail, limit: 10 });
  const linkedCustomer = existing.data.find(
    (customer) => customer.id === piCustomerId && customer.metadata?.userId === userId
  );
  if (linkedCustomer) {
    return null;
  }

  try {
    const customer = await stripe.customers.retrieve(piCustomerId);
    if (!("deleted" in customer && customer.deleted) && customer.metadata?.userId === userId) {
      return null;
    }
  } catch {
    // Fall through to error below
  }

  return { error: "Payment customer does not match user", status: 403 };
}
