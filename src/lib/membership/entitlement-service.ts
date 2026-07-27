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
  MEMBERSHIP_INCLUDED_SCOPES,
  PANEL_INCLUDED_SCOPES,
  normalizeProgramKey,
  normalizeScopeKey,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import {
  resolveMensHealthCanonicalKey,
  resolveWomensHealthCanonicalKey,
} from "@/lib/funnel/public-consult-programs";
import {
  hasWeightProgramContext,
  isWeightJourneyPaid,
  PAID_WEIGHT_JOURNEY_STATUSES,
} from "@/lib/membership/weight-access";

export { PAID_WEIGHT_JOURNEY_STATUSES };

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
  weightIntakePaymentStatus?: string | null;
  hasPaidWeightIntake?: boolean;
  memberProgram?: { isActive?: boolean | null } | null;
  programMembers?: Array<{
    program?: string | null;
    membershipStatus?: string | null;
    intakeData?: Record<string, unknown> | null;
  }>;
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

type ProgramMemberSignal = NonNullable<EntitlementSignalsInput["programMembers"]>[number];

/** Resolve canonical program key from intake (sexual vs vitality focus). */
export function resolveProgramMemberProgramKey(
  pm: ProgramMemberSignal
): ProgramKey | null {
  const intake = pm.intakeData ?? {};
  const canonicalRaw =
    typeof intake.canonicalProgramKey === "string" ? intake.canonicalProgramKey : null;
  if (canonicalRaw) {
    const canonical = normalizeProgramKey(canonicalRaw);
    if (canonical) return canonical;
  }

  const program = (pm.program || "").toUpperCase();
  if (program === "MENS_HEALTH") {
    const concern = typeof intake.concern === "string" ? intake.concern : "";
    if (concern) return resolveMensHealthCanonicalKey(concern);
  }
  if (program === "WOMENS_HEALTH") {
    const category = typeof intake.category === "string" ? intake.category : "";
    if (category) {
      // May be null for unsure/undiagnosed — do not fall through to Vitality default.
      return resolveWomensHealthCanonicalKey(category);
    }
  }

  return normalizeProgramKey(pm.program);
}

