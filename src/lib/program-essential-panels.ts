/**
 * Essential biomarker panels bundled with each clinical program (Core tier).
 * Marker IDs match bloodPanelConfig.ts / My Biomarkers catalog.
 */

export type ProgramEssentialSlug =
  | "WEIGHT_MANAGEMENT"
  | "HAIR_LOSS"
  | "MENS_HEALTH"
  | "WOMENS_HEALTH";

export type ProgramEssentialGender = "male" | "female";

export interface ProgramEssentialPanel {
  slug: ProgramEssentialSlug;
  label: string;
  shortLabel: string;
  description: string;
}

/** Shared safety + baseline panel — every program Essential includes these. */
export const SHARED_BASELINE_MARKER_IDS = [
  "wbc",
  "rbc",
  "hemoglobin",
  "hematocrit",
  "platelets",
  "creatinine",
  "egfr",
  "bun",
  "alt",
  "ast",
  "ggt",
  "vitamin_d",
  "sodium",
  "potassium",
] as const;

export const PROGRAM_ESSENTIAL_PANELS: ProgramEssentialPanel[] = [
  {
    slug: "WEIGHT_MANAGEMENT",
    label: "Weight Management",
    shortLabel: "Weight",
    description:
      "Metabolic, cardiovascular, thyroid and inflammation markers for weight and metabolic health monitoring.",
  },
  {
    slug: "HAIR_LOSS",
    label: "Hair Loss",
    shortLabel: "Hair",
    description:
      "Hormone, thyroid, iron and nutrient markers to investigate hair shedding and regrowth treatment.",
  },
  {
    slug: "MENS_HEALTH",
    label: "Men's Health",
    shortLabel: "Men's",
    description:
      "Androgen, metabolic, cardiovascular and stress markers for men's vitality and performance care.",
  },
  {
    slug: "WOMENS_HEALTH",
    label: "Women's Health",
    shortLabel: "Women's",
    description:
      "Reproductive hormones, metabolic and thyroid markers for women's hormonal and metabolic care.",
  },
];

const WEIGHT_MANAGEMENT_SPECIFIC = [
  "glucose",
  "hba1c",
  "insulin",
  "homa_ir",
  "total_cholesterol",
  "ldl_cholesterol",
  "hdl_cholesterol",
  "triglycerides",
  "tsh",
  "free_t4",
  "crp",
  "uric_acid",
] as const;

const HAIR_LOSS_MALE_SPECIFIC = [
  "testosterone_total",
  "testosterone_free",
  "shbg",
  "tsh",
  "free_t4",
  "free_t3",
  "ferritin",
  "iron",
  "transferrin_saturation",
  "vitamin_b12",
  "folate",
  "zinc",
] as const;

const HAIR_LOSS_FEMALE_SPECIFIC = [
  "tsh",
  "free_t4",
  "free_t3",
  "ferritin",
  "iron",
  "transferrin_saturation",
  "vitamin_b12",
  "folate",
  "zinc",
  "estradiol",
  "progesterone",
  "testosterone_total",
  "shbg",
] as const;

const MENS_HEALTH_SPECIFIC = [
  "testosterone_total",
  "testosterone_free",
  "shbg",
  "glucose",
  "hba1c",
  "total_cholesterol",
  "ldl_cholesterol",
  "hdl_cholesterol",
  "triglycerides",
  "cortisol",
  "dhea_s",
  "crp",
] as const;

const WOMENS_HEALTH_SPECIFIC = [
  "estradiol",
  "progesterone",
  "fsh",
  "lh",
  "testosterone_total",
  "shbg",
  "glucose",
  "hba1c",
  "insulin",
  "tsh",
  "free_t4",
  "ferritin",
  "iron",
  "transferrin_saturation",
  "prolactin",
] as const;

const PROGRAM_SPECIFIC: Record<
  ProgramEssentialSlug,
  readonly string[] | { male: readonly string[]; female: readonly string[] }
> = {
  WEIGHT_MANAGEMENT: WEIGHT_MANAGEMENT_SPECIFIC,
  HAIR_LOSS: { male: HAIR_LOSS_MALE_SPECIFIC, female: HAIR_LOSS_FEMALE_SPECIFIC },
  MENS_HEALTH: MENS_HEALTH_SPECIFIC,
  WOMENS_HEALTH: WOMENS_HEALTH_SPECIFIC,
};

function isGenderSpecificMarkers(
  entry: readonly string[] | { male: readonly string[]; female: readonly string[] }
): entry is { male: readonly string[]; female: readonly string[] } {
  return !Array.isArray(entry);
}

export function getProgramSpecificMarkerIds(
  program: ProgramEssentialSlug,
  gender: ProgramEssentialGender
): string[] {
  const entry = PROGRAM_SPECIFIC[program];
  if (isGenderSpecificMarkers(entry)) {
    return [...(gender === "female" ? entry.female : entry.male)];
  }
  return [...entry];
}

export function getEssentialMarkerIds(
  program: ProgramEssentialSlug,
  gender: ProgramEssentialGender
): string[] {
  return [
    ...new Set([
      ...SHARED_BASELINE_MARKER_IDS,
      ...getProgramSpecificMarkerIds(program, gender),
    ]),
  ];
}

export function getProgramEssentialPanel(
  program: ProgramEssentialSlug
): ProgramEssentialPanel {
  const panel = PROGRAM_ESSENTIAL_PANELS.find((p) => p.slug === program);
  if (!panel) throw new Error(`Unknown program: ${program}`);
  return panel;
}

/** Infer default program tab from legacy subscriptionTier strings. */
export function resolveDefaultProgramFromTier(
  subscriptionTier?: string | null
): ProgramEssentialSlug {
  const tier = (subscriptionTier || "").toLowerCase();
  if (tier.includes("hair")) return "HAIR_LOSS";
  if (tier.includes("mens") || tier.includes("men")) return "MENS_HEALTH";
  if (tier.includes("women") || tier.includes("womens")) return "WOMENS_HEALTH";
  return "WEIGHT_MANAGEMENT";
}

export function isProgramEssentialSlug(value: string): value is ProgramEssentialSlug {
  return PROGRAM_ESSENTIAL_PANELS.some((p) => p.slug === value);
}
