/**
 * Superpower / Hers-style score bands for Essential calculated biomarkers.
 * Used for portal copy and clinician-facing interpretation.
 */

export type DerivedScoreBand = {
  label: string;
  min: number;
  max: number;
  meaning: string;
};

export const DERIVED_SCORE_BANDS: Record<string, DerivedScoreBand[]> = {
  remnant_cholesterol: [
    { label: "Optimal", min: -0.5, max: 0.7, meaning: "Low remnant / triglyceride-rich particle burden." },
    { label: "Elevated", min: 0.7, max: 1.0, meaning: "Remnants are rising, often with insulin resistance." },
    { label: "High risk", min: 1.0, max: 5, meaning: "High remnant cholesterol; treat metabolic and lipid risk." },
  ],
  atherogenic_coefficient: [
    { label: "Optimal", min: 0, max: 2.0, meaning: "Favourable non-HDL to HDL balance." },
    { label: "Borderline", min: 2.0, max: 3.0, meaning: "Atherogenic cholesterol is moderately high vs HDL." },
    { label: "High risk", min: 3.0, max: 15, meaning: "Unfavourable lipid ratio; cardiovascular risk is higher." },
  ],
  homa_b: [
    { label: "Low output", min: 0, max: 70, meaning: "Beta-cell insulin output looks reduced for the glucose level." },
    { label: "Adequate", min: 70, max: 200, meaning: "Pancreatic insulin response is in a typical fasting range." },
    { label: "Compensating", min: 200, max: 500, meaning: "High output, often compensating for insulin resistance." },
  ],
  quicki: [
    { label: "Insulin resistant", min: 0.2, max: 0.33, meaning: "QUICKI in the insulin-resistance range." },
    { label: "Borderline", min: 0.33, max: 0.357, meaning: "Transitional insulin sensitivity." },
    { label: "Insulin sensitive", min: 0.357, max: 0.5, meaning: "Favourable insulin sensitivity." },
  ],
  mcauley_index: [
    { label: "Insulin resistant", min: 1, max: 5.8, meaning: "Low McAuley, insulin resistance likely." },
    { label: "Borderline", min: 5.8, max: 6.3, meaning: "Transitional metabolic flexibility." },
    { label: "Insulin sensitive", min: 6.3, max: 20, meaning: "Higher values mean better insulin sensitivity." },
  ],
  uric_acid_hdl_ratio: [
    { label: "Optimal", min: 0, max: 0.3, meaning: "Low uric acid relative to HDL." },
    { label: "Elevated", min: 0.3, max: 0.45, meaning: "Metabolic-syndrome pattern emerging." },
    { label: "High", min: 0.45, max: 2, meaning: "Unfavourable uric acid / HDL balance." },
  ],
  fib4: [
    { label: "Low fibrosis risk", min: 0, max: 1.3, meaning: "Unlikely advanced fibrosis. If age >65, <2.0 is the usual low-risk cut." },
    { label: "Indeterminate", min: 1.3, max: 2.67, meaning: "Cannot rule fibrosis in or out, consider context and follow-up." },
    { label: "High fibrosis risk", min: 2.67, max: 20, meaning: "Higher likelihood of advanced fibrosis, clinician review." },
  ],
  free_t3_t4_ratio: [
    { label: "Low conversion", min: 0.1, max: 0.28, meaning: "Lower T4-to-T3 conversion, illness, restriction or medication can do this." },
    { label: "Typical", min: 0.28, max: 0.45, meaning: "Free T3/T4 ratio in the usual adult range." },
    { label: "High", min: 0.45, max: 1, meaning: "Higher T3 relative to T4, interpret with TSH and free hormones." },
  ],
  apri: [
    { label: "Low fibrosis risk", min: 0, max: 0.5, meaning: "Significant fibrosis is unlikely." },
    { label: "Indeterminate", min: 0.5, max: 1.5, meaning: "Intermediate APRI, interpret with FIB-4 and LFTs." },
    { label: "High fibrosis risk", min: 1.5, max: 20, meaning: "Raises concern for significant fibrosis." },
  ],
  bilirubin_albumin_ratio: [
    { label: "Optimal", min: 0, max: 0.4, meaning: "Bilirubin load is low relative to albumin." },
    { label: "Elevated", min: 0.4, max: 0.8, meaning: "Rising excretory load or falling synthetic reserve." },
    { label: "High", min: 0.8, max: 5, meaning: "Unfavourable bilirubin / albumin balance, clinician review." },
  ],
  sii: [
    { label: "Low inflammation", min: 0, max: 500, meaning: "Systemic immune-inflammation index in a quiet range." },
    { label: "Moderate", min: 500, max: 1000, meaning: "Mild systemic inflammatory tone." },
    { label: "High inflammation", min: 1000, max: 10000, meaning: "Elevated SII, infection, stress or chronic inflammation." },
  ],
  siri: [
    { label: "Low", min: 0, max: 1.0, meaning: "Quiet innate-immune activation." },
    { label: "Moderate", min: 1.0, max: 1.5, meaning: "Borderline inflammatory response index." },
    { label: "High", min: 1.5, max: 50, meaning: "Elevated SIRI." },
  ],
  mlr: [
    { label: "Optimal", min: 0, max: 0.3, meaning: "Typical monocyte / lymphocyte balance." },
    { label: "Elevated", min: 0.3, max: 0.4, meaning: "Mild innate-immune shift." },
    { label: "High", min: 0.4, max: 5, meaning: "Higher monocyte tone vs lymphocytes." },
  ],
  nhr: [
    { label: "Optimal", min: 0, max: 3.5, meaning: "Neutrophils are low relative to HDL." },
    { label: "Elevated", min: 3.5, max: 5, meaning: "Inflammation-to-HDL balance is drifting up." },
    { label: "High", min: 5, max: 50, meaning: "High neutrophil / HDL ratio." },
  ],
  corrected_calcium: [
    { label: "Low", min: 1.5, max: 2.15, meaning: "Corrected calcium below the usual adult range." },
    { label: "Optimal", min: 2.15, max: 2.55, meaning: "Albumin-adjusted calcium is in range." },
    { label: "High", min: 2.55, max: 3.5, meaning: "Corrected calcium is high, review PTH, vitamin D, kidneys." },
  ],
  calculated_osmolality: [
    { label: "Low", min: 240, max: 275, meaning: "Dilute / low calculated osmolality." },
    { label: "Optimal", min: 275, max: 295, meaning: "Typical fasting calculated osmolality." },
    { label: "High", min: 295, max: 360, meaning: "Concentrated plasma, dehydration, glucose or urea." },
  ],
  mentzer_index: [
    { label: "Thalassaemia pattern", min: 5, max: 13, meaning: "MCV/RBC <13 can suggest thalassaemia trait. Confirm with Hb electrophoresis if indicated." },
    { label: "Indeterminate", min: 13, max: 16, meaning: "Does not clearly separate iron deficiency from thalassaemia." },
    { label: "Iron-deficiency pattern", min: 16, max: 40, meaning: "MCV/RBC >13 is more consistent with iron deficiency when anaemia is present." },
  ],
  kdigo_risk: [
    { label: "Low risk", min: 1, max: 1, meaning: "KDIGO green, eGFR and UACR in the lowest-risk band." },
    { label: "Moderate risk", min: 2, max: 2, meaning: "KDIGO yellow, closer kidney and heart monitoring." },
    { label: "High risk", min: 3, max: 3, meaning: "KDIGO orange, significant CKD risk." },
    { label: "Very high risk", min: 4, max: 4, meaning: "KDIGO red, specialist-level kidney risk." },
  ],
  tsh_index: [
    { label: "Low (central / over-replaced)", min: -2, max: 1.3, meaning: "TSH is low for the free T4, consider pituitary or over-replacement context." },
    { label: "Euthyroid", min: 1.3, max: 4.1, meaning: "Jostel TSH index in the usual euthyroid band." },
    { label: "High (underactive tone)", min: 4.1, max: 8, meaning: "TSH high for the free T4, hypothyroid pattern." },
  ],
  phenotypic_age: [
    { label: "Context only", min: 18, max: 120, meaning: "Compare with chronological age. Age acceleration is the scored marker." },
  ],
  age_acceleration: [
    { label: "Younger biologically", min: -25, max: 0, meaning: "PhenoAge is at or below chronological age." },
    { label: "Aligned", min: 0, max: 3, meaning: "Biological age is close to calendar age." },
    { label: "Older biologically", min: 3, max: 25, meaning: "PhenoAge exceeds calendar age, review inflammation, glucose and blood counts." },
  ],
};

export function interpretDerivedScore(
  biomarkerId: string,
  value: number
): DerivedScoreBand | null {
  const bands = DERIVED_SCORE_BANDS[biomarkerId];
  if (!bands || !Number.isFinite(value)) return null;
  return (
    bands.find((band) => value >= band.min && value <= band.max) ??
    bands[bands.length - 1] ??
    null
  );
}
