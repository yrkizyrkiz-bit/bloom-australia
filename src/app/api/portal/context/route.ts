import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { derivePortalContext } from "@/lib/portal-context";

const PAID_JOURNEY_STATUSES = [
  "CONSULTATION_PAID",
  "PRE_TRIAGE_PENDING",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
] as const;

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
        approvalStatus: true,
        passwordHash: true,
        subscriptionTier: true,
        memberStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasPaidWeightIntake =
      user.subscriptionTier === "weight_management" ||
      user.memberStatus === "MEMBER" ||
      PAID_JOURNEY_STATUSES.includes(
        user.journeyStatus as (typeof PAID_JOURNEY_STATUSES)[number]
      );

    const context = derivePortalContext({
      journeyStatus: user.journeyStatus,
      approvalStatus: user.approvalStatus,
      passwordHash: user.passwordHash,
      subscriptionTier: user.subscriptionTier,
      hasPaidWeightIntake,
    });

    return NextResponse.json(context);
  } catch (error) {
    console.error("[portal/context]", error);
    return NextResponse.json(
      { error: "Failed to load portal context" },
      { status: 500 }
    );
  }
}
