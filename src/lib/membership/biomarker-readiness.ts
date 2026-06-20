/**
 * Biomarker readiness rules.
 *
 * Readiness is the DATA dimension of access: given a member already has the
 * relevant entitlement, do they have enough biomarker coverage to safely show a
 * score/dashboard? These are pure functions (no DB) so they are easy to unit test
 * and reuse on both server and client.
 */

import {
  getEssentialMarkerIds,
  type ProgramEssentialGender,
  type ProgramEssentialSlug,
} from "@/lib/program-essential-panels";

export type EntitlementState =
  | "locked_upgrade"
  | "pending_results"
  | "partial"
  | "ready"
  | "inactive";

export type BiomarkerResultSummary = {
  biomarkerId: string;
  testedAt?: Date | string | null;
};

export type MarkerCoverage = {
  required: string[];
  available: string[];
  missing: string[];
  availableCount: number;
  requiredCount: number;
};

export type ReadinessAssessment = {
  state: EntitlementState;
  coverage: MarkerCoverage;
  readyReason: string;
};

export const BIOLOGICAL_CLOCK_CORE_MARKERS = [
  "albumin",
  "creatinine",
  "glucose",
  "crp",
  "lymphocyte_percent",
  "mcv",
  "rdw",
  "alp",
  "wbc",
] as const;

export const BIOLOGICAL_CLOCK_RECOMMENDED_MARKERS = [
  "hemoglobin",
  "hba1c",
  "hdl_cholesterol",
  "ldl_cholesterol",
  "triglycerides",
  "alt",
  "egfr",
  "tsh",
] as const;

