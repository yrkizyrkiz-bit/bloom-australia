import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllEntitlements,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import {
  isProgramKey,
  isScopeKey,
  PROGRAM_LABELS,
  SCOPE_LABELS,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import { PROGRAM_OFFERS } from "@/lib/programs/offers";

/**
 * Member-facing view of subscribed programs, biomarker scopes and plans.
 * Backed by the persisted Entitlement layer (source of truth) plus the member's
 * subscription rows for billing/plan context.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    await syncEntitlementsFromSignals(userId).catch(() => {});

    const [entitlements, subscriptions] = await Promise.all([
      getAllEntitlements(userId),
      prisma.memberSubscription.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          product: { select: { name: true, slug: true, planTier: true } },
        },
      }),
    ]);

    const programs = entitlements
      .filter((e) => e.type === "PROGRAM" && isProgramKey(e.key))
      .map((e) => ({
        key: e.key as ProgramKey,
        label: PROGRAM_LABELS[e.key as ProgramKey],
        status: e.status,
        source: e.source,
        offer: PROGRAM_OFFERS[e.key as ProgramKey],
      }));

    const scopes = entitlements
      .filter((e) => e.type === "SCOPE" && isScopeKey(e.key))
      .map((e) => ({
        key: e.key as ScopeKey,
        label: SCOPE_LABELS[e.key as ScopeKey],
        status: e.status,
        source: e.source,
      }));

    const plans = subscriptions.map((s) => ({
      id: s.id,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd,
      planTier: s.product?.planTier ?? null,
      productName: s.product?.name ?? null,
    }));

    return NextResponse.json({ programs, scopes, plans });
  } catch (error) {
    console.error("[account/programs]", error);
    return NextResponse.json({ error: "Failed to load programs" }, { status: 500 });
  }
}
