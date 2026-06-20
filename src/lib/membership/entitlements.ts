/**
 * Derive the customer-facing membership view from persisted entitlements +
 * biomarker readiness. Entitlement = "what you bought"; readiness = "what your
 * data supports". This is what the portal context exposes to the UI.
 */

import {
  assessBiologicalClockReadiness,
  assessHealthScoreReadiness,
  assessOrganAreaReadiness,
  assessProgramEssentialReadiness,
  ORGAN_CARE_MARKER_SETS,
  type BiomarkerResultSummary,
  type EntitlementState,
  type OrganCareArea,
  type ReadinessAssessment,
} from "@/lib/membership/biomarker-readiness";
import {
  PROGRAM_KEYS,
  PROGRAM_LABELS,
  PROGRAM_TO_ESSENTIAL_SLUG,
  SCOPE_LABELS,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import type { ProgramEssentialGender } from "@/lib/program-essential-panels";

export type EntitlementStatusValue = "ACTIVE" | "PENDING" | "INACTIVE";

export type EntitlementRecord = {
  type: "PROGRAM" | "SCOPE";
  key: string;
  status: EntitlementStatusValue;
};

export type ProgramEntitlementView = {
  key: ProgramKey;
  label: string;
  state: EntitlementState;
  hasEntitlement: boolean;
  status: EntitlementStatusValue | null;
  readiness: ReadinessAssessment;
};

export type ScopeEntitlementView = {
  key: ScopeKey;
  label: string;
  state: EntitlementState;
  hasEntitlement: boolean;
  status: EntitlementStatusValue | null;
  readiness?: ReadinessAssessment;
};

export type UpgradeOpportunity = {
  key: ProgramKey | ScopeKey;
  label: string;
  reason: string;
  state: Extract<EntitlementState, "locked_upgrade" | "partial" | "pending_results">;
};

export type DerivedMembershipEntitlements = {
  programs: Record<ProgramKey, ProgramEntitlementView>;
  scopes: Record<ScopeKey, ScopeEntitlementView>;
  organCare: Record<OrganCareArea, ReadinessAssessment>;
  biologicalClock: ReadinessAssessment;
  healthScore: ReturnType<typeof assessHealthScoreReadiness>;
  upgradeOpportunities: UpgradeOpportunity[];
};

export type DeriveMembershipInput = {
  entitlements: EntitlementRecord[];
  biomarkerResults?: BiomarkerResultSummary[];
  gender?: ProgramEssentialGender | string | null;
  hasPendingResults?: boolean;
};

function resolveGender(gender?: ProgramEssentialGender | string | null): ProgramEssentialGender {
  return (gender || "").toString().toLowerCase() === "female" ? "female" : "male";
}

function findEntitlement(
  entitlements: EntitlementRecord[],
  type: "PROGRAM" | "SCOPE",
  key: string
): EntitlementRecord | undefined {
  return entitlements.find((e) => e.type === type && e.key === key);
}

type Flags = {
  hasEntitlement: boolean;
  isInactive: boolean;
  status: EntitlementStatusValue | null;
};

function entitlementFlags(record: EntitlementRecord | undefined): Flags {
  if (!record) return { hasEntitlement: false, isInactive: false, status: null };
  if (record.status === "INACTIVE") return { hasEntitlement: false, isInactive: true, status: "INACTIVE" };
  return { hasEntitlement: true, isInactive: false, status: record.status };
}

export function deriveMembershipEntitlements(
  input: DeriveMembershipInput
): DerivedMembershipEntitlements {
  const entitlements = input.entitlements || [];
  const results = input.biomarkerResults || [];
  const gender = resolveGender(input.gender);
  const hasPendingResults = input.hasPendingResults;

  // --- Programs ---
  const programs = {} as Record<ProgramKey, ProgramEntitlementView>;
  for (const key of PROGRAM_KEYS) {
    const flags = entitlementFlags(findEntitlement(entitlements, "PROGRAM", key));
    const readiness = assessProgramEssentialReadiness({
      program: PROGRAM_TO_ESSENTIAL_SLUG[key],
      gender,
      hasEntitlement: flags.hasEntitlement,
      isInactive: flags.isInactive,
      hasPendingResults,
      results,
    });
    programs[key] = {
      key,
      label: PROGRAM_LABELS[key],
      state: readiness.state,
      hasEntitlement: flags.hasEntitlement,
      status: flags.status,
      readiness,
    };
  }

  // --- Scope entitlement flags (COMPLETE_HEALTH is pre-expanded at sync time) ---
  const organFlags = entitlementFlags(findEntitlement(entitlements, "SCOPE", "ORGAN_CARE"));
  const clockFlags = entitlementFlags(findEntitlement(entitlements, "SCOPE", "BIOLOGICAL_CLOCK"));
  const scoreFlags = entitlementFlags(findEntitlement(entitlements, "SCOPE", "HEALTH_SCORE"));
  const essentialFlags = entitlementFlags(findEntitlement(entitlements, "SCOPE", "PROGRAM_ESSENTIAL"));
  const completeFlags = entitlementFlags(findEntitlement(entitlements, "SCOPE", "COMPLETE_HEALTH"));

  // --- Organ Care per area ---
  const organCare = {} as Record<OrganCareArea, ReadinessAssessment>;
  for (const area of Object.keys(ORGAN_CARE_MARKER_SETS) as OrganCareArea[]) {
    organCare[area] = assessOrganAreaReadiness({
      area,
      hasEntitlement: organFlags.hasEntitlement,
      isInactive: organFlags.isInactive,
      hasPendingResults,
      results,
    });
  }

  const biologicalClock = assessBiologicalClockReadiness({
    hasEntitlement: clockFlags.hasEntitlement,
    isInactive: clockFlags.isInactive,
    hasPendingResults,
    results,
  });

  const healthScore = assessHealthScoreReadiness({
    hasEntitlement: scoreFlags.hasEntitlement,
    isInactive: scoreFlags.isInactive,
    hasPendingResults,
    results,
  });

  // --- Scope views ---
  const organCareState = ((): EntitlementState => {
    if (organFlags.isInactive) return "inactive";
    if (!organFlags.hasEntitlement) return "locked_upgrade";
    if (Object.values(organCare).some((a) => a.state === "ready")) return "ready";
    if (Object.values(organCare).some((a) => a.state === "pending_results")) return "pending_results";
    return "partial";
  })();

  const essentialState = ((): EntitlementState => {
    if (essentialFlags.isInactive) return "inactive";
    if (!essentialFlags.hasEntitlement) return "locked_upgrade";
    if (Object.values(programs).some((p) => p.state === "ready" || p.state === "partial")) return "ready";
    return "pending_results";
  })();

  const completeState = ((): EntitlementState => {
    if (completeFlags.isInactive) return "inactive";
    if (!completeFlags.hasEntitlement) return "locked_upgrade";
    return "ready";
  })();

  const scopes: Record<ScopeKey, ScopeEntitlementView> = {
    PROGRAM_ESSENTIAL: {
      key: "PROGRAM_ESSENTIAL",
      label: SCOPE_LABELS.PROGRAM_ESSENTIAL,
      state: essentialState,
      hasEntitlement: essentialFlags.hasEntitlement,
      status: essentialFlags.status,
    },
    ORGAN_CARE: {
      key: "ORGAN_CARE",
      label: SCOPE_LABELS.ORGAN_CARE,
      state: organCareState,
      hasEntitlement: organFlags.hasEntitlement,
      status: organFlags.status,
    },
    BIOLOGICAL_CLOCK: {
      key: "BIOLOGICAL_CLOCK",
      label: SCOPE_LABELS.BIOLOGICAL_CLOCK,
      state: biologicalClock.state,
      hasEntitlement: clockFlags.hasEntitlement,
      status: clockFlags.status,
      readiness: biologicalClock,
    },
    HEALTH_SCORE: {
      key: "HEALTH_SCORE",
      label: SCOPE_LABELS.HEALTH_SCORE,
      state: healthScore.state,
      hasEntitlement: scoreFlags.hasEntitlement,
      status: scoreFlags.status,
      readiness: healthScore,
    },
    COMPLETE_HEALTH: {
      key: "COMPLETE_HEALTH",
      label: SCOPE_LABELS.COMPLETE_HEALTH,
      state: completeState,
      hasEntitlement: completeFlags.hasEntitlement,
      status: completeFlags.status,
    },
  };

  // --- Upgrade opportunities ---
  const upgradeOpportunities: UpgradeOpportunity[] = [];
  const pushIfUpsell = (
    key: ProgramKey | ScopeKey,
    label: string,
    state: EntitlementState,
    reason: string
  ) => {
    if (state === "locked_upgrade" || state === "partial" || state === "pending_results") {
      upgradeOpportunities.push({ key, label, reason, state });
    }
  };

  for (const scope of Object.values(scopes)) {
    pushIfUpsell(
      scope.key,
      scope.label,
      scope.state,
      scope.readiness?.readyReason || `${scope.label} is not fully ready yet.`
    );
  }
  for (const program of Object.values(programs)) {
    if (program.state === "locked_upgrade") {
      pushIfUpsell(
        program.key,
        program.label,
        program.state,
        `${program.label} is available as a clinical program.`
      );
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
