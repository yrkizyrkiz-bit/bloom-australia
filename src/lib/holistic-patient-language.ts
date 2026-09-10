import { getBiomarkerById } from "@/data/biomarkers";

/** Everyday labels patients recognise — lab codes go in brackets, not as the headline. */
const PATIENT_FACING_LABELS: Record<string, string> = {
  ldl_cholesterol: "Bad cholesterol (LDL)",
  hdl_cholesterol: "Good cholesterol (HDL)",
  total_cholesterol: "Total cholesterol",
  triglycerides: "Blood fats (triglycerides)",
  non_hdl_cholesterol: "Other cholesterol (non-HDL)",
  vldl_cholesterol: "Blood-fat cholesterol (VLDL)",
  glucose: "Blood sugar",
  hba1c: "Average blood sugar (HbA1c)",
  insulin: "Insulin (blood-sugar hormone)",
  homa_ir: "Insulin resistance score (HOMA-IR)",
  egfr: "Kidney filter rate (eGFR)",
  creatinine: "Kidney waste marker (creatinine)",
  bun: "Kidney waste marker (urea/BUN)",
  uacr: "Urine protein (albumin/creatinine)",
  alt: "Liver enzyme (ALT)",
  ast: "Liver enzyme (AST)",
  ggt: "Liver enzyme (GGT)",
  alp: "Liver enzyme (ALP)",
  bilirubin_total: "Bilirubin (liver pigment)",
  albumin: "Blood protein (albumin)",
  crp: "Inflammation marker (CRP)",
  hs_crp: "Inflammation marker (hs-CRP)",
  homocysteine: "Homocysteine (heart-risk marker)",
  tsh: "Thyroid signal (TSH)",
  free_t4: "Thyroid hormone (Free T4)",
  free_t3: "Thyroid hormone (Free T3)",
  testosterone: "Testosterone",
  testosterone_total: "Testosterone",
  free_testosterone: "Free testosterone",
  estradiol: "Oestrogen (estradiol)",
  progesterone: "Progesterone",
  shbg: "Hormone-binding protein (SHBG)",
  cortisol: "Cortisol (stress hormone)",
  vitamin_d: "Vitamin D",
  b12: "Vitamin B12",
  folate: "Folate (B9)",
  ferritin: "Iron stores (ferritin)",
  iron: "Iron",
  transferrin_saturation: "Iron saturation (transferrin)",
  tibc: "Iron-binding capacity (TIBC)",
  haemoglobin: "Haemoglobin (oxygen in blood)",
  hemoglobin: "Haemoglobin (oxygen in blood)",
  hematocrit: "Haematocrit (red-cell volume)",
  mcv: "Red-cell size (MCV)",
  mch: "Haemoglobin per cell (MCH)",
  mchc: "Haemoglobin concentration (MCHC)",
  rdw: "Red-cell size variation (RDW)",
  rbc: "Red blood cell count",
  platelets: "Platelets (clotting cells)",
  potassium: "Potassium",
  sodium: "Sodium",
  calcium: "Calcium",
  phosphorus: "Phosphorus",
  bicarbonate: "Bicarbonate",
  pth: "Parathyroid hormone (PTH)",
};

export function patientFacingMarkerName(biomarkerId: string, fallbackName?: string): string {
  if (PATIENT_FACING_LABELS[biomarkerId]) return PATIENT_FACING_LABELS[biomarkerId];
  const def = getBiomarkerById(biomarkerId);
  if (def?.name) return def.name;
  return fallbackName || biomarkerId.replace(/_/g, " ");
}

export function markerMeaning(biomarkerId: string): string {
  const def = getBiomarkerById(biomarkerId);
  if (def?.description) return def.description.replace(/\s+/g, " ").trim();
  return "This is one of the markers from your blood test.";
}
