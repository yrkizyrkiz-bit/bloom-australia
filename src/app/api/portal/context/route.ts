import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { derivePortalContext } from "@/lib/portal-context";
import {
  getAllEntitlements,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import { PAID_WEIGHT_JOURNEY_STATUSES } from "@/lib/membership/weight-access";
import { normalizeProgramKey } from "@/lib/membership/keys";
import {
  deriveMembershipEntitlements,
  type EntitlementRecord,
} from "@/lib/membership/entitlements";

const PAID_JOURNEY_STATUSES = Array.from(PAID_WEIGHT_JOURNEY_STATUSES);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        journeyStatus: true,
        approvalStatus: true,
        passwordHash: true,
        subscriptionTier: true,
        memberStatus: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isWeightTier = normalizeProgramKey(user.subscriptionTier) === "WEIGHT_MANAGEMENT";
    const hasPaidWeightIntake =
      isWeightTier &&
      PAID_JOURNEY_STATUSES.includes(user.journeyStatus || "");

    // Derive membership entitlements: reconcile persisted rows from current
    // signals (idempotent), then combine with biomarker coverage.
    let membership;
    try {
      await syncEntitlementsFromSignals(userId);
      const [entitlements, biomarkerResults, pendingLabCount] = await Promise.all([
        getAllEntitlements(userId),
        prisma.biomarkerResult.findMany({
          where: { userId },
          select: { biomarkerId: true, testedAt: true },
          orderBy: { testedAt: "desc" },
        }),
        prisma.labReport.count({
          where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
        }),
      ]);

      membership = deriveMembershipEntitlements({
        entitlements: entitlements.map(
          (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
        ),
        biomarkerResults,
        gender: user.gender,
        hasPendingResults: pendingLabCount > 0,
      });
    } catch (membershipError) {
      console.error("[portal/context] membership derivation failed", membershipError);
    }

    const context = derivePortalContext({
      journeyStatus: user.journeyStatus,
      approvalStatus: user.approvalStatus,
      passwordHash: user.passwordHash,
      subscriptionTier: user.subscriptionTier,
      hasPaidWeightIntake,
      membership,
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
