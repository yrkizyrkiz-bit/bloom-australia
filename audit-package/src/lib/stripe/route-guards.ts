import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasClinicalStaffRole } from "@/lib/auth/require-clinical-staff";
import { isProductionEnvironment } from "@/lib/security/environment";

export { isProductionEnvironment };

/** Block diagnostic / test Stripe routes in production. */
export function blockStripeTestRouteInProduction() {
  if (isProductionEnvironment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

const CHECKOUT_JOURNEY_STATUSES = new Set([
  "LEAD",
  "CONSENTED",
  "SURVEY_COMPLETED",
  "CONSULTATION_BOOKING_STARTED",
  "CONSULTATION_BOOKED",
  "PRE_TRIAGE_PENDING",
  "AWAITING_DOCTOR_DECISION",
  "APPROVED",
  "ACTIVE",
]);

export async function assertUserEligibleForCheckout(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      approvalStatus: true,
      journeyStatus: true,
    },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) } as const;
  }

  const isApproved = user.approvalStatus === "APPROVED";
  const isInQuizFlow =
    !!user.journeyStatus && CHECKOUT_JOURNEY_STATUSES.has(user.journeyStatus);

  if (!isApproved && !isInQuizFlow) {
    return {
      error: NextResponse.json(
        { error: "Please complete the assessment first" },
        { status: 403 }
      ),
    } as const;
  }

  return { user } as const;
}

export async function validateActiveBookingHold(bookingHoldId: string, userId: string) {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingHoldId },
    select: {
      id: true,
      userId: true,
      status: true,
      holdExpiresAt: true,
    },
  });

  if (!booking) {
    return {
      error: NextResponse.json({ error: "Invalid booking hold" }, { status: 400 }),
    } as const;
  }

  if (booking.userId && booking.userId !== userId) {
    return {
      error: NextResponse.json({ error: "Booking hold does not match user" }, { status: 403 }),
    } as const;
  }

  if (booking.status !== "SLOT_HELD") {
    return {
      error: NextResponse.json({ error: "Booking hold is no longer active" }, { status: 400 }),
    } as const;
  }

  if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    return {
      error: NextResponse.json({ error: "Booking hold has expired" }, { status: 400 }),
    } as const;
  }

  return { booking } as const;
}

/** Allow payment intent lookup only for the owning patient or clinical staff. */
export async function assertCanAccessPaymentIntent(paymentIntentUserId: string | undefined) {
  if (!paymentIntentUserId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    if (hasClinicalStaffRole(session.user.role)) {
      return { session } as const;
    }
    if (session.user.id === paymentIntentUserId) {
      return { session } as const;
    }
  }

  return {
    error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  } as const;
}
