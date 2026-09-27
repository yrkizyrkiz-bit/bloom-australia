import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllEntitlements } from "@/lib/membership/entitlement-service";
import {
  isProgramKey,
  isScopeKey,
  PROGRAM_LABELS,
  SCOPE_LABELS,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import { PROGRAM_OFFERS } from "@/lib/programs/offers";
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
} from "@/lib/membership/subscription-access";
import type { EntitlementRecord } from "@/lib/membership/entitlements";

/**
 * Member-facing view of subscribed programs, biomarker scopes and plans.
 * Slim access model (subscriptions + grants) — does not resync or scan labs.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [entitlements, subscriptions] = await Promise.all([
      getAllEntitlements(userId),
      prisma.memberSubscription.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          product: { select: { name: true, slug: true, planTier: true, program: true } },
        },
      }),
    ]);

    const merged = mergeSubscriptionSignalsIntoEntitlements(
      entitlements.map(
        (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
      ),
      subscriptions
    );
    const access = deriveAccessMembership(merged, subscriptions);

    const programs = (Object.keys(access.programs) as ProgramKey[])
      .filter((key) => access.programs[key].hasEntitlement || access.programs[key].status === "INACTIVE")
      .map((key) => {
        const view = access.programs[key];
        const row = entitlements.find((e) => e.type === "PROGRAM" && e.key === key);
        return {
          key,
          label: PROGRAM_LABELS[key],
          status: view.status ?? "INACTIVE",
          source: row?.source ?? "SUBSCRIPTION",
          offer: PROGRAM_OFFERS[key],
        };
      });

    const scopes = (Object.keys(access.scopes) as ScopeKey[])
      .filter((key) => access.scopes[key].hasEntitlement || access.scopes[key].status === "INACTIVE")
      .map((key) => {
        const view = access.scopes[key];
        const row = entitlements.find((e) => e.type === "SCOPE" && e.key === key);
        return {
          key,
          label: SCOPE_LABELS[key],
          status: view.status ?? "INACTIVE",
          source: row?.source ?? "SUBSCRIPTION",
        };
      });

    // Keep legacy shape for clients that filter by isProgramKey on entitlement rows.
    const entitlementPrograms = entitlements
      .filter((e) => e.type === "PROGRAM" && isProgramKey(e.key))
      .map((e) => ({
        key: e.key as ProgramKey,
        label: PROGRAM_LABELS[e.key as ProgramKey],
        status: e.status,
        source: e.source,
        offer: PROGRAM_OFFERS[e.key as ProgramKey],
      }));
    const entitlementScopes = entitlements
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

    // Prefer merged access view; fall back includes any grant-only rows already listed.
    const programKeys = new Set(programs.map((p) => p.key));
    for (const p of entitlementPrograms) {
      if (!programKeys.has(p.key)) programs.push(p);
    }
    const scopeKeys = new Set(scopes.map((s) => s.key));
    for (const s of entitlementScopes) {
      if (!scopeKeys.has(s.key)) scopes.push(s);
    }

    return NextResponse.json({ programs, scopes, plans });
  } catch (error) {
    console.error("[account/programs]", error);
    return NextResponse.json({ error: "Failed to load programs" }, { status: 500 });
  }
}
