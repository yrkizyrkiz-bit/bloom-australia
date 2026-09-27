import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllEntitlements,
  grantEntitlement,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import { isProgramKey, normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";
import { PROGRAM_SLUG } from "@/lib/billing/program-slugs";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { hasProgramMembership } from "@/lib/membership/program-access";
import type { EntitlementRecord } from "@/lib/membership/entitlements";
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
} from "@/lib/membership/subscription-access";

/**
 * When a member completed the public clinical funnel quiz for a program but
 * program entitlement was wiped by membership sync, restore access and send
 * them to the program dashboard instead of the in-portal quiz/paywall.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const programKey = normalizeProgramKey(
      typeof body.programKey === "string" ? body.programKey : null
    );
    if (!programKey || !isProgramKey(programKey)) {
      return NextResponse.json({ error: "Invalid program" }, { status: 400 });
    }

    const publicQuiz = await prisma.portalQuizSubmission.findFirst({
      where: {
        userId,
        programKey,
        OR: [{ source: "public_funnel" }, { intent: "public_assessment" }],
      },
      select: { id: true },
      orderBy: { submittedAt: "desc" },
    });
    if (!publicQuiz) {
      return NextResponse.json({ entitled: false, reason: "no_public_quiz" });
    }

    const [entitlements, memberSubscriptions, user] = await Promise.all([
      getAllEntitlements(userId),
      prisma.memberSubscription.findMany({
        where: { userId },
        select: {
          status: true,
          product: { select: { program: true, slug: true, name: true, planTier: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionStatus: true },
      }),
    ]);

    const merged = mergeSubscriptionSignalsIntoEntitlements(
      entitlements.map(
        (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
      ),
      memberSubscriptions
    );
    let membership = deriveAccessMembership(merged, memberSubscriptions);

    if (!hasProgramMembership(membership, programKey)) {
      const hasMembership =
        membership.scopes.MEMBERSHIP?.hasEntitlement &&
        membership.scopes.MEMBERSHIP.status !== "INACTIVE";
      if (!hasMembership && user?.subscriptionStatus !== "ACTIVE") {
        return NextResponse.json({ entitled: false, reason: "no_membership" });
      }

      const tier = PROGRAM_SLUG[programKey as ProgramKey];
      if (user && user.subscriptionTier !== tier) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tier,
            subscriptionStatus: "ACTIVE",
          },
        });
      }

      await grantEntitlement({
        userId,
        type: "PROGRAM",
        key: programKey,
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
        notes: "Restored from public funnel quiz after membership activation",
      });
      await syncEntitlementsFromSignals(userId).catch(() => undefined);

      const refreshed = await getAllEntitlements(userId);
      membership = deriveAccessMembership(
        mergeSubscriptionSignalsIntoEntitlements(
          refreshed.map(
            (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
          ),
          memberSubscriptions
        ),
        memberSubscriptions
      );
    }

    if (!hasProgramMembership(membership, programKey)) {
      return NextResponse.json({ entitled: false, reason: "grant_failed" });
    }

    const dashboardRoute =
      PROGRAM_CARDS.find((c) => c.key === programKey)?.dashboardRoute ?? "/dashboard/programs";

    return NextResponse.json({ entitled: true, dashboardRoute });
  } catch (error) {
    console.error("[portal/ensure-funnel-program]", error);
    return NextResponse.json({ error: "Failed to restore program access" }, { status: 500 });
  }
}
