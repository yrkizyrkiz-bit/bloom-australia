import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllEntitlements } from "@/lib/membership/entitlement-service";
import {
  deriveMembershipEntitlements,
  type EntitlementRecord,
} from "@/lib/membership/entitlements";
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
} from "@/lib/membership/subscription-access";
import { getDistinctBiomarkerIdsForUser } from "@/lib/biomarkers/latest-results";

/**
 * Biomarker / lab readiness for Organ Care, Biological Clock, Health Score.
 * Loaded after first paint — not on the programs hub critical path.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [user, entitlements, memberSubscriptions, biomarkerIds, pendingLabCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { gender: true },
        }),
        getAllEntitlements(userId),
        prisma.memberSubscription.findMany({
          where: { userId },
          select: {
            status: true,
            product: { select: { program: true, slug: true, name: true, planTier: true } },
          },
        }),
        getDistinctBiomarkerIdsForUser(userId),
        prisma.labReport.count({
          where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const merged = mergeSubscriptionSignalsIntoEntitlements(
      entitlements.map(
        (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
      ),
      memberSubscriptions
    );

    // Access flags from subscriptions/grants; overlay biomarker readiness for insights.
    const access = deriveAccessMembership(merged, memberSubscriptions);
    const withReadiness = deriveMembershipEntitlements({
      entitlements: merged,
      biomarkerResults: biomarkerIds.map((biomarkerId) => ({ biomarkerId })),
      gender: user.gender,
      hasPendingResults: pendingLabCount > 0,
    });

    return NextResponse.json({
      organCare: withReadiness.organCare,
      biologicalClock: withReadiness.biologicalClock,
      healthScore: withReadiness.healthScore,
      scopes: {
        ORGAN_CARE: {
          ...access.scopes.ORGAN_CARE,
          state: withReadiness.scopes.ORGAN_CARE.state,
          readiness: undefined,
        },
        BIOLOGICAL_CLOCK: {
          ...access.scopes.BIOLOGICAL_CLOCK,
          state: withReadiness.scopes.BIOLOGICAL_CLOCK.state,
          readiness: withReadiness.biologicalClock,
        },
        HEALTH_SCORE: {
          ...access.scopes.HEALTH_SCORE,
          state: withReadiness.scopes.HEALTH_SCORE.state,
          readiness: withReadiness.healthScore,
        },
        PROGRAM_ESSENTIAL: {
          ...access.scopes.PROGRAM_ESSENTIAL,
          state: withReadiness.scopes.PROGRAM_ESSENTIAL.state,
        },
      },
      hasPendingResults: pendingLabCount > 0,
    });
  } catch (error) {
    console.error("[portal/readiness]", error);
    return NextResponse.json(
      { error: "Failed to load biomarker readiness" },
      { status: 500 }
    );
  }
}
