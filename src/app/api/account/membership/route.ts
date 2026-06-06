import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  billingSummaryToMembershipSummary,
  getMemberBillingSummary,
} from "@/lib/billing/member-billing-summary";
import { derivePortalContext } from "@/lib/portal-context";

const STAGE_DESCRIPTIONS: Record<string, string> = {
  CONSULTATION_PAID: "First month paid — awaiting consultation",
  PRE_TRIAGE_PENDING: "Care team reviewing your assessment",
  AWAITING_DOCTOR_CALL: "Doctor consultation scheduled",
  AWAITING_DOCTOR_DECISION: "Doctor reviewing your case",
  APPROVED: "Program approved",
  ONBOARDING_PENDING: "Welcome call scheduled",
  ONBOARDING_COMPLETE: "Onboarding complete",
  ACTIVE: "Program active",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        journeyStatus: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        memberStatus: true,
        marketingOptIn: true,
        consultationBookings: {
          where: { status: "BOOKING_CONFIRMED" },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: { scheduledAt: true, doctorName: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const billingSummary = await getMemberBillingSummary(
      session.user.id,
      STAGE_DESCRIPTIONS[user.journeyStatus]
    );

    if (!billingSummary) {
      return NextResponse.json({ error: "Failed to load billing" }, { status: 500 });
    }

    const summary = billingSummaryToMembershipSummary(billingSummary);
    const booking = user.consultationBookings[0];
    if (booking) {
      summary.consultation = {
        scheduledAt: booking.scheduledAt.toISOString(),
        doctorName: booking.doctorName,
      };
    }

    const portal = derivePortalContext({
      journeyStatus: user.journeyStatus,
      subscriptionTier: user.subscriptionTier,
      hasPaidWeightIntake: summary.firstMonth.status === "paid",
    });

    return NextResponse.json({
      ...summary,
      billing: {
        ...billingSummary,
        canRequestPrecisionUpgrade:
          billingSummary.selectedPlan === "CORE" &&
          billingSummary.program === "weight_management",
      },
      marketingOptIn: user.marketingOptIn,
      portalMode: portal.portalMode,
    });
  } catch (error) {
    console.error("[account/membership]", error);
    return NextResponse.json({ error: "Failed to load membership" }, { status: 500 });
  }
}
