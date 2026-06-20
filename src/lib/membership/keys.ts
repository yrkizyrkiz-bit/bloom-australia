/**
 * Canonical membership keys for the explicit entitlement layer.
 *
 * The codebase historically represents programs in several inconsistent ways:
 * lowercase tiers (`weight_management`, `womens_health`), uppercase program slugs
 * (`WOMENS_HEALTH`), and plan strings (`sanative_core`). These helpers normalize
 * all of those into a single canonical key space used by the `Entitlement` table.
 */

import type { ProgramEssentialSlug } from "@/lib/program-essential-panels";

export type ProgramKey =
  | "WEIGHT_MANAGEMENT"
  | "HAIR_LOSS"
  | "MENS_HEALTH_VITALITY"
  | "MENS_HEALTH_SEXUAL"
  | "WOMENS_HEALTH_VITALITY"
  | "WOMENS_HEALTH_SEXUAL";

export type ScopeKey =
  | "PROGRAM_ESSENTIAL"
  | "ORGAN_CARE"
  | "BIOLOGICAL_CLOCK"
  | "HEALTH_SCORE"
  | "COMPLETE_HEALTH";

export const PROGRAM_KEYS: ProgramKey[] = [
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH_VITALITY",
  "MENS_HEALTH_SEXUAL",
  "WOMENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_SEXUAL",
];

export const SCOPE_KEYS: ScopeKey[] = [
  "PROGRAM_ESSENTIAL",
  "ORGAN_CARE",
  "BIOLOGICAL_CLOCK",
  "HEALTH_SCORE",
  "COMPLETE_HEALTH",
];

export const PROGRAM_LABELS: Record<ProgramKey, string> = {
  WEIGHT_MANAGEMENT: "Weight Management",
  HAIR_LOSS: "Hair",
  MENS_HEALTH_VITALITY: "Vitality",
  MENS_HEALTH_SEXUAL: "Sexual Health",
  WOMENS_HEALTH_VITALITY: "Vitality",
  WOMENS_HEALTH_SEXUAL: "Sexual Health",
};

export const SCOPE_LABELS: Record<ScopeKey, string> = {
  PROGRAM_ESSENTIAL: "Program Essential Biomarkers",
  ORGAN_CARE: "Organ Care",
  BIOLOGICAL_CLOCK: "Biological Clock",
  HEALTH_SCORE: "Health Score",
  COMPLETE_HEALTH: "Complete Health",
};

/** Each clinical program maps to a Program Essential biomarker panel. */
export const PROGRAM_TO_ESSENTIAL_SLUG: Record<ProgramKey, ProgramEssentialSlug> = {
  WEIGHT_MANAGEMENT: "WEIGHT_MANAGEMENT",
  HAIR_LOSS: "HAIR_LOSS",
  MENS_HEALTH_VITALITY: "MENS_HEALTH",
  MENS_HEALTH_SEXUAL: "MENS_HEALTH",
  WOMENS_HEALTH_VITALITY: "WOMENS_HEALTH",
  WOMENS_HEALTH_SEXUAL: "WOMENS_HEALTH",
};

function normalize(value?: string | null): string {
  return (value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isProgramKey(value: string): value is ProgramKey {
  return (PROGRAM_KEYS as string[]).includes(value);
}

export function isScopeKey(value: string): value is ScopeKey {
  return (SCOPE_KEYS as string[]).includes(value);
}

/**
 * Map a legacy/free-form program string (tier, slug, plan) to a canonical ProgramKey.
 * Returns null when the value does not denote a clinical program.
 * Legacy `mens_health` / `womens_health` (no focus) default to the Vitality focus.
 */
export function normalizeProgramKey(value?: string | null): ProgramKey | null {
  const v = normalize(value);
  if (!v) return null;

  // Already canonical (case-insensitive)
  const canonical = PROGRAM_KEYS.find((key) => key.toLowerCase() === v);
  if (canonical) return canonical;

  // Explicit focus variants. Check women first ("womens" contains "mens").
  if (v.includes("women")) {
    if (v.includes("sex")) return "WOMENS_HEALTH_SEXUAL";
    return "WOMENS_HEALTH_VITALITY";
  }
  if (v.includes("mens") || v.includes("men_") || v === "men") {
    if (v.includes("sex")) return "MENS_HEALTH_SEXUAL";
    return "MENS_HEALTH_VITALITY";
  }
  if (v.includes("hair")) return "HAIR_LOSS";
  // Weight + fatty liver / metabolic both route to the weight program today.
  if (v.includes("weight") || v.includes("fatty") || v.includes("liver_program")) {
    return "WEIGHT_MANAGEMENT";
  }
  // Plan strings such as sanative_core / sanative_precision imply weight management.
  if (v.includes("sanative") || v.includes("core") || v.includes("precision")) {
    return "WEIGHT_MANAGEMENT";
  }

  return null;
}

/**
 * Map a legacy/free-form scope string to a canonical ScopeKey.
 * Returns null when the value does not denote a biomarker insight scope.
 */
export function normalizeScopeKey(value?: string | null): ScopeKey | null {
  const v = normalize(value);
  if (!v) return null;

  const canonical = SCOPE_KEYS.find((key) => key.toLowerCase() === v);
  if (canonical) return canonical;

  if (v.includes("complete") || v.includes("whole_body") || v.includes("full_panel")) {
    return "COMPLETE_HEALTH";
  }
  if (v.includes("health_score") || v.includes("healthscore")) return "HEALTH_SCORE";
  if (v.includes("biological") || v.includes("bio_age") || v.includes("clock")) {
    return "BIOLOGICAL_CLOCK";
  }
  if (
    v.includes("organ") ||
    v.includes("liver") ||
    v.includes("kidney") ||
    v.includes("heart") ||
    v.includes("thyroid") ||
    v.includes("hormone") ||
    v.includes("metabolic")
  ) {
    return "ORGAN_CARE";
  }
  if (v.includes("essential") || v.includes("program")) return "PROGRAM_ESSENTIAL";

  return null;
}

/** Scopes that COMPLETE_HEALTH expands into. */
export const COMPLETE_HEALTH_SCOPES: ScopeKey[] = [
  "ORGAN_CARE",
  "BIOLOGICAL_CLOCK",
  "HEALTH_SCORE",
  "PROGRAM_ESSENTIAL",
];
