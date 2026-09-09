import { getBiomarkerById } from "@/data/biomarkers";
import { patientFacingMarkerName } from "@/lib/holistic-patient-language";
import type { BiomarkerDefinition, BiomarkerStatus } from "@/types";

/** Short lay nicknames under the clinical title (Hers-style). */
const COMMON_NAMES: Record<string, string> = {
  ldl_cholesterol: 'The "bad" cholesterol',
  hdl_cholesterol: 'The "good" cholesterol',
  total_cholesterol: "Overall cholesterol in your blood",
  triglycerides: "A common type of blood fat",
  non_hdl_cholesterol: "Cholesterol that is not the protective type",
  vldl_cholesterol: "Cholesterol that carries blood fats",
  glucose: "Sugar in your blood",
  hba1c: "Your average blood sugar over ~3 months",
  insulin: "The hormone that moves sugar into cells",
  egfr: "How well your kidneys filter blood",
  creatinine: "A waste marker filtered by your kidneys",
  uacr: "Protein leak in urine",
  alt: "A marker of liver cell stress",
  ast: "A marker of liver (and muscle) stress",
  ggt: "A marker of liver and bile duct stress",
  alp: "A marker of liver and bone activity",
  bilirubin_total: "A pigment cleared by your liver",
  albumin: "A main protein made by your liver",
  crp: "A signal of inflammation in the body",
  hs_crp: "A sensitive inflammation signal",
  homocysteine: "A heart-risk amino acid marker",
  tsh: "The signal that tells your thyroid to work",
  free_t4: "An active thyroid hormone",
  free_t3: "An active thyroid hormone",
  vitamin_d: "The sunshine vitamin",
  ferritin: "Your stored iron",
  haemoglobin: "What carries oxygen in your blood",
  testosterone_total: "A key sex hormone",
  free_testosterone: "Active testosterone available to tissues",
  estradiol: "A key oestrogen hormone",
};

export function biomarkerCommonName(biomarker: BiomarkerDefinition): string {
  if (biomarker.commonName) return biomarker.commonName;
  if (COMMON_NAMES[biomarker.id]) return COMMON_NAMES[biomarker.id];
  return `A marker in your ${biomarker.category} panel`;
}

export function biomarkerDisplayTitle(biomarker: BiomarkerDefinition): string {
  return biomarker.name;
}

export type ResultDirection = "high" | "low" | "in_range" | "optimal" | "unknown";

export function getResultDirection(
  value: number | null | undefined,
  status: BiomarkerStatus | "untested",
  optimalLow: number,
  optimalHigh: number
): ResultDirection {
  if (value == null || status === "untested") return "unknown";
  if (status === "optimal") return "optimal";
  if (status === "normal") return "in_range";
  if (value > optimalHigh) return "high";
  if (value < optimalLow) return "low";
  return "in_range";
}

/** Hers-style one-line personal finding. */
export function biomarkerResultHeadline(
  biomarker: BiomarkerDefinition,
  direction: ResultDirection
): string {
  const name = biomarker.name;
  switch (direction) {
    case "high":
      return `Your ${name} is high.`;
    case "low":
      return `Your ${name} is low.`;
    case "optimal":
      return `Your ${name} looks good.`;
    case "in_range":
      return `Your ${name} is in range.`;
    default:
      return `About your ${name}`;
  }
}

/** Plain-English body under the headline — what it means for the body (Hers-style). */
export function biomarkerResultExplanation(
  biomarker: BiomarkerDefinition,
  _direction: ResultDirection
): string {
  return biomarker.description.replace(/\s+/g, " ").trim();
}

export function biomarkerStatusBadgeLabel(
  status: BiomarkerStatus | "untested",
  direction: ResultDirection
): string {
  if (status === "untested") return "Not tested";
  if (status === "optimal") return "Optimal";
  if (status === "normal") return "In range";
  if (status === "critical") return "Needs urgent review";
  if (direction === "high" || direction === "low") return "Out of range";
  return "Out of range";
}

export function relatedBiomarkerLabel(id: string): string {
  const def = getBiomarkerById(id);
  return patientFacingMarkerName(id, def?.name);
}
