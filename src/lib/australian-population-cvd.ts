/**
 * Australian adult cardiovascular population reference values (SI / AU lab units).
 *
 * Primary sources (published study means; p25/p75 approximated from reported mean±SD
 * or IQR where full percentile tables were not published):
 * - AusDiab (Australian Diabetes, Obesity and Lifestyle Study) — lipids, glucose, CRP
 * - Greater Green Triangle Risk Factor Study (MJA) — LDL-C population mean
 * - ABS Australian Health Survey biomedical results — abnormal thresholds context
 *
 * These are general-adult cohort references for educational comparison only —
 * not age-standardised clinical targets.
 */

export type AuPopulationMarkerStats = {
  mean: number;
  p25: number;
  p75: number;
  unit: string;
  higherIsBetter: boolean;
  name: string;
};

/** Sex-specific where AusDiab published separate means; otherwise shared adult values. */
export const AU_CVD_POPULATION_STATS: Record<
  "male" | "female",
  Record<string, AuPopulationMarkerStats>
> = {
  male: {
    total_cholesterol: {
      name: "Total cholesterol",
      unit: "mmol/L",
      higherIsBetter: false,
      // AusDiab adults ~5.6 mmol/L (MJA lipid guidelines analysis)
      mean: 5.6,
      p25: 4.9,
      p75: 6.3,
    },
    ldl_cholesterol: {
      name: "Bad cholesterol (LDL)",
      unit: "mmol/L",
      higherIsBetter: false,
      // Greater Green Triangle adult mean LDL-C 3.23 mmol/L
      mean: 3.2,
      p25: 2.6,
      p75: 3.8,
    },
    hdl_cholesterol: {
      name: "Good cholesterol (HDL)",
      unit: "mmol/L",
      higherIsBetter: true,
      // AusDiab men ~1.3 mmol/L
      mean: 1.3,
      p25: 1.1,
      p75: 1.5,
    },
    triglycerides: {
      name: "Blood fats (triglycerides)",
      unit: "mmol/L",
      higherIsBetter: false,
      // AusDiab men geometric mean ~1.4 mmol/L
      mean: 1.4,
      p25: 0.9,
      p75: 2.0,
    },
    crp: {
      name: "Inflammation marker (CRP)",
      unit: "mg/L",
      higherIsBetter: false,
      // AusDiab follow-up geometric mean CRP men ~1.94 mg/L
      mean: 1.9,
      p25: 0.8,
      p75: 3.5,
    },
    homocysteine: {
      name: "Homocysteine",
      unit: "µmol/L",
      higherIsBetter: false,
      // Typical Australian adult community range midpoint
      mean: 10.5,
      p25: 8.0,
      p75: 13.0,
    },
    glucose: {
      name: "Blood sugar",
      unit: "mmol/L",
      higherIsBetter: false,
      // AusDiab fasting glucose men ~5.48 mmol/L
      mean: 5.5,
      p25: 5.1,
      p75: 5.9,
    },
    hba1c: {
      name: "Average blood sugar (HbA1c)",
      unit: "%",
      higherIsBetter: false,
      // AusDiab / AU adult population ~5.2% (NGT mean closer to 5.1%)
      mean: 5.2,
      p25: 4.9,
      p75: 5.5,
    },
  },
  female: {
    total_cholesterol: {
      name: "Total cholesterol",
      unit: "mmol/L",
      higherIsBetter: false,
      mean: 5.6,
      p25: 4.9,
      p75: 6.3,
    },
    ldl_cholesterol: {
      name: "Bad cholesterol (LDL)",
      unit: "mmol/L",
      higherIsBetter: false,
      mean: 3.2,
      p25: 2.6,
      p75: 3.8,
    },
    hdl_cholesterol: {
      name: "Good cholesterol (HDL)",
      unit: "mmol/L",
      higherIsBetter: true,
      // AusDiab women ~1.5 mmol/L
      mean: 1.5,
      p25: 1.3,
      p75: 1.7,
    },
    triglycerides: {
      name: "Blood fats (triglycerides)",
      unit: "mmol/L",
      higherIsBetter: false,
      // AusDiab women geometric mean ~1.1 mmol/L
      mean: 1.1,
      p25: 0.8,
      p75: 1.6,
    },
    crp: {
      name: "Inflammation marker (CRP)",
      unit: "mg/L",
      higherIsBetter: false,
      // AusDiab follow-up geometric mean CRP women ~2.16 mg/L
      mean: 2.2,
      p25: 0.9,
      p75: 3.8,
    },
    homocysteine: {
      name: "Homocysteine",
      unit: "µmol/L",
      higherIsBetter: false,
      mean: 9.5,
      p25: 7.5,
      p75: 12.0,
    },
    glucose: {
      name: "Blood sugar",
      unit: "mmol/L",
      higherIsBetter: false,
      // AusDiab fasting glucose women ~5.23 mmol/L
      mean: 5.2,
      p25: 4.9,
      p75: 5.6,
    },
    hba1c: {
      name: "Average blood sugar (HbA1c)",
      unit: "%",
      higherIsBetter: false,
      mean: 5.2,
      p25: 4.9,
      p75: 5.5,
    },
  },
};

export const AU_CVD_POPULATION_SOURCE =
  "Australian adult population references (AusDiab / Greater Green Triangle / ABS biomedical surveys). Approximate p25–p75 for educational comparison — not a personalised risk score.";
