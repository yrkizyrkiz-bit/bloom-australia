/**
 * Subscription/grant-only access for programs and scopes.
 * Biomarker readiness is intentionally excluded — that lives on /api/portal/readiness.
 */

import {
  COMPLETE_HEALTH_SCOPES,
  MEMBERSHIP_INCLUDED_SCOPES,
  PANEL_INCLUDED_SCOPES,
  PROGRAM_KEYS,
  PROGRAM_LABELS,
  SCOPE_KEYS,
  SCOPE_LABELS,
  normalizeProgramKey,
  normalizeScopeKey,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import type {
  DerivedMembershipEntitlements,
  EntitlementRecord,
  EntitlementStatusValue,
  ProgramEntitlementView,
  ScopeEntitlementView,
  SubscriptionBillingStatus,
} from "@/lib/membership/entitlements";
import type { EntitlementState, OrganCareArea, ReadinessAssessment } from "@/lib/membership/biomarker-readiness";
import { ORGAN_CARE_MARKER_SETS } from "@/lib/membership/biomarker-readiness";

export type MemberSubscriptionSignal = {
  status?: string | null;
  product?: {
    slug?: string | null;
    name?: string | null;
    program?: string | null;
    planTier?: string | null;
  } | null;
};

const STATUS_PRIORITY: Record<EntitlementStatusValue, number> = {
  ACTIVE: 3,
  PENDING: 2,
  INACTIVE: 1,
};

const BILLING_PRIORITY: Record<SubscriptionBillingStatus, number> = {
  ACTIVE: 3,
  PAST_DUE: 2,
  INACTIVE: 1,
};

/** Map Stripe/MembershipStatus onto EntitlementStatus. PAST_DUE stays enrolled. */
export function memberSubscriptionToEntitlementStatus(
  status?: string | null
): EntitlementStatusValue {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE" || s === "PAST_DUE" || s === "TRIAL") return "ACTIVE";
  if (s === "CANCELLED" || s === "EXPIRED" || s === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

/** Preserve overdue distinctly for program UI badges. */
export function memberSubscriptionToBillingStatus(
  status?: string | null
): SubscriptionBillingStatus {
  const s = (status || "").toUpperCase();
  if (s === "PAST_DUE") return "PAST_DUE";
  if (s === "ACTIVE" || s === "TRIAL") return "ACTIVE";
  if (s === "CANCELLED" || s === "EXPIRED" || s === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

function strongerStatus(
  a: EntitlementStatusValue,
  b: EntitlementStatusValue
): EntitlementStatusValue {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

function strongerBilling(
  a: SubscriptionBillingStatus,
  b: SubscriptionBillingStatus
): SubscriptionBillingStatus {
  return BILLING_PRIORITY[a] >= BILLING_PRIORITY[b] ? a : b;
}

function accessState(status: EntitlementStatusValue | null, hasRow: boolean): EntitlementState {
  if (!hasRow) return "locked_upgrade";
  if (status === "INACTIVE") return "inactive";
  return "ready";
}

const EMPTY_COVERAGE = {
  required: [] as string[],
  available: [] as string[],
  missing: [] as string[],
  availableCount: 0,
  requiredCount: 0,
};

function stubReadiness(state: EntitlementState, reason: string): ReadinessAssessment {
  return { state, coverage: EMPTY_COVERAGE, readyReason: reason };
}

function putBilling(
  map: Map<string, SubscriptionBillingStatus>,
  type: "PROGRAM" | "SCOPE",
  key: string,
  status: SubscriptionBillingStatus
) {
  const mapKey = `${type}:${key}`;
  const existing = map.get(mapKey);
  map.set(mapKey, existing ? strongerBilling(existing, status) : status);
}

/** Per-program/scope billing status from live MemberSubscription rows. */
export function collectSubscriptionBillingStatuses(
  subscriptions: MemberSubscriptionSignal[]
): Map<string, SubscriptionBillingStatus> {
  const map = new Map<string, SubscriptionBillingStatus>();

  for (const sub of subscriptions) {
    const billing = memberSubscriptionToBillingStatus(sub.status);
    const text = [sub.product?.slug, sub.product?.name, sub.product?.program, sub.product?.planTier]
      .filter(Boolean)
      .join(" ");
    const programKey = normalizeProgramKey(text);
    if (programKey) putBilling(map, "PROGRAM", programKey, billing);
    const scopeKey = normalizeScopeKey(text) || normalizeScopeKey(sub.product?.program || "");
    if (scopeKey) putBilling(map, "SCOPE", scopeKey, billing);

    const slug = (sub.product?.slug || "").toLowerCase();
    const isPanel =
      slug.startsWith("biomarkers_") ||
      (sub.product?.program || "").toUpperCase() === "BIOLOGICAL_CLOCK";
    if (isPanel) {
      for (const scope of PANEL_INCLUDED_SCOPES) putBilling(map, "SCOPE", scope, billing);
    }
  }

  const membership = map.get("SCOPE:MEMBERSHIP");
  if (membership) {
    for (const scope of MEMBERSHIP_INCLUDED_SCOPES) putBilling(map, "SCOPE", scope, membership);
  }

  const complete = map.get("SCOPE:COMPLETE_HEALTH");
  if (complete) {
    for (const scope of COMPLETE_HEALTH_SCOPES) putBilling(map, "SCOPE", scope, complete);
  }

  return map;
}

/**
 * Merge persisted entitlement rows with live MemberSubscription rows.
 * Subscriptions win for billing truth; ACTIVE grants (PORTAL_PURCHASE etc.) stay if stronger.
 */
export function mergeSubscriptionSignalsIntoEntitlements(
  entitlements: EntitlementRecord[],
  subscriptions: MemberSubscriptionSignal[]
): EntitlementRecord[] {
  const map = new Map<string, EntitlementRecord>();

  const put = (type: "PROGRAM" | "SCOPE", key: string, status: EntitlementStatusValue) => {
    const mapKey = `${type}:${key}`;
    const existing = map.get(mapKey);
    if (!existing) {
      map.set(mapKey, { type, key, status });
      return;
    }
    map.set(mapKey, { type, key, status: strongerStatus(existing.status, status) });
  };

  for (const row of entitlements) {
    put(row.type, row.key, row.status);
  }

  for (const sub of subscriptions) {
    const status = memberSubscriptionToEntitlementStatus(sub.status);
    const text = [sub.product?.slug, sub.product?.name, sub.product?.program, sub.product?.planTier]
      .filter(Boolean)
      .join(" ");
    const programKey = normalizeProgramKey(text);
    if (programKey) put("PROGRAM", programKey, status);
    const scopeKey = normalizeScopeKey(text) || normalizeScopeKey(sub.product?.program || "");
    if (scopeKey) put("SCOPE", scopeKey, status);

    const slug = (sub.product?.slug || "").toLowerCase();
    const isPanel =
      slug.startsWith("biomarkers_") ||
      (sub.product?.program || "").toUpperCase() === "BIOLOGICAL_CLOCK";
    if (isPanel) {
      for (const scope of PANEL_INCLUDED_SCOPES) put("SCOPE", scope, status);
    }
  }

  const programs = Array.from(map.values()).filter((e) => e.type === "PROGRAM");
  if (programs.length > 0) {
    const best = programs.reduce((a, b) =>
      strongerStatus(a.status, b.status) === a.status ? a : b
    );
    put("SCOPE", "PROGRAM_ESSENTIAL", best.status);
  }

  const complete = map.get("SCOPE:COMPLETE_HEALTH");
  if (complete) {
    for (const scope of COMPLETE_HEALTH_SCOPES) put("SCOPE", scope, complete.status);
  }

  const membership = map.get("SCOPE:MEMBERSHIP");
  if (membership) {
    for (const scope of MEMBERSHIP_INCLUDED_SCOPES) put("SCOPE", scope, membership.status);
  }

  return Array.from(map.values());
}

/**
 * Customer-facing membership for programs/nav: subscription/grant access only.
 * No biomarker coverage, no pending_results / partial for programs or Organ Care tiles.
 * `subscriptions` supply PAST_DUE for "Enrolled · payment overdue" badges.
 */
export function deriveAccessMembership(
  entitlements: EntitlementRecord[],
  subscriptions: MemberSubscriptionSignal[] = []
): DerivedMembershipEntitlements {
  const byKey = (type: "PROGRAM" | "SCOPE", key: string) =>
    entitlements.find((e) => e.type === type && e.key === key);
  const billing = collectSubscriptionBillingStatuses(subscriptions);

  const programs = {} as Record<ProgramKey, ProgramEntitlementView>;
  for (const key of PROGRAM_KEYS) {
    const row = byKey("PROGRAM", key);
    const status = row?.status ?? null;
    const hasEntitlement = Boolean(row && row.status !== "INACTIVE");
    const state = accessState(status, Boolean(row));
    programs[key] = {
      key,
      label: PROGRAM_LABELS[key],
      state,
      hasEntitlement,
      status,
      subscriptionStatus: billing.get(`PROGRAM:${key}`) ?? null,
      readiness: stubReadiness(
        state,
        hasEntitlement ? "Program access from subscription or grant." : "Program not purchased."
      ),
    };
  }

  const scopeFlags = (key: ScopeKey) => {
    const row = byKey("SCOPE", key);
    const status = row?.status ?? null;
    const hasEntitlement = Boolean(row && row.status !== "INACTIVE");
    const state = accessState(status, Boolean(row));
    return {
      status,
      hasEntitlement,
      state,
      subscriptionStatus: billing.get(`SCOPE:${key}`) ?? null,
    };
  };

  const membership = scopeFlags("MEMBERSHIP");
  const organ = scopeFlags("ORGAN_CARE");
  const clock = scopeFlags("BIOLOGICAL_CLOCK");
  const score = scopeFlags("HEALTH_SCORE");
  const essential = scopeFlags("PROGRAM_ESSENTIAL");
  const complete = scopeFlags("COMPLETE_HEALTH");

  const organCare = {} as Record<OrganCareArea, ReadinessAssessment>;
  for (const area of Object.keys(ORGAN_CARE_MARKER_SETS) as OrganCareArea[]) {
    organCare[area] = stubReadiness(
      organ.state,
      organ.hasEntitlement ? "Organ Care access from subscription." : "Organ Care not purchased."
    );
  }

  const biologicalClock = stubReadiness(
    clock.state,
    clock.hasEntitlement ? "Biological Clock access from subscription." : "Biological Clock not purchased."
  );

  const healthScore = {
    ...stubReadiness(
      score.state,
      score.hasEntitlement ? "Health Score access from subscription." : "Health Score not purchased."
    ),
    categories: organCare,
    readyCategoryCount: 0,
  };

  const scopes: Record<ScopeKey, ScopeEntitlementView> = {
    MEMBERSHIP: {
      key: "MEMBERSHIP",
      label: SCOPE_LABELS.MEMBERSHIP,
      state: membership.state,
      hasEntitlement: membership.hasEntitlement,
      status: membership.status,
      subscriptionStatus: membership.subscriptionStatus,
    },
    PROGRAM_ESSENTIAL: {
      key: "PROGRAM_ESSENTIAL",
      label: SCOPE_LABELS.PROGRAM_ESSENTIAL,
      state: essential.state,
      hasEntitlement: essential.hasEntitlement,
      status: essential.status,
      subscriptionStatus: essential.subscriptionStatus,
    },
    ORGAN_CARE: {
      key: "ORGAN_CARE",
      label: SCOPE_LABELS.ORGAN_CARE,
      state: organ.state,
      hasEntitlement: organ.hasEntitlement,
      status: organ.status,
      subscriptionStatus: organ.subscriptionStatus,
    },
    BIOLOGICAL_CLOCK: {
      key: "BIOLOGICAL_CLOCK",
      label: SCOPE_LABELS.BIOLOGICAL_CLOCK,
      state: clock.state,
      hasEntitlement: clock.hasEntitlement,
      status: clock.status,
      subscriptionStatus: clock.subscriptionStatus,
      readiness: biologicalClock,
    },
    HEALTH_SCORE: {
      key: "HEALTH_SCORE",
      label: SCOPE_LABELS.HEALTH_SCORE,
      state: score.state,
      hasEntitlement: score.hasEntitlement,
      status: score.status,
      subscriptionStatus: score.subscriptionStatus,
      readiness: healthScore,
    },
    COMPLETE_HEALTH: {
      key: "COMPLETE_HEALTH",
      label: SCOPE_LABELS.COMPLETE_HEALTH,
      state: complete.state,
      hasEntitlement: complete.hasEntitlement,
      status: complete.status,
      subscriptionStatus: complete.subscriptionStatus,
    },
  };

  const upgradeOpportunities = [];
  for (const scope of Object.values(scopes)) {
    // Organ Care is bundled with biomarkers/membership — never upsell alone.
    if (scope.key === "ORGAN_CARE") continue;
    if (scope.state === "locked_upgrade") {
      upgradeOpportunities.push({
        key: scope.key,
        label: scope.label,
        reason: `${scope.label} is available as an upgrade.`,
        state: "locked_upgrade" as const,
      });
    }
  }
  for (const program of Object.values(programs)) {
    if (program.state === "locked_upgrade") {
      upgradeOpportunities.push({
        key: program.key,
        label: program.label,
        reason: `${program.label} is available as a clinical program.`,
        state: "locked_upgrade" as const,
      });
    }
  }

  return {
    programs,
    scopes,
    organCare,
    biologicalClock,
    healthScore,
    upgradeOpportunities,
  };
}