function resolveLegacyTierProgramKey(
  tier: string | null | undefined,
  programMembers: ProgramMemberSignal[] | undefined
): ProgramKey | null {
  const tierProgram = normalizeProgramKey(tier);
  if (!tierProgram) return null;

  const tierNorm = (tier || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  // Explicit focus in the subscription tier — never override with another ProgramMember row.
  if (tierNorm.includes("sex") && tierNorm.includes("mens")) return "MENS_HEALTH_SEXUAL";
  if (tierNorm.includes("sex") && tierNorm.includes("women")) return "WOMENS_HEALTH_SEXUAL";
  if (tierNorm.includes("vitality") && tierNorm.includes("mens")) return "MENS_HEALTH_VITALITY";
  if (tierNorm.includes("vitality") && tierNorm.includes("women")) return "WOMENS_HEALTH_VITALITY";
  if (tierNorm.includes("hair")) return "HAIR_LOSS";

  const members = programMembers || [];
  if (tierProgram === "MENS_HEALTH_VITALITY" || tierProgram === "MENS_HEALTH_SEXUAL") {
    for (const pm of members) {
      const key = resolveProgramMemberProgramKey(pm);
      if (key?.startsWith("MENS_HEALTH_")) return key;
    }
  }
  if (tierProgram === "WOMENS_HEALTH_VITALITY" || tierProgram === "WOMENS_HEALTH_SEXUAL") {
    for (const pm of members) {
      const key = resolveProgramMemberProgramKey(pm);
      if (key?.startsWith("WOMENS_HEALTH_")) return key;
    }
  }

  return tierProgram;
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
  const tierProgram = resolveLegacyTierProgramKey(tier, input.programMembers);
  const weightJourneyPaid = isWeightJourneyPaid(input);

  if (tierProgram) {
    let tierStatus = subscriptionTierStatus(input.subscriptionStatus);
    // Recurring subscription not started yet — still grant WM access after funnel payment.
    if (tierProgram === "WEIGHT_MANAGEMENT" && tierStatus === "INACTIVE" && weightJourneyPaid) {
      tierStatus = "ACTIVE";
    }
    add("PROGRAM", tierProgram, tierStatus, "LEGACY_TIER");
  }
  const tierScope = normalizeScopeKey(tier);
  if (tierScope) add("SCOPE", tierScope, subscriptionTierStatus(input.subscriptionStatus), "LEGACY_TIER");

  if (weightJourneyPaid) {
    add("PROGRAM", "WEIGHT_MANAGEMENT", "ACTIVE", "LEGACY_TIER");
  }

  // Paid weight intake implies the weight program even before tier is set.
  if (input.hasPaidWeightIntake && hasWeightProgramContext(input)) {
    add("PROGRAM", "WEIGHT_MANAGEMENT", "ACTIVE", "LEGACY_TIER");
  }

  // 2) MemberProgram (weight-management playbook) implies an active weight program.
  if (input.memberProgram?.isActive) {
    add("PROGRAM", "WEIGHT_MANAGEMENT", "ACTIVE", "PROGRAM_MEMBER");
  }

  // 3) ProgramMember rows
  for (const pm of input.programMembers || []) {
    const programKey = resolveProgramMemberProgramKey(pm);
    if (!programKey) continue;

    // When subscription tier pins a men's/women's focus, ignore stale ProgramMember rows
    // for the sibling program (e.g. vitality tier must not also grant sexual from intake).
    if (
      tierProgram?.startsWith("MENS_HEALTH_") &&
      programKey.startsWith("MENS_HEALTH_") &&
      programKey !== tierProgram
    ) {
      continue;
    }
    if (
      tierProgram?.startsWith("WOMENS_HEALTH_") &&
      programKey.startsWith("WOMENS_HEALTH_") &&
      programKey !== tierProgram
    ) {
      continue;
    }

    let status = programMemberStatus(pm.membershipStatus);
    if (programKey === "WEIGHT_MANAGEMENT" && weightJourneyPaid && status !== "INACTIVE") {
      status = "ACTIVE";
    }
    add("PROGRAM", programKey, status, "PROGRAM_MEMBER");
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

    // Every biomarker panel includes Biological Clock + Organ Care — they are
    // no longer standalone products.
    const slug = (sub.product?.slug || "").toLowerCase();
    const isPanel =
      slug.startsWith("biomarkers_") ||
      (sub.product?.program || "").toUpperCase() === "BIOLOGICAL_CLOCK";
    if (isPanel) {
      for (const scope of PANEL_INCLUDED_SCOPES) {
        add("SCOPE", scope, status, "BUNDLE");
      }
    }
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

  // 7) Sanative Membership includes the Essential panel + Biological Clock
  // (Essential covers all clock core markers). Organ Care stays a paid upgrade.
  const membership = map.get("SCOPE:MEMBERSHIP");
  if (membership) {
    for (const scope of MEMBERSHIP_INCLUDED_SCOPES) {
      add("SCOPE", scope, membership.status, "BUNDLE");
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
    select: { program: true, membershipStatus: true, intakeData: true },
  });

  const weightIntake = await prisma.weightManagementIntake.findFirst({
    where: { userId },
    select: { paymentStatus: true },
    orderBy: { createdAt: "desc" },
  });

  const journey = user.journeyStatus;
  const isWeightTier = normalizeProgramKey(user.subscriptionTier) === "WEIGHT_MANAGEMENT";
  const hasPaidWeightIntake =
    isWeightTier &&
    (weightIntake?.paymentStatus === "PAID" ||
      (journey != null && PAID_WEIGHT_JOURNEY_STATUSES.has(journey)));

  return {
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    memberStatus: user.memberStatus,
    journeyStatus: journey,
    weightIntakePaymentStatus: weightIntake?.paymentStatus ?? null,
    hasPaidWeightIntake,
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
  const upserts: Promise<unknown>[] = [];

  for (const d of desired) {
    const current = existingMap.get(`${d.type}:${d.key}`);
    // Respect manual admin grants and paid portal purchases — don't let derived sync clobber them.
    if (current?.source === "ADMIN_GRANT" || current?.source === "PORTAL_PURCHASE") continue;

    upserts.push(
      prisma.entitlement.upsert({
        where: { userId_type_key: { userId, type: d.type, key: d.key } },
        create: { userId, type: d.type, key: d.key, status: d.status, source: d.source },
        update: { status: d.status, source: d.source },
      })
    );
  }

  if (upserts.length > 0) {
    await Promise.all(upserts);
  }

  const deactivations: Promise<unknown>[] = [];
  for (const e of existing) {
    if (e.source === "ADMIN_GRANT" || e.source === "PORTAL_PURCHASE") continue;
    if (e.status === "INACTIVE") continue;
    if (!desiredMap.has(`${e.type}:${e.key}`)) {
      deactivations.push(
        prisma.entitlement.update({ where: { id: e.id }, data: { status: "INACTIVE" } })
      );
    }
  }

  if (deactivations.length > 0) {
    await Promise.all(deactivations);
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
