/**
 * Public biomarker subscription tiers (Labs / biomarker-intake).
 *
 * Essential — core biomarkers for general health assessment.
 * Advanced — Essential + Biological Clock + Organ & Metabolic Care.
 * Complete — full My Biomarkers catalog (everything else).
 */

import { getAllBiomarkerIds } from "@/data/bloodPanelConfig";
import {
  BIOLOGICAL_CLOCK_CORE_MARKERS,
  BIOLOGICAL_CLOCK_RECOMMENDED_MARKERS,
  ORGAN_CARE_MARKER_SETS,
} from "@/lib/membership/biomarker-readiness";
import { DEPRECATED_BIOMARKER_IDS } from "@/lib/catalog-biomarkers";
import { FUNCTION_STYLE_CATEGORIES } from "@/lib/biomarkers/function-style-categories";

export type BiomarkerSubscriptionTier = "essential" | "advanced" | "complete";

/** Essential panel — FBE, EUC/LFTs, thyroid, metabolic, lipids, iron, ACR, etc. */
export const BULK_BILL_BASELINE_MARKER_IDS = [
  "wbc",
  "rbc",
  "hemoglobin",
  "hematocrit",
  "platelets",
  "mcv",
  "mch",
  "mchc",
  "rdw",
  "neutrophils",
  "neutrophil_percent",
  "lymphocytes",
  "lymphocyte_percent",
  "monocytes",
  "monocyte_percent",
  "eosinophils",
  "eosinophil_percent",
  "basophils",
  "basophil_percent",
  "sodium",
  "potassium",
  "chloride",
  "bicarbonate",
  "creatinine",
  "bun",
  "calcium",
  "alt",
  "ast",
  "ggt",
  "alp",
  "bilirubin_total",
  "bilirubin_direct",
  "albumin",
  "total_protein",
  "tsh",
  "free_t3",
  "free_t4",
  "insulin",
  "uric_acid",
  "glucose",
  "hba1c",
  "uacr",
  "total_cholesterol",
  "triglycerides",
  "ldl_cholesterol",
  "hdl_cholesterol",
  "non_hdl_cholesterol",
  "active_b12",
  "iron",
  "ferritin",
  "tibc",
  "crp",
] as const;

/** Organ Care pathology extras not always listed in dashboard marker sets. */
const ADVANCED_ORGAN_CARE_EXTRAS = [
  "vitamin_d",
  "homocysteine",
  "phosphorus",
  "pth",
  "prolactin",
  /** Catalog alias — organ dashboards use free_testosterone */
  "testosterone_free",
] as const;

const CATALOG_IDS = getAllBiomarkerIds().filter((id) => !DEPRECATED_BIOMARKER_IDS.has(id));

export const ESSENTIAL_MARKER_ID_SET = new Set<string>(BULK_BILL_BASELINE_MARKER_IDS);

export const ADVANCED_MARKER_ID_SET = new Set<string>([
  ...BULK_BILL_BASELINE_MARKER_IDS,
  ...BIOLOGICAL_CLOCK_CORE_MARKERS,
  ...BIOLOGICAL_CLOCK_RECOMMENDED_MARKERS,
  ...Object.values(ORGAN_CARE_MARKER_SETS).flat(),
  ...ADVANCED_ORGAN_CARE_EXTRAS,
]);

export const COMPLETE_MARKER_ID_SET = new Set<string>(CATALOG_IDS);

/**
 * Function-style intake totals (unique tested + calculated).
 * Kept in sync with `getTierDisplayMarkerCounts` in panel-biomarker-display.
 */
const ESSENTIAL_COUNTS = { total: 71, measurable: 46, derived: 25 };
const ADVANCED_COUNTS = { total: 89, measurable: 60, derived: 29 };
const COMPLETE_COUNTS = { total: 99, measurable: 70, derived: 29 };

export interface BiomarkerSubscriptionPlan {
  id: BiomarkerSubscriptionTier;
  name: string;
  tagline: string;
  /** Annual subscription AUD — matches billing catalog seeds */
  priceAud: number;
  billingLabel: string;
  markerCount: number;
  measurableCount: number;
  popular: boolean;
  /** Shown on plan cards */
  highlights: string[];
  /** Pathology bundles ordered for this tier */
  pathologyTests: string[];
  includesLabel?: string;
}

