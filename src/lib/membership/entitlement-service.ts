/**
 * Entitlement service: the persisted source of truth for membership access.
 *
 * `computeDesiredEntitlements` is pure (easy to unit test) and reconciles the
 * legacy access signals into a canonical desired set. `syncEntitlementsFromSignals`
 * loads those signals from Prisma and upserts the `Entitlement` rows.
 */

import { prisma } from "@/lib/prisma";
import {
  COMPLETE_HEALTH_SCOPES,
  normalizeProgramKey,
  normalizeScopeKey,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";

export type EntitlementTypeValue = "PROGRAM" | "SCOPE";
export type EntitlementStatusValue = "ACTIVE" | "PENDING" | "INACTIVE";
export type EntitlementSourceValue =
  | "SUBSCRIPTION"
  | "PROGRAM_MEMBER"
  | "LEGACY_TIER"
  | "ADMIN_GRANT"
  | "BUNDLE"
  | "PORTAL_PURCHASE";

export type DesiredEntitlement = {
  type: EntitlementTypeValue;
  key: ProgramKey | ScopeKey;
  status: EntitlementStatusValue;
  source: EntitlementSourceValue;
};

export type EntitlementSignalsInput = {
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  memberStatus?: string | null;
  journeyStatus?: string | null;
  hasPaidWeightIntake?: boolean;
  memberProgram?: { isActive?: boolean | null } | null;
  programMembers?: Array<{ program?: string | null; membershipStatus?: string | null }>;
  memberSubscriptions?: Array<{
    status?: string | null;
    product?: {
      slug?: string | null;
      name?: string | null;
      program?: string | null;
      planTier?: string | null;
    } | null;
  }>;
};

const STATUS_PRIORITY: Record<EntitlementStatusValue, number> = {
  ACTIVE: 3,
  PENDING: 2,
  INACTIVE: 1,
};

function strongerStatus(
  a: EntitlementStatusValue,
  b: EntitlementStatusValue
): EntitlementStatusValue {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

function subscriptionTierStatus(status?: string | null): EntitlementStatusValue {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE" || s === "TRIAL") return "ACTIVE";
  if (s === "CANCELLED" || s === "EXPIRED" || s === "INACTIVE") return "INACTIVE";
  return "PENDING";
}

function memberSubscriptionStatus(status?: string | null): EntitlementStatusValue {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "ACTIVE";
  if (s === "PAST_DUE") return "PENDING";
  if (s === "CANCELLED" || s === "EXPIRED") return "INACTIVE";
  return "PENDING";
}

function programMemberStatus(status?: string | null): EntitlementStatusValue {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "ACTIVE";
  if (s === "PENDING") return "PENDING";
  if (s === "CANCELLED" || s === "EXPIRED" || s === "PAST_DUE") return "INACTIVE";
  return "PENDING";
}

/**
 * Pure reconciliation of legacy signals into the canonical desired entitlement set.
 * Same (type,key) seen from multiple sources keeps the strongest status.
 */
export function computeDesiredEntitlements(input: EntitlementSignalsInput): DesiredEntitlement[] {
  const map = new Map<string, DesiredEntitlement>();

  const add = (
    type: EntitlementTypeValue,
    key: ProgramKey | ScopeKey,
    status: EntitlementStatusValue,
    source: EntitlementSourceValue
  ) => {
    const mapKey = `${type}:${key}`;
    const existing = map.get(mapKey);
    if (!existing) {
      map.set(mapKey, { type, key, status, source });
      return;
    }
    const merged = strongerStatus(existing.status, status);
    // Adopt the source that produced the (now) chosen status.
    const source2 = merged === status && STATUS_PRIORITY[status] > STATUS_PRIORITY[existing.status]
      ? source
      : existing.source;
    map.set(mapKey, { type, key, status: merged, source: source2 });
  };

  // 1) Legacy subscriptionTier -> program + scope
  const tier = input.subscriptionTier;
  const tierProgram = normalizeProgramKey(tier);
  if (tierProgram) add("PROGRAM", tierProgram, subscriptionTierStatus(input.subscriptionStatus), "LEGACY_TIER");
  const tierScope = normalizeScopeKey(tier);
  if (tierScope) add("SCOPE", tierScope, subscriptionTierStatus(input.subscriptionStatus), "LEGACY_TIER");

  // Paid weight intake implies the weight program even before tier is set.
  if (input.hasPaidWeightIntake) {
    add("PROGRAM", "WEIGHT_MANAGEMENT", "ACTIVE", "LEGACY_TIER");
  }

  // 2) MemberProgram (weight-management playbook) implies an active weight program.
  if (input.memberProgram?.isActive) {
    add("PROGRAM", "WEIGHT_MANAGEMENT", "ACTIVE", "PROGRAM_MEMBER");
  }

  // 3) ProgramMember rows
  for (const pm of input.programMembers || []) {
    const programKey = normalizeProgramKey(pm.program);
    if (programKey) add("PROGRAM", programKey, programMemberStatus(pm.membershipStatus), "PROGRAM_MEMBER");
  }

  // 4) MemberSubscription rows (product text -> program and/or scope)
  for (const sub of input.memberSubscriptions || []) {
    const status = memberSubscriptionStatus(sub.status);
    const text = [
      sub.product?.slug,
      sub.product?.name,
      sub.product?.program,
      sub.product?.planTier,
    ]
      .filter(Boolean)
      .join(" ");
    const programKey = normalizeProgramKey(text);
    if (programKey) add("PROGRAM", programKey, status, "SUBSCRIPTION");
    const scopeKey = normalizeScopeKey(text);
    if (scopeKey) add("SCOPE", scopeKey, status, "SUBSCRIPTION");
  }

  // 5) Any program grants Program Essential biomarker visibility.
  const programs = Array.from(map.values()).filter((e) => e.type === "PROGRAM");
  if (programs.length > 0) {
    const best = programs.reduce((a, b) => (strongerStatus(a.status, b.status) === a.status ? a : b));
    add("SCOPE", "PROGRAM_ESSENTIAL", best.status, best.source);
  }

  // 6) Complete Health expands into its component scopes.
  const complete = map.get("SCOPE:COMPLETE_HEALTH");
  if (complete) {
    for (const scope of COMPLETE_HEALTH_SCOPES) {
      add("SCOPE", scope, complete.status, "BUNDLE");
    }
  }

  return Array.from(map.values());
}

/** Active (non-expired) persisted entitlements for a user. */
export async function getActiveEntitlements(userId: string) {
  const now = new Date();
  return prisma.entitlement.findMany({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

/** All persisted entitlements for a user (any status). */
export async function getAllEntitlements(userId: string) {
  return prisma.entitlement.findMany({ where: { userId } });
}

async function loadSignals(userId: string): Promise<EntitlementSignalsInput | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      memberStatus: true,
      journeyStatus: true,
      memberProgram: { select: { isActive: true } },
      memberSubscriptions: {
        select: {
          status: true,
          product: { select: { slug: true, name: true, program: true, planTier: true } },
        },
      },
    },
  });
  if (!user) return null;

  const programMembers = await prisma.programMember.findMany({
    where: { userId },
    select: { program: true, membershipStatus: true },
  });

  return {
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    memberStatus: user.memberStatus,
    journeyStatus: user.journeyStatus,
    memberProgram: user.memberProgram,
    memberSubscriptions: user.memberSubscriptions,
    programMembers,
  };
}

/**
 * Reconcile a user's persisted entitlements from their current legacy signals.
 * Idempotent. Admin-granted rows are never overwritten or deactivated.
 */
export async function syncEntitlementsFromSignals(userId: string): Promise<void> {
  const signals = await loadSignals(userId);
  if (!signals) return;

  const desired = computeDesiredEntitlements(signals);
  const existing = await getAllEntitlements(userId);
  const existingMap = new Map(existing.map((e) => [`${e.type}:${e.key}`, e]));
  const desiredMap = new Map(desired.map((d) => [`${d.type}:${d.key}`, d]));

  for (const d of desired) {
    const current = existingMap.get(`${d.type}:${d.key}`);
    // Respect manual admin grants and paid portal purchases — don't let derived sync clobber them.
    if (current?.source === "ADMIN_GRANT" || current?.source === "PORTAL_PURCHASE") continue;

    await prisma.entitlement.upsert({
      where: { userId_type_key: { userId, type: d.type, key: d.key } },
      create: { userId, type: d.type, key: d.key, status: d.status, source: d.source },
      update: { status: d.status, source: d.source },
    });
  }

  // Deactivate derived rows that no longer have any supporting signal.
  for (const e of existing) {
    if (e.source === "ADMIN_GRANT" || e.source === "PORTAL_PURCHASE") continue;
    if (e.status === "INACTIVE") continue;
    if (!desiredMap.has(`${e.type}:${e.key}`)) {
      await prisma.entitlement.update({ where: { id: e.id }, data: { status: "INACTIVE" } });
    }
  }
}

/** Manually grant an entitlement (admin / in-portal checkout). */
export async function grantEntitlement(params: {
  userId: string;
  type: EntitlementTypeValue;
  key: ProgramKey | ScopeKey;
  source?: EntitlementSourceValue;
  status?: EntitlementStatusValue;
  expiresAt?: Date | null;
  notes?: string | null;
}) {
  const { userId, type, key } = params;
  const entitlement = (prisma as unknown as Record<string, { upsert?: unknown } | undefined>)
    .entitlement;
  if (typeof entitlement?.upsert !== "function") {
    throw new Error(
      "Entitlement model is unavailable. Run `bun run db:generate` and restart the dev server."
    );
  }

  return entitlement.upsert({
    where: { userId_type_key: { userId, type, key } },
    create: {
      userId,
      type,
      key,
      status: params.status ?? "ACTIVE",
      source: params.source ?? "ADMIN_GRANT",
      expiresAt: params.expiresAt ?? null,
      notes: params.notes ?? null,
    },
    update: {
      status: params.status ?? "ACTIVE",
      source: params.source ?? "ADMIN_GRANT",
      expiresAt: params.expiresAt ?? null,
      ...(params.notes !== undefined ? { notes: params.notes } : {}),
    },
  });
}

/** Mark an entitlement inactive. */
export async function revokeEntitlement(params: {
  userId: string;
  type: EntitlementTypeValue;
  key: ProgramKey | ScopeKey;
}) {
  const { userId, type, key } = params;
  return prisma.entitlement.updateMany({
    where: { userId, type, key },
    data: { status: "INACTIVE" },
  });
}