export const ORGAN_CARE_MARKER_SETS = {
  liver: ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin", "platelets"],
  kidney: [
    "creatinine",
    "egfr",
    "bun",
    "uacr",
    "potassium",
    "sodium",
    "calcium",
    "phosphorus",
    "bicarbonate",
    "pth",
  ],
  heart: [
    "total_cholesterol",
    "ldl_cholesterol",
    "hdl_cholesterol",
    "triglycerides",
    "crp",
    "homocysteine",
    "glucose",
    "hba1c",
  ],
  thyroid: ["tsh", "free_t4", "free_t3"],
  hormones: [
    "testosterone_total",
    "estradiol",
    "progesterone",
    "cortisol",
    "dhea_s",
    "fsh",
    "lh",
    "shbg",
    "free_testosterone",
  ],
  metabolic: [
    "glucose",
    "hba1c",
    "insulin",
    "creatinine",
    "egfr",
    "bun",
    "sodium",
    "potassium",
    "calcium",
    "bicarbonate",
  ],
  blood: ["wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "rdw", "platelets", "lymphocyte_percent"],
} as const;

export type OrganCareArea = keyof typeof ORGAN_CARE_MARKER_SETS;

const BIOMARKER_ALIASES: Record<string, string> = {
  alkaline_phosphatase: "alp",
  bilirubin: "bilirubin_total",
  total_bilirubin: "bilirubin_total",
  haemoglobin: "hemoglobin",
  haematocrit: "hematocrit",
  lymphocytepercent: "lymphocyte_percent",
  lymphocyte_percentage: "lymphocyte_percent",
  white_blood_cells: "wbc",
  red_blood_cells: "rbc",
  urea: "bun",
  blood_urea_nitrogen: "bun",
  hdl: "hdl_cholesterol",
  ldl: "ldl_cholesterol",
  cholesterol: "total_cholesterol",
  testosterone: "testosterone_total",
  testosterone_free: "free_testosterone",
};

export function normalizeBiomarkerId(id: string): string {
  const normalized = id.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return BIOMARKER_ALIASES[normalized] || normalized;
}

export function buildAvailableMarkerSet(results: BiomarkerResultSummary[]): Set<string> {
  return new Set(results.map((result) => normalizeBiomarkerId(result.biomarkerId)));
}

export function getMarkerCoverage(
  requiredMarkers: readonly string[],
  results: BiomarkerResultSummary[]
): MarkerCoverage {
  const availableMarkers = buildAvailableMarkerSet(results);
  const required = Array.from(new Set(requiredMarkers.map(normalizeBiomarkerId)));
  const available = required.filter((id) => availableMarkers.has(id));
  const missing = required.filter((id) => !availableMarkers.has(id));

  return {
    required,
    available,
    missing,
    availableCount: available.length,
    requiredCount: required.length,
  };
}

function coverageAssessment(input: {
  hasEntitlement: boolean;
  isInactive?: boolean;
  hasPendingResults?: boolean;
  coverage: MarkerCoverage;
  isReady: (coverage: MarkerCoverage) => boolean;
  readyReason: string;
  partialReason: string;
  pendingReason: string;
  lockedReason: string;
  inactiveReason: string;
}): ReadinessAssessment {
  if (input.isInactive) {
    return { state: "inactive", coverage: input.coverage, readyReason: input.inactiveReason };
  }

  if (!input.hasEntitlement) {
    return { state: "locked_upgrade", coverage: input.coverage, readyReason: input.lockedReason };
  }

  if (input.isReady(input.coverage)) {
    return { state: "ready", coverage: input.coverage, readyReason: input.readyReason };
  }

  if (input.coverage.availableCount === 0 && input.hasPendingResults) {
    return { state: "pending_results", coverage: input.coverage, readyReason: input.pendingReason };
  }

  return { state: "partial", coverage: input.coverage, readyReason: input.partialReason };
}

export function assessProgramEssentialReadiness(input: {
  program: ProgramEssentialSlug;
  gender: ProgramEssentialGender;
  hasEntitlement: boolean;
  isInactive?: boolean;
  hasPendingResults?: boolean;
  results: BiomarkerResultSummary[];
}): ReadinessAssessment {
  const requiredMarkers = getEssentialMarkerIds(input.program, input.gender);
  const coverage = getMarkerCoverage(requiredMarkers, input.results);

  return coverageAssessment({
    hasEntitlement: input.hasEntitlement,
    isInactive: input.isInactive,
    hasPendingResults: input.hasPendingResults,
    coverage,
    isReady: (value) => value.availableCount >= 3,
    readyReason: "Program essential markers are available for this care journey.",
    partialReason: "Some program markers are available, but the panel is incomplete.",
    pendingReason: "Program essential results are expected but have not been uploaded yet.",
    lockedReason: "This program's biomarker panel is available as a program upgrade.",
    inactiveReason: "This program is not active, so biomarkers should be shown as historical.",
  });
}

export function assessBiologicalClockReadiness(input: {
  hasEntitlement: boolean;
  isInactive?: boolean;
  hasPendingResults?: boolean;
  results: BiomarkerResultSummary[];
}): ReadinessAssessment {
  const coverage = getMarkerCoverage(BIOLOGICAL_CLOCK_CORE_MARKERS, input.results);

  return coverageAssessment({
    hasEntitlement: input.hasEntitlement,
    isInactive: input.isInactive,
    hasPendingResults: input.hasPendingResults,
    coverage,
    isReady: (value) => value.availableCount === value.requiredCount,
    readyReason: "All 9 core Biological Clock markers are available.",
    partialReason: "Biological Clock entitlement exists, but core marker coverage is incomplete.",
    pendingReason: "Biological Clock results are expected but have not been uploaded yet.",
    lockedReason: "Biological Clock requires a qualifying insight scope.",
    inactiveReason: "Biological Clock access is inactive.",
  });
}

function isOrganAreaReady(area: OrganCareArea, availableMarkers: Set<string>): boolean {
  switch (area) {
    case "liver":
      return (
        availableMarkers.has("alt") &&
        availableMarkers.has("ast") &&
        availableMarkers.has("ggt") &&
        (availableMarkers.has("bilirubin_total") || availableMarkers.has("alp")) &&
        (availableMarkers.has("albumin") || availableMarkers.has("platelets"))
      );
    case "kidney":
      return (
        (availableMarkers.has("egfr") || availableMarkers.has("creatinine")) &&
        ["bun", "uacr", "potassium", "sodium", "calcium", "bicarbonate"].some((id) =>
          availableMarkers.has(id)
        )
      );
    case "heart":
      return (
        (availableMarkers.has("ldl_cholesterol") || availableMarkers.has("total_cholesterol")) &&
        availableMarkers.has("hdl_cholesterol") &&
        availableMarkers.has("triglycerides") &&
        ["crp", "glucose", "hba1c"].some((id) => availableMarkers.has(id))
      );
    case "thyroid":
      return availableMarkers.has("tsh") && (availableMarkers.has("free_t4") || availableMarkers.has("free_t3"));
    case "hormones":
      return (
        (availableMarkers.has("testosterone_total") || availableMarkers.has("estradiol")) &&
        ["progesterone", "cortisol", "dhea_s", "fsh", "lh", "shbg", "free_testosterone"].some((id) =>
          availableMarkers.has(id)
        )
      );
    case "metabolic":
      return (
        (availableMarkers.has("glucose") || availableMarkers.has("hba1c")) &&
        ["insulin", "egfr", "creatinine", "sodium", "potassium", "calcium", "bicarbonate"].some((id) =>
          availableMarkers.has(id)
        )
      );
    case "blood":
      return (
        availableMarkers.has("wbc") &&
        availableMarkers.has("hemoglobin") &&
        availableMarkers.has("platelets") &&
        (availableMarkers.has("mcv") || availableMarkers.has("rdw"))
      );
  }
}

export function assessOrganAreaReadiness(input: {
  area: OrganCareArea;
  hasEntitlement: boolean;
  isInactive?: boolean;
  hasPendingResults?: boolean;
  results: BiomarkerResultSummary[];
}): ReadinessAssessment {
  const requiredMarkers = ORGAN_CARE_MARKER_SETS[input.area];
  const coverage = getMarkerCoverage(requiredMarkers, input.results);
  const availableMarkers = buildAvailableMarkerSet(input.results);

  return coverageAssessment({
    hasEntitlement: input.hasEntitlement,
    isInactive: input.isInactive,
    hasPendingResults: input.hasPendingResults,
    coverage,
    isReady: () => isOrganAreaReady(input.area, availableMarkers),
    readyReason: "This organ dashboard has enough primary markers to show.",
    partialReason: "Some markers are available, but this organ dashboard is incomplete.",
    pendingReason: "This organ panel is expected but results have not been uploaded yet.",
    lockedReason: "This organ dashboard requires Organ Care, Complete Health, or a specific panel upgrade.",
    inactiveReason: "Organ Care access is inactive.",
  });
}

export function assessHealthScoreReadiness(input: {
  hasEntitlement: boolean;
  isInactive?: boolean;
  hasPendingResults?: boolean;
  results: BiomarkerResultSummary[];
}): ReadinessAssessment & {
  categories: Record<OrganCareArea, ReadinessAssessment>;
  readyCategoryCount: number;
} {
  const categories = Object.keys(ORGAN_CARE_MARKER_SETS).reduce(
    (acc, key) => {
      const area = key as OrganCareArea;
      acc[area] = assessOrganAreaReadiness({
        area,
        hasEntitlement: input.hasEntitlement,
        isInactive: input.isInactive,
        hasPendingResults: input.hasPendingResults,
        results: input.results,
      });
      return acc;
    },
    {} as Record<OrganCareArea, ReadinessAssessment>
  );

  const requiredMarkers = Array.from(
    new Set(Object.values(ORGAN_CARE_MARKER_SETS).flat().map(normalizeBiomarkerId))
  );
  const coverage = getMarkerCoverage(requiredMarkers, input.results);
  const readyCategoryCount = Object.values(categories).filter((category) => category.state === "ready").length;
  const hasMetabolicOrHeartReady =
    categories.metabolic.state === "ready" || categories.heart.state === "ready";

  const assessment = coverageAssessment({
    hasEntitlement: input.hasEntitlement,
    isInactive: input.isInactive,
    hasPendingResults: input.hasPendingResults,
    coverage,
    isReady: () => readyCategoryCount >= 4 && hasMetabolicOrHeartReady,
    readyReason: "Enough organ categories are ready to calculate a whole-body Health Score.",
    partialReason: "Category coverage is incomplete, so the overall Health Score should stay hidden.",
    pendingReason: "Health Score results are expected but no category data is available yet.",
    lockedReason: "Health Score requires Health Score, Organ Care, or Complete Health entitlement.",
    inactiveReason: "Health Score access is inactive.",
  });

  return {
    ...assessment,
    categories,
    readyCategoryCount,
  };
}