export const BIOMARKER_SUBSCRIPTION_PLANS: BiomarkerSubscriptionPlan[] = [
  {
    id: "essential",
    name: "Essential",
    tagline: "Core biomarkers for general health assessment — metabolic, heart, liver, kidney & thyroid screening",
    priceAud: 199,
    billingLabel: "per year",
    markerCount: ESSENTIAL_COUNTS.total,
    measurableCount: ESSENTIAL_COUNTS.measurable,
    popular: false,
    includesLabel: "Essential panel",
    pathologyTests: [
      "Full blood count (FBE)",
      "Kidney & electrolytes (EUC)",
      "Liver function tests (LFTs)",
      "TSH ± free T3/T4 if clinically indicated",
      "Fasting glucose, HbA1c & fasting insulin",
      "Lipid panel (TC, TG, LDL, HDL, non-HDL)",
      "Calcium, albumin & uric acid",
      "Urine albumin:creatinine ratio (MSU ACR)",
      "Iron studies & active B12",
      "hs-CRP — inflammation & biological age",
    ],
    highlights: [
      "Core biomarkers for general health assessment",
      "Metabolic, heart, liver, kidney & thyroid markers",
      "FBE with full differential",
      "hs-CRP for inflammation & Biological Clock readiness",
      "Portal calculates derived markers (eGFR, HOMA-IR, lipid ratios)",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    tagline: "Comprehensive testing including Biological Clock & full Organ & Metabolic Care",
    priceAud: 365,
    billingLabel: "per year",
    markerCount: ADVANCED_COUNTS.total,
    measurableCount: ADVANCED_COUNTS.measurable,
    popular: true,
    includesLabel: "Everything in Essential, plus:",
    pathologyTests: [
      "Vitamin D (25-OH)",
      "Male or female hormone panel (as clinically indicated)",
      "Cortisol (AM) & DHEA-S",
      "Homocysteine — cardiovascular risk",
      "Phosphate & PTH — advanced kidney monitoring",
      "Prolactin (when clinically indicated)",
    ],
    highlights: [
      "Biological Clock (Health Age) scoring in your portal",
      "All six Organ Care dashboards — heart, liver, kidney, thyroid, hormones & metabolic",
      "Sex- and age-appropriate hormone testing",
      "Inflammation markers for heart & metabolic risk",
      "Best for members who want whole-body organ tracking",
    ],
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "The full My Biomarkers catalog — every test we track in the portal",
    priceAud: 499,
    billingLabel: "per year",
    markerCount: COMPLETE_COUNTS.total,
    measurableCount: COMPLETE_COUNTS.measurable,
    popular: false,
    includesLabel: "Everything in Advanced, plus:",
    pathologyTests: [
      "Thyroid antibodies (TPO & thyroglobulin)",
      "Extended inflammation panel (ESR & fibrinogen)",
      "Full nutrient panel — B12, folate, zinc, magnesium, selenium & copper",
      "Ferritin inflammatory index (clinical context)",
      "Any remaining catalog markers not in lower tiers",
    ],
    highlights: [
      "Full 99-marker catalog (tested + calculated)",
      "Thyroid autoimmunity screening",
      "Extended inflammation & nutrient depth",
      "Maximum data for AI insights & biological age",
      "For members who want no gaps in their health picture",
    ],
  },
];

export function getBiomarkerSubscriptionPlan(
  tier: string | null | undefined
): BiomarkerSubscriptionPlan {
  return (
    BIOMARKER_SUBSCRIPTION_PLANS.find((p) => p.id === tier) ??
    BIOMARKER_SUBSCRIPTION_PLANS.find((p) => p.id === "advanced")!
  );
}

export function getBiomarkerTierMarkerIds(tier: BiomarkerSubscriptionTier): Set<string> {
  switch (tier) {
    case "essential":
      return ESSENTIAL_MARKER_ID_SET;
    case "advanced":
      return ADVANCED_MARKER_ID_SET;
    case "complete":
      return COMPLETE_MARKER_ID_SET;
  }
}

/**
 * Category highlights for intake step 2 — Function-style names.
 * Prefer `getFunctionStyleCategoriesForTier` for counts + marker lists.
 */
export function getTierCategoryPreview(tier: BiomarkerSubscriptionTier) {
  return FUNCTION_STYLE_CATEGORIES.filter((c) => c.tiers.includes(tier)).map((c) => ({
    id: c.id,
    name: c.name,
    markers: c.highlights,
    tiers: c.tiers,
  }));
}
