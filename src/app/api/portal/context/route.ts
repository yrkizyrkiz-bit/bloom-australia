import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { derivePortalContext } from "@/lib/portal-context";
import { getAllEntitlements } from "@/lib/membership/entitlement-service";
import { PAID_WEIGHT_JOURNEY_STATUSES } from "@/lib/membership/weight-access";
import { normalizeProgramKey } from "@/lib/membership/keys";
import type { EntitlementRecord } from "@/lib/membership/entitlements";
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
} from "@/lib/membership/subscription-access";
import { OPEN_CONSULTATION_BOOKING_STATUSES } from "@/lib/program-journey/upcoming-consultation";

const PAID_JOURNEY_STATUSES = Array.from(PAID_WEIGHT_JOURNEY_STATUSES);

/**
 * Slim portal context for programs hub / nav: entitlements + MemberSubscriptions only.
 * Biomarker readiness lives on GET /api/portal/readiness.
 * Does not run syncEntitlementsFromSignals (write path is checkout/webhook/admin).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [user, entitlements, memberSubscriptions, pendingPortalUpsell, openBooking] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            journeyStatus: true,
            approvalStatus: true,
            passwordHash: true,
            subscriptionTier: true,
            memberStatus: true,
            gender: true,
          },
        }),
        getAllEntitlements(userId),
        prisma.memberSubscription.findMany({
          where: { userId },
          select: {
            status: true,
            product: { select: { program: true, slug: true, name: true, planTier: true } },
          },
        }),
        prisma.preTriageTask.findFirst({
          where: {
            patientId: userId,
            status: "PENDING",
            appointmentConfirmed: false,
            notes: { contains: "portal_upsell" },
          },
          select: { id: true },
        }),
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            completedAt: null,
            status: { in: [...OPEN_CONSULTATION_BOOKING_STATUSES] },
          },
          select: { id: true },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isWeightTier = normalizeProgramKey(user.subscriptionTier) === "WEIGHT_MANAGEMENT";
    const hasPaidWeightIntake =
      isWeightTier && PAID_JOURNEY_STATUSES.includes(user.journeyStatus || "");

    let membership;
    try {
      const merged = mergeSubscriptionSignalsIntoEntitlements(
        entitlements.map(
          (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
        ),
        memberSubscriptions
      );
      membership = deriveAccessMembership(merged, memberSubscriptions);
    } catch (membershipError) {
      console.error("[portal/context] membership derivation failed", membershipError);
    }

    const awaitingConsultationArrangement =
      Boolean(pendingPortalUpsell) && !openBooking;

    const context = derivePortalContext({
      journeyStatus: user.journeyStatus,
      approvalStatus: user.approvalStatus,
      passwordHash: user.passwordHash,
      subscriptionTier: user.subscriptionTier,
      gender: user.gender,
      hasPaidWeightIntake,
      membership,
    });

    return NextResponse.json({
      ...context,
      awaitingConsultationArrangement,
    });
  } catch (error) {
    console.error("[portal/context]", error);
    return NextResponse.json(
      { error: "Failed to load portal context" },
      { status: 500 }
    );
  }
}
