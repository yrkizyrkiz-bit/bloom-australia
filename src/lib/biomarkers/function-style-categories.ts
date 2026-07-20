/**
 * Function Health–style category grouping for public biomarker intake.
 * Excludes Function categories left empty for now (cancer, autoimmunity, toxins,
 * pancreas, brain, allergies, bone, infections, gut, imaging, sexual health).
 *
 * Marker lists follow the Advanced “already covered (measure or calculate)” map.
 */

import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { BIOLOGICAL_CLOCK_CORE_MARKERS } from "@/lib/membership/biomarker-readiness";

export type FunctionStyleCategoryId =
  | "heart"
  | "thyroid"
  | "immune"
  | "female-health"
  | "male-health"
  | "metabolic"
  | "nutrients"
  | "stress-aging"
  | "biological-age"
  | "liver"
  | "blood"
  | "kidneys"
  | "electrolytes"
  | "urine";

export type FunctionStyleCategory = {
  id: FunctionStyleCategoryId;
  name: string;
  /** Biomarker IDs (measured + calculated) shown under this category */
  markerIds: string[];
  /** Highlight chips on category cards */
  highlights: string[];
  /** Tiers that show this category when it has ≥1 marker in the tier */
  tiers: BiomarkerSubscriptionTier[];
};

/**
 * Canonical Function-style groups for Advanced coverage.
 * Shared markers may appear in more than one category (Function dual-list pattern).
 */
export const FUNCTION_STYLE_CATEGORIES: FunctionStyleCategory[] = [
  {
    id: "heart",
    name: "Heart",
    highlights: ["Lipids", "hs-CRP", "Ratios"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "total_cholesterol",
      "hdl_cholesterol",
      "ldl_cholesterol",
      "triglycerides",
      "non_hdl_cholesterol",
      "crp",
      "homocysteine",
      "tc_hdl_ratio",
      "ldl_hdl_ratio",
      "tg_hdl_ratio",
      "atherogenic_index_plasma",
      "vldl_cholesterol",
    ],
  },
  {
    id: "thyroid",
    name: "Thyroid",
    highlights: ["TSH", "Free T3", "Free T4"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: ["tsh", "free_t4", "free_t3", "free_t3_t4_ratio", "tpo_antibodies", "tg_antibodies"],
  },
  {
    id: "immune",
    name: "Immune regulation",
    highlights: ["WBC", "Differentials", "hs-CRP"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "wbc",
      "neutrophils",
      "lymphocytes",
      "monocytes",
      "eosinophils",
      "basophils",
      "neutrophil_percent",
      "lymphocyte_percent",
      "monocyte_percent",
      "eosinophil_percent",
      "basophil_percent",
      "crp",
      "esr",
      "fibrinogen",
      "nlr",
      "platelet_lymphocyte_ratio",
      "crp_albumin_ratio",
    ],
  },
  {
    id: "female-health",
    name: "Female health",
    highlights: ["Estradiol", "FSH", "Progesterone"],
    tiers: ["advanced", "complete"],
    markerIds: [
      "estradiol",
      "progesterone",
      "fsh",
      "lh",
      "prolactin",
      "shbg",
      "testosterone_total",
      "testosterone_free",
      "dhea_s",
      "free_androgen_index",
    ],
  },
  {
    id: "male-health",
    name: "Male health",
    highlights: ["Testosterone", "SHBG", "FSH"],
    tiers: ["advanced", "complete"],
    markerIds: [
      "testosterone_total",
      "testosterone_free",
      "shbg",
      "estradiol",
      "fsh",
      "lh",
      "prolactin",
      "dhea_s",
      "free_androgen_index",
    ],
  },
  {
    id: "metabolic",
    name: "Metabolic",
    highlights: ["Glucose", "HbA1c", "Insulin"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "glucose",
      "hba1c",
      "insulin",
      "uric_acid",
      "homa_ir",
      "tyg_index",
      "estimated_average_glucose",
    ],
  },
  {
    id: "nutrients",
    name: "Nutrients",
    highlights: ["Vitamin D", "Iron", "B12"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "vitamin_d",
      "active_b12",
      "vitamin_b12",
      "folate",
      "homocysteine",
      "iron",
      "ferritin",
      "tibc",
      "transferrin_saturation",
      "magnesium",
      "zinc",
      "selenium",
      "copper",
      "ferritin_albumin_ratio",
    ],
  },
  {
    id: "stress-aging",
    name: "Stress & aging",
    highlights: ["Cortisol", "DHEA-S"],
    tiers: ["advanced", "complete"],
    markerIds: ["cortisol", "dhea_s"],
  },
  {
    id: "biological-age",
    name: "Biological age",
    highlights: ["Health Age score"],
    tiers: ["advanced", "complete"],
    /** PhenoAge-style inputs — score itself is computed in portal */
    markerIds: [...BIOLOGICAL_CLOCK_CORE_MARKERS],
  },
  {
    id: "liver",
    name: "Liver",
    highlights: ["ALT", "AST", "GGT"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "alt",
      "ast",
      "alp",
      "ggt",
      "albumin",
      "total_protein",
      "bilirubin_total",
      "bilirubin_direct",
      "globulin",
      "albumin_globulin_ratio",
      "ast_alt_ratio",
      "indirect_bilirubin",
      "bilirubin_albumin_ratio",
    ],
  },
  {
    id: "blood",
    name: "Blood",
    highlights: ["FBE", "Haemoglobin", "Platelets"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "hemoglobin",
      "hematocrit",
      "rbc",
      "mcv",
      "mch",
      "mchc",
      "rdw",
      "platelets",
      "wbc",
    ],
  },
  {
    id: "kidneys",
    name: "Kidneys",
    highlights: ["eGFR", "Creatinine", "UACR"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: [
      "creatinine",
      "bun",
      "egfr",
      "uacr",
      "sodium",
      "potassium",
      "chloride",
      "urea_creatinine_ratio",
      "phosphorus",
      "pth",
      "calcium",
    ],
  },
  {
    id: "electrolytes",
    name: "Electrolytes",
    highlights: ["Sodium", "Potassium", "Bicarbonate"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: ["sodium", "potassium", "chloride", "bicarbonate", "anion_gap", "magnesium", "calcium"],
  },
  {
    id: "urine",
    name: "Urine",
    highlights: ["UACR"],
    tiers: ["essential", "advanced", "complete"],
    markerIds: ["uacr"],
  },
];

/** Calculated IDs we surface on intake even when not in the tier marker set */
export const FUNCTION_STYLE_CALCULATED_IDS = new Set([
  "tc_hdl_ratio",
  "ldl_hdl_ratio",
  "tg_hdl_ratio",
  "atherogenic_index_plasma",
  "vldl_cholesterol",
  "free_t3_t4_ratio",
  "homa_ir",
  "tyg_index",
  "estimated_average_glucose",
  "transferrin_saturation",
  "ferritin_albumin_ratio",
  "globulin",
  "albumin_globulin_ratio",
  "ast_alt_ratio",
  "indirect_bilirubin",
  "bilirubin_albumin_ratio",
  "urea_creatinine_ratio",
  "anion_gap",
  "free_androgen_index",
  "nlr",
  "platelet_lymphocyte_ratio",
  "crp_albumin_ratio",
  "non_hdl_cholesterol",
  "egfr",
  "neutrophil_percent",
  "lymphocyte_percent",
  "monocyte_percent",
  "eosinophil_percent",
  "basophil_percent",
]);
