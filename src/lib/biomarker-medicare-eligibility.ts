/**
 * Australian Medicare / MBS eligibility hints for My Biomarkers catalog markers.
 * Rebates require a valid clinical indication and MBS criteria; bulk billing is at provider discretion.
 */

export type MedicareEligibility =
  | "medicare_standard"
  | "medicare_with_indication"
  | "derived";

export interface MedicareEligibilityInfo {
  type: MedicareEligibility;
  label: string;
  description: string;
}

/** Calculated in-lab or in-portal — no separate MBS item. */
const DERIVED_MARKER_IDS = new Set<string>([
  "non_hdl_cholesterol",
  "tc_hdl_ratio",
  "ldl_hdl_ratio",
  "tg_hdl_ratio",
  "homa_ir",
  "egfr",
  "globulin",
  "transferrin_saturation",
  "atherogenic_index_plasma",
  "vldl_cholesterol",
  "albumin_globulin_ratio",
  "ast_alt_ratio",
  "indirect_bilirubin",
  "bilirubin_albumin_ratio",
  "tyg_index",
  "estimated_average_glucose",
  "urea_creatinine_ratio",
  "anion_gap",
  "free_t3_t4_ratio",
  "free_androgen_index",
  "crp_albumin_ratio",
  "ferritin_albumin_ratio",
  "nlr",
  "platelet_lymphocyte_ratio",
]);

/** On MBS when the treating doctor documents an accepted clinical indication. */
const MEDICARE_WITH_INDICATION_MARKER_IDS = new Set<string>([
  // Hormones (MBS 66695)
  "cortisol",
  "dhea_s",
  "testosterone_total",
  "testosterone_free",
  "estradiol",
  "progesterone",
  "fsh",
  "lh",
  "shbg",
  "prolactin",
  // Extended thyroid
  "free_t3",
  "free_t4",
  "tpo_antibodies",
  "tg_antibodies",
  // Nutrients / trace elements
  "vitamin_d",
  "vitamin_b12",
  "folate",
  "magnesium",
  "zinc",
  "selenium",
  "copper",
  // Inflammation
  "crp",
  "homocysteine",
  "esr",
  "fibrinogen",
  "ferritin_inflammation",
]);

const ELIGIBILITY_META: Record<MedicareEligibility, Omit<MedicareEligibilityInfo, "type">> = {
  medicare_standard: {
    label: "Medicare",
    description:
      "Commonly Medicare-rebated on standard pathology panels when clinically appropriate.",
  },
  medicare_with_indication: {
    label: "Medicare (with indication)",
    description:
      "On the MBS when your doctor documents an accepted clinical indication and criteria are met.",
  },
  derived: {
    label: "Calculated",
    description: "Derived from other results — no separate Medicare test item.",
  },
};

export function getMedicareEligibility(biomarkerId: string): MedicareEligibilityInfo {
  let type: MedicareEligibility = "medicare_standard";

  if (DERIVED_MARKER_IDS.has(biomarkerId)) {
    type = "derived";
  } else if (MEDICARE_WITH_INDICATION_MARKER_IDS.has(biomarkerId)) {
    type = "medicare_with_indication";
  }

  return { type, ...ELIGIBILITY_META[type] };
}

export const MEDICARE_ELIGIBILITY_LEGEND: MedicareEligibilityInfo[] = (
  ["medicare_standard", "medicare_with_indication", "derived"] as MedicareEligibility[]
).map((type) => ({ type, ...ELIGIBILITY_META[type] }));

export function isDerivedBiomarker(biomarkerId: string): boolean {
  return DERIVED_MARKER_IDS.has(biomarkerId);
}
