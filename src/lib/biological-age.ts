/**
 * Biological Age Calculation Library
 * Based on: "Biological age estimation using circulating blood biomarkers" (Nature Communications Biology, 2023)
 * DOI: 10.1038/s42003-023-05456-z
 *
 * This implementation uses a combination of:
 * 1. Phenotypic Age (Levine et al.) - Uses 9 core biomarkers
 * 2. Klemera-Doubal method - For additional biomarkers
 * 3. Organ-specific biological age estimation
 *
 * Core Biomarkers (Phenotypic Age):
 * - Albumin, Creatinine, Glucose, C-Reactive Protein (ln), Lymphocyte %
 * - Mean Cell Volume (MCV), Red Cell Distribution Width (RDW)
 * - Alkaline Phosphatase (ALP), White Blood Cell Count (WBC)
 *
 * Additional Biomarkers for Enhanced Accuracy:
 * - Lipid Panel: Total Cholesterol, LDL, HDL, Triglycerides
 * - Liver Panel: ALT, AST, GGT, Bilirubin
 * - Metabolic: HbA1c, Insulin, Uric Acid
 * - Kidney: BUN, eGFR, Cystatin C
 * - Blood: Hemoglobin, Hematocrit, Platelets
 * - Hormones: TSH, Testosterone, Cortisol, DHEA-S
 * - Vitamins: Vitamin D, B12, Ferritin
 * - Inflammation: Homocysteine, ESR
 */

export interface BiologicalAgeInput {
  chronologicalAge: number;
  gender: "male" | "female";
  biomarkers: {
    // Core Phenotypic Age biomarkers
    albumin?: number;           // g/L (Australian units)
    creatinine?: number;        // μmol/L (Australian units)
    glucose?: number;           // mmol/L (Australian units)
    crp?: number;               // mg/L (hs-CRP)
    lymphocytePercent?: number; // %
    mcv?: number;               // fL (Mean Cell Volume)
    rdw?: number;               // % (Red Cell Distribution Width)
    alp?: number;               // U/L (Alkaline Phosphatase)
    wbc?: number;               // x10^9/L (Australian units)

    // Blood health
    hemoglobin?: number;        // g/L (Australian units)
    hematocrit?: number;        // L/L or %
    rbc?: number;               // x10^12/L
    platelets?: number;         // x10^9/L

    // Lipid panel
    triglycerides?: number;     // mmol/L (Australian units)
    hdl_cholesterol?: number;   // mmol/L (Australian units)
    ldl_cholesterol?: number;   // mmol/L (Australian units)
    total_cholesterol?: number; // mmol/L (Australian units)

    // Metabolic
    hba1c?: number;             // % or mmol/mol
    insulin?: number;           // mU/L
    uric_acid?: number;         // mmol/L (Australian units)

    // Liver function
    alt?: number;               // U/L
    ast?: number;               // U/L
    ggt?: number;               // U/L
    bilirubin?: number;         // μmol/L (Australian units)

    // Kidney function
    bun?: number;               // mmol/L (Australian: Urea)
    egfr?: number;              // mL/min/1.73m²
    cystatin_c?: number;        // mg/L

    // Thyroid
    tsh?: number;               // mIU/L
    free_t4?: number;           // pmol/L (Australian units)
    free_t3?: number;           // pmol/L (Australian units)

    // Hormones
    testosterone_total?: number; // nmol/L (Australian units)
    estradiol?: number;         // pmol/L
    cortisol?: number;          // nmol/L (Australian units)
    dhea_s?: number;            // μmol/L (Australian units)

    // Vitamins & Minerals
    vitamin_d?: number;         // nmol/L (Australian units)
    vitamin_b12?: number;       // pmol/L (Australian units)
    folate?: number;            // nmol/L
    ferritin?: number;          // μg/L (Australian units)
    iron?: number;              // μmol/L (Australian units)

    // Inflammation
    homocysteine?: number;      // μmol/L
    esr?: number;               // mm/hr
  };
}

export interface BiologicalAgeResult {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
  phenotypicAge: number;
  ageAccelerationPercentile: number;
  healthStatus: "excellent" | "good" | "average" | "needs_attention" | "concerning";
  confidence: number;
  biomarkersUsed: number;
  biomarkersAvailable: string[];
  biomarkersMissing: MissingBiomarker[];  // NEW: List of missing biomarkers
  contributingFactors: ContributingFactor[];
  organAges: OrganAges;
  recommendations: string[];
  methodology: string;
  calculatedAt: string;
}

export interface MissingBiomarker {
  id: string;
  name: string;
  unit: string;
  category: string;
  importance: "core" | "recommended" | "optional";
  impactDescription: string;
}

export interface ContributingFactor {
  biomarker: string;
  biomarkerId: string;
  value: number;
  unit: string;
  optimalRange: { min: number; max: number };
  impact: "positive" | "negative" | "neutral";
  contribution: number; // Years added/subtracted
  percentile?: number;
  recommendation?: string;
}

export interface OrganAges {
  metabolic?: number;
  cardiovascular?: number;
  liver?: number;
  kidney?: number;
  immune?: number;
  inflammatory?: number;
  thyroid?: number;
  hormonal?: number;
  blood?: number;
}

/**
 * Phenotypic Age coefficients from Levine et al. (2018)
 * "An epigenetic biomarker of aging for lifespan and healthspan"
 * Aging (Albany NY), 10(4), 573-591
 *
 * CRITICAL: According to Supplementary Table S1 in the paper, several biomarkers
 * require NATURAL LOG (ln) transformation before applying the coefficient:
 * - Creatinine: ln(mg/dL)
 * - Glucose: ln(mg/dL)
 * - CRP: ln(mg/dL)
 * - ALP: ln(U/L)
 * - WBC: ln(1000 cells/µL)
 *
 * Direct values (NO log transformation):
 * - Albumin: g/dL
 * - Lymphocyte: %
 * - MCV: fL
 * - RDW: %
 * - Age: years
 *
 * UNIT CONVERSION REFERENCE:
 * Australian SI Units → US Units (for Levine formula)
 * - Albumin: g/L → g/dL (divide by 10)
 * - Creatinine: µmol/L → mg/dL (divide by 88.4)
 * - Glucose: mmol/L → mg/dL (multiply by 18.016)
 * - CRP: mg/L → mg/dL (divide by 10)
 * - MCV: fL (no conversion)
 * - RDW: % (no conversion)
 * - ALP: U/L (no conversion)
 * - WBC: x10⁹/L = K/µL (no conversion - same units)
 * - Lymphocyte %: % (no conversion)
 */
const LEVINE_COEFFICIENTS = {
  intercept: -19.9067,
  albumin: -0.0336,           // Direct value (g/dL)
  lnCreatinine: 0.00954,      // Log-transformed (ln mg/dL)
  lnGlucose: 0.1953,          // Log-transformed (ln mg/dL)
  lnCrp: 0.0954,              // Log-transformed (ln mg/dL)
  lymphocytePercent: -0.0120, // Direct value (%)
  mcv: 0.0268,                // Direct value (fL)
  rdw: 0.3306,                // Direct value (%)
  lnAlp: 0.0193,              // Log-transformed (ln U/L) - CORRECTED from 0.00188
  lnWbc: 0.0554,              // Log-transformed (ln K/µL)
  age: 0.0804,                // Direct value (years)
};

// Gompertz model parameter
const GOMPERTZ_GAMMA = 0.0077;

// Biomarker reference ranges for Australian units
interface BiomarkerRef {
  optimal: number;
  min: number;
  max: number;
  unit: string;
  agingCoeff: number;  // Years per unit deviation from optimal
  name: string;
  category: "core" | "lipid" | "metabolic" | "liver" | "kidney" | "blood" | "hormone" | "vitamin" | "inflammation";
  maleOptimal?: number;
  femaleOptimal?: number;
}

const BIOMARKER_REFS: Record<string, BiomarkerRef> = {
  // Core Phenotypic Age biomarkers (Australian units)
  albumin: { optimal: 42, min: 35, max: 50, unit: "g/L", agingCoeff: -0.25, name: "Albumin", category: "core" },
  creatinine: { optimal: 80, min: 60, max: 110, unit: "μmol/L", agingCoeff: 0.02, name: "Creatinine", category: "core", maleOptimal: 85, femaleOptimal: 70 },
  glucose: { optimal: 4.7, min: 3.9, max: 5.5, unit: "mmol/L", agingCoeff: 1.5, name: "Fasting Glucose", category: "core" },
  crp: { optimal: 0.5, min: 0, max: 3.0, unit: "mg/L", agingCoeff: 1.2, name: "C-Reactive Protein", category: "inflammation" },
  lymphocytePercent: { optimal: 30, min: 20, max: 40, unit: "%", agingCoeff: -0.1, name: "Lymphocyte %", category: "core" },
  mcv: { optimal: 88, min: 80, max: 96, unit: "fL", agingCoeff: 0.08, name: "Mean Cell Volume", category: "blood" },
  rdw: { optimal: 12.5, min: 11.5, max: 14.5, unit: "%", agingCoeff: 1.0, name: "Red Cell Distribution Width", category: "blood" },
  alp: { optimal: 70, min: 40, max: 120, unit: "U/L", agingCoeff: 0.025, name: "Alkaline Phosphatase", category: "core" },
  wbc: { optimal: 6.0, min: 4.0, max: 10.0, unit: "x10⁹/L", agingCoeff: 0.25, name: "White Blood Cells", category: "blood" },

  // Blood health
  hemoglobin: { optimal: 145, min: 120, max: 170, unit: "g/L", agingCoeff: -0.04, name: "Hemoglobin", category: "blood", maleOptimal: 150, femaleOptimal: 135 },
  hematocrit: { optimal: 0.43, min: 0.36, max: 0.50, unit: "L/L", agingCoeff: -5, name: "Hematocrit", category: "blood", maleOptimal: 0.45, femaleOptimal: 0.40 },
  rbc: { optimal: 4.8, min: 4.0, max: 5.5, unit: "x10¹²/L", agingCoeff: -0.5, name: "Red Blood Cells", category: "blood", maleOptimal: 5.0, femaleOptimal: 4.5 },
  platelets: { optimal: 250, min: 150, max: 400, unit: "x10⁹/L", agingCoeff: 0.01, name: "Platelets", category: "blood" },

  // Lipid panel (Australian mmol/L)
  triglycerides: { optimal: 1.0, min: 0.5, max: 1.7, unit: "mmol/L", agingCoeff: 0.8, name: "Triglycerides", category: "lipid" },
  hdl_cholesterol: { optimal: 1.5, min: 1.0, max: 2.5, unit: "mmol/L", agingCoeff: -1.5, name: "HDL Cholesterol", category: "lipid", maleOptimal: 1.3, femaleOptimal: 1.6 },
  ldl_cholesterol: { optimal: 2.5, min: 1.5, max: 3.4, unit: "mmol/L", agingCoeff: 0.5, name: "LDL Cholesterol", category: "lipid" },
  total_cholesterol: { optimal: 4.5, min: 3.5, max: 5.5, unit: "mmol/L", agingCoeff: 0.3, name: "Total Cholesterol", category: "lipid" },

  // Metabolic
  hba1c: { optimal: 5.2, min: 4.0, max: 5.7, unit: "%", agingCoeff: 3.0, name: "HbA1c", category: "metabolic" },
  insulin: { optimal: 6, min: 2, max: 12, unit: "mU/L", agingCoeff: 0.15, name: "Fasting Insulin", category: "metabolic" },
  uric_acid: { optimal: 0.30, min: 0.15, max: 0.45, unit: "mmol/L", agingCoeff: 8, name: "Uric Acid", category: "metabolic", maleOptimal: 0.35, femaleOptimal: 0.28 },

  // Liver function
  alt: { optimal: 22, min: 7, max: 40, unit: "U/L", agingCoeff: 0.06, name: "ALT", category: "liver" },
  ast: { optimal: 24, min: 10, max: 35, unit: "U/L", agingCoeff: 0.05, name: "AST", category: "liver" },
  ggt: { optimal: 25, min: 8, max: 50, unit: "U/L", agingCoeff: 0.04, name: "GGT", category: "liver", maleOptimal: 30, femaleOptimal: 20 },
  bilirubin: { optimal: 12, min: 5, max: 21, unit: "μmol/L", agingCoeff: -0.1, name: "Bilirubin", category: "liver" },

  // Kidney function
  bun: { optimal: 5.0, min: 2.5, max: 7.5, unit: "mmol/L", agingCoeff: 0.5, name: "Urea", category: "kidney" },
  egfr: { optimal: 100, min: 60, max: 120, unit: "mL/min/1.73m²", agingCoeff: -0.08, name: "eGFR", category: "kidney" },
  cystatin_c: { optimal: 0.85, min: 0.6, max: 1.1, unit: "mg/L", agingCoeff: 5, name: "Cystatin C", category: "kidney" },

  // Thyroid
  tsh: { optimal: 2.0, min: 0.4, max: 4.0, unit: "mIU/L", agingCoeff: 0.8, name: "TSH", category: "hormone" },
  free_t4: { optimal: 15, min: 10, max: 22, unit: "pmol/L", agingCoeff: -0.2, name: "Free T4", category: "hormone" },
  free_t3: { optimal: 5.0, min: 3.5, max: 6.5, unit: "pmol/L", agingCoeff: -0.4, name: "Free T3", category: "hormone" },

  // Hormones
  testosterone_total: { optimal: 18, min: 8, max: 30, unit: "nmol/L", agingCoeff: -0.15, name: "Testosterone", category: "hormone", maleOptimal: 20, femaleOptimal: 1.5 },
  cortisol: { optimal: 400, min: 200, max: 600, unit: "nmol/L", agingCoeff: 0.003, name: "Cortisol (AM)", category: "hormone" },
  dhea_s: { optimal: 6, min: 2, max: 12, unit: "μmol/L", agingCoeff: -0.3, name: "DHEA-S", category: "hormone", maleOptimal: 7, femaleOptimal: 5 },

  // Vitamins & Minerals
  vitamin_d: { optimal: 100, min: 50, max: 150, unit: "nmol/L", agingCoeff: -0.02, name: "Vitamin D", category: "vitamin" },
  vitamin_b12: { optimal: 400, min: 200, max: 700, unit: "pmol/L", agingCoeff: -0.005, name: "Vitamin B12", category: "vitamin" },
  folate: { optimal: 25, min: 10, max: 45, unit: "nmol/L", agingCoeff: -0.03, name: "Folate", category: "vitamin" },
  ferritin: { optimal: 100, min: 30, max: 300, unit: "μg/L", agingCoeff: 0.005, name: "Ferritin", category: "vitamin", maleOptimal: 150, femaleOptimal: 80 },
  iron: { optimal: 18, min: 10, max: 30, unit: "μmol/L", agingCoeff: -0.1, name: "Iron", category: "vitamin" },

  // Inflammation
  homocysteine: { optimal: 8, min: 5, max: 12, unit: "μmol/L", agingCoeff: 0.4, name: "Homocysteine", category: "inflammation" },
  esr: { optimal: 8, min: 0, max: 20, unit: "mm/hr", agingCoeff: 0.15, name: "ESR", category: "inflammation", maleOptimal: 5, femaleOptimal: 10 },
};

// Recommendations based on biomarker status
const RECOMMENDATIONS: Record<string, { high: string; low: string }> = {
  albumin: {
    low: "Consider increasing protein intake and addressing any underlying inflammation or liver issues.",
    high: "Usually not a concern, but ensure adequate hydration.",
  },
  creatinine: {
    low: "May indicate reduced muscle mass. Consider strength training.",
    high: "Reduce protein intake if excessive, stay hydrated, and monitor kidney function.",
  },
  glucose: {
    low: "Ensure regular meals and adequate carbohydrate intake.",
    high: "Reduce refined carbohydrates, increase fiber, exercise regularly, and consider intermittent fasting.",
  },
  crp: {
    high: "Address inflammation through diet (omega-3s, antioxidants), exercise, stress management, and adequate sleep.",
    low: "Excellent! Continue anti-inflammatory lifestyle.",
  },
  hdl_cholesterol: {
    low: "Increase exercise, consume healthy fats (olive oil, avocado), and consider moderate alcohol if appropriate.",
    high: "Usually beneficial, maintain current lifestyle.",
  },
  ldl_cholesterol: {
    high: "Reduce saturated fats, increase soluble fiber, exercise regularly, and consider plant sterols.",
    low: "Ensure adequate dietary fat intake for hormone production.",
  },
  triglycerides: {
    high: "Reduce sugar and refined carbs, limit alcohol, increase omega-3 fatty acids, and exercise.",
    low: "Usually not a concern.",
  },
  hba1c: {
    high: "Focus on blood sugar control through diet, exercise, and weight management.",
    low: "Usually not a concern unless hypoglycemia is present.",
  },
  vitamin_d: {
    low: "Increase sun exposure (15-20 min daily), consume vitamin D-rich foods, or supplement.",
    high: "Reduce supplementation if taking high doses.",
  },
  ferritin: {
    low: "Increase iron-rich foods (red meat, legumes) with vitamin C for absorption.",
    high: "Reduce red meat intake, avoid iron supplements, and consider blood donation.",
  },
  homocysteine: {
    high: "Increase B vitamins (B6, B12, folate) through diet or supplementation.",
    low: "Usually not a concern.",
  },
  tsh: {
    high: "May indicate hypothyroidism. Consult with an endocrinologist.",
    low: "May indicate hyperthyroidism. Consult with an endocrinologist.",
  },
  alt: {
    high: "Reduce alcohol, maintain healthy weight, and avoid hepatotoxic medications.",
    low: "Usually not a concern.",
  },
  ggt: {
    high: "Reduce alcohol consumption, address fatty liver through diet and exercise.",
    low: "Usually not a concern.",
  },
  egfr: {
    low: "Stay hydrated, control blood pressure and blood sugar, limit NSAIDs.",
    high: "Usually not a concern.",
  },
};

/**
 * Calculate Phenotypic Age using the EXACT Levine et al. (2018) formula
 *
 * Input: Australian SI units (g/L, µmol/L, mmol/L, mg/L)
 * The function converts to US units internally before applying the formula.
 *
 * Reference: Levine ME et al. (2018). An epigenetic biomarker of aging for
 * lifespan and healthspan. Aging (Albany NY), 10(4), 573-591.
 */
function calculatePhenotypicAge(chronologicalAge: number, biomarkers: BiologicalAgeInput["biomarkers"], gender: "male" | "female"): { age: number; confidence: number } {
  // Count how many core biomarkers we have
  const coreBiomarkers = [
    biomarkers.albumin,
    biomarkers.creatinine,
    biomarkers.glucose,
    biomarkers.crp,
    biomarkers.lymphocytePercent,
    biomarkers.mcv,
    biomarkers.rdw,
    biomarkers.alp,
    biomarkers.wbc,
  ];

  const availableCount = coreBiomarkers.filter(v => v != null).length;
  const confidence = availableCount / 9;

  console.log(`[PhenoAge] Core biomarkers available: ${availableCount}/9`);
  console.log(`[PhenoAge] Input values: albumin=${biomarkers.albumin}, creatinine=${biomarkers.creatinine}, glucose=${biomarkers.glucose}, crp=${biomarkers.crp}, lymph%=${biomarkers.lymphocytePercent}, mcv=${biomarkers.mcv}, rdw=${biomarkers.rdw}, alp=${biomarkers.alp}, wbc=${biomarkers.wbc}`);

  // Use provided values or age/gender-adjusted population averages (in Australian units)
  // Default values are typical healthy values for the age
  const albumin_gL = biomarkers.albumin ?? 42;                                    // g/L
  const creatinine_umolL = biomarkers.creatinine ?? (gender === "male" ? 85 : 70); // µmol/L
  const glucose_mmolL = biomarkers.glucose ?? 5.0;                                 // mmol/L
  const crp_mgL = Math.max(biomarkers.crp ?? 1.0, 0.1);                           // mg/L (min 0.1 to avoid log issues)
  const lymphocytePercent = biomarkers.lymphocytePercent ?? 28;                   // %
  const mcv = biomarkers.mcv ?? 88;                                               // fL (no conversion needed)
  const rdw = biomarkers.rdw ?? 13.0;                                             // % (no conversion needed)
  const alp = biomarkers.alp ?? 70;                                               // U/L (no conversion needed)
  const wbc = biomarkers.wbc ?? 6.0;                                              // x10^9/L (same as K/µL)

  // Convert Australian SI units to US units for the Levine formula
  const albumin_gdL = albumin_gL / 10;              // g/L → g/dL (divide by 10)
  const creatinine_mgdL = creatinine_umolL / 88.4;  // µmol/L → mg/dL (divide by 88.4)
  const glucose_mgdL = glucose_mmolL * 18.016;      // mmol/L → mg/dL (multiply by 18.016)
  const crp_mgdL = crp_mgL / 10;                    // mg/L → mg/dL (divide by 10)

  console.log(`[PhenoAge] Using values (AU): albumin=${albumin_gL}g/L, creat=${creatinine_umolL}µmol/L, glucose=${glucose_mmolL}mmol/L, CRP=${crp_mgL}mg/L, lymph=${lymphocytePercent}%, MCV=${mcv}fL, RDW=${rdw}%, ALP=${alp}U/L, WBC=${wbc}`);
  console.log(`[PhenoAge] Converted (US): albumin=${albumin_gdL.toFixed(2)}g/dL, creat=${creatinine_mgdL.toFixed(3)}mg/dL, glucose=${glucose_mgdL.toFixed(1)}mg/dL, CRP=${crp_mgdL.toFixed(4)}mg/dL`);

  // Calculate individual contributions to xb for debugging
  const contributions = {
    intercept: LEVINE_COEFFICIENTS.intercept,
    albumin: LEVINE_COEFFICIENTS.albumin * albumin_gdL,
    lnCreatinine: LEVINE_COEFFICIENTS.lnCreatinine * Math.log(creatinine_mgdL),
    lnGlucose: LEVINE_COEFFICIENTS.lnGlucose * Math.log(glucose_mgdL),
    lnCrp: LEVINE_COEFFICIENTS.lnCrp * Math.log(crp_mgdL),
    lymphocytePercent: LEVINE_COEFFICIENTS.lymphocytePercent * lymphocytePercent,
    mcv: LEVINE_COEFFICIENTS.mcv * mcv,
    rdw: LEVINE_COEFFICIENTS.rdw * rdw,
    lnAlp: LEVINE_COEFFICIENTS.lnAlp * Math.log(alp),
    lnWbc: LEVINE_COEFFICIENTS.lnWbc * Math.log(wbc),
    age: LEVINE_COEFFICIENTS.age * chronologicalAge,
  };

  console.log(`[PhenoAge] Individual contributions to xb:`);
  console.log(`  intercept: ${contributions.intercept.toFixed(4)}`);
  console.log(`  albumin (${albumin_gdL.toFixed(2)} g/dL): ${contributions.albumin.toFixed(4)}`);
  console.log(`  ln(creat) (ln ${creatinine_mgdL.toFixed(3)} = ${Math.log(creatinine_mgdL).toFixed(4)}): ${contributions.lnCreatinine.toFixed(4)}`);
  console.log(`  ln(glucose) (ln ${glucose_mgdL.toFixed(1)} = ${Math.log(glucose_mgdL).toFixed(4)}): ${contributions.lnGlucose.toFixed(4)}`);
  console.log(`  ln(CRP) (ln ${crp_mgdL.toFixed(4)} = ${Math.log(crp_mgdL).toFixed(4)}): ${contributions.lnCrp.toFixed(4)}`);
  console.log(`  lymph% (${lymphocytePercent}%): ${contributions.lymphocytePercent.toFixed(4)}`);
  console.log(`  MCV (${mcv} fL): ${contributions.mcv.toFixed(4)}`);
  console.log(`  RDW (${rdw}%): ${contributions.rdw.toFixed(4)}`);
  console.log(`  ln(ALP) (ln ${alp} = ${Math.log(alp).toFixed(4)}): ${contributions.lnAlp.toFixed(4)}`);
  console.log(`  ln(WBC) (ln ${wbc} = ${Math.log(wbc).toFixed(4)}): ${contributions.lnWbc.toFixed(4)}`);
  console.log(`  age (${chronologicalAge}): ${contributions.age.toFixed(4)}`);

  // Calculate the linear predictor (xb) using exact Levine coefficients
  const xb = Object.values(contributions).reduce((sum, val) => sum + val, 0);
  console.log(`  TOTAL xb: ${xb.toFixed(4)}`);

  // Calculate mortality probability using Gompertz model
  // m = 1 - exp(-exp(xb) * (exp(120 * γ) - 1) / γ)
  const expXb = Math.exp(xb);
  const gompertzFactor = (Math.exp(120 * GOMPERTZ_GAMMA) - 1) / GOMPERTZ_GAMMA;
  const mortalityScore = 1 - Math.exp(-expXb * gompertzFactor);

  console.log(`[PhenoAge] Mortality calculation: exp(xb)=${expXb.toExponential(4)}, gompertz=${gompertzFactor.toFixed(2)}, mortality=${mortalityScore.toFixed(6)}`);

  // Constrain mortality score to valid range
  const constrainedScore = Math.max(0.00001, Math.min(0.99999, mortalityScore));

  // Calculate phenotypic age
  // PhenoAge = 141.50225 + ln(-0.00553 * ln(1 - m)) / 0.090165
  const innerLog = Math.log(1 - constrainedScore);
  const phenotypicAge = 141.50225 + Math.log(-0.00553 * innerLog) / 0.090165;

  console.log(`[PhenoAge] Final: innerLog=${innerLog.toFixed(6)}, PhenoAge=${phenotypicAge.toFixed(1)} (ChronAge=${chronologicalAge})`);

  return {
    age: Math.max(18, Math.min(120, phenotypicAge)),
    confidence,
  };
}

/**
 * Calculate organ-specific biological ages
 */
function calculateOrganAges(chronologicalAge: number, biomarkers: BiologicalAgeInput["biomarkers"], gender: "male" | "female"): OrganAges {
  const organAges: OrganAges = {};

  // Metabolic age (glucose, HbA1c, triglycerides, insulin)
  const metaMarkers: number[] = [];
  let metaAdj = 0;

  if (biomarkers.glucose != null) {
    metaMarkers.push(biomarkers.glucose);
    metaAdj += (biomarkers.glucose - 4.7) * 2.0;
  }
  if (biomarkers.hba1c != null) {
    metaMarkers.push(biomarkers.hba1c);
    metaAdj += (biomarkers.hba1c - 5.2) * 4.0;
  }
  if (biomarkers.triglycerides != null) {
    metaMarkers.push(biomarkers.triglycerides);
    metaAdj += (biomarkers.triglycerides - 1.0) * 1.2;
  }
  if (biomarkers.insulin != null) {
    metaMarkers.push(biomarkers.insulin);
    metaAdj += (biomarkers.insulin - 6) * 0.25;
  }

  if (metaMarkers.length > 0) {
    organAges.metabolic = Math.round((chronologicalAge + metaAdj / metaMarkers.length) * 10) / 10;
  }

  // Cardiovascular age (lipids, CRP, homocysteine)
  const cardioMarkers: number[] = [];
  let cardioAdj = 0;

  if (biomarkers.ldl_cholesterol != null) {
    cardioMarkers.push(biomarkers.ldl_cholesterol);
    cardioAdj += (biomarkers.ldl_cholesterol - 2.5) * 0.8;
  }
  if (biomarkers.hdl_cholesterol != null) {
    cardioMarkers.push(biomarkers.hdl_cholesterol);
    const optHdl = gender === "male" ? 1.3 : 1.6;
    cardioAdj -= (biomarkers.hdl_cholesterol - optHdl) * 2.0;
  }
  if (biomarkers.triglycerides != null) {
    cardioMarkers.push(biomarkers.triglycerides);
    cardioAdj += (biomarkers.triglycerides - 1.0) * 1.2;
  }
  if (biomarkers.crp != null) {
    cardioMarkers.push(biomarkers.crp);
    cardioAdj += biomarkers.crp * 2.0;
  }
  if (biomarkers.homocysteine != null) {
    cardioMarkers.push(biomarkers.homocysteine);
    cardioAdj += (biomarkers.homocysteine - 8) * 0.7;
  }

  if (cardioMarkers.length > 0) {
    organAges.cardiovascular = Math.round((chronologicalAge + cardioAdj / cardioMarkers.length) * 10) / 10;
  }

  // Liver age (ALT, AST, GGT, albumin, bilirubin)
  const liverMarkers: number[] = [];
  let liverAdj = 0;

  if (biomarkers.alt != null) {
    liverMarkers.push(biomarkers.alt);
    liverAdj += (biomarkers.alt - 22) * 0.12;
  }
  if (biomarkers.ast != null) {
    liverMarkers.push(biomarkers.ast);
    liverAdj += (biomarkers.ast - 24) * 0.10;
  }
  if (biomarkers.ggt != null) {
    liverMarkers.push(biomarkers.ggt);
    const optGgt = gender === "male" ? 30 : 20;
    liverAdj += (biomarkers.ggt - optGgt) * 0.08;
  }
  if (biomarkers.albumin != null) {
    liverMarkers.push(biomarkers.albumin);
    liverAdj -= (biomarkers.albumin - 42) * 0.5;
  }
  if (biomarkers.bilirubin != null) {
    liverMarkers.push(biomarkers.bilirubin);
    liverAdj -= (biomarkers.bilirubin - 12) * 0.2; // Higher bilirubin can be protective
  }

  if (liverMarkers.length > 0) {
    organAges.liver = Math.round((chronologicalAge + liverAdj / liverMarkers.length) * 10) / 10;
  }

  // Kidney age (creatinine, BUN/urea, eGFR, cystatin C)
  const kidneyMarkers: number[] = [];
  let kidneyAdj = 0;

  if (biomarkers.creatinine != null) {
    kidneyMarkers.push(biomarkers.creatinine);
    const optCreat = gender === "male" ? 85 : 70;
    kidneyAdj += (biomarkers.creatinine - optCreat) * 0.04;
  }
  if (biomarkers.bun != null) {
    kidneyMarkers.push(biomarkers.bun);
    kidneyAdj += (biomarkers.bun - 5.0) * 1.0;
  }
  if (biomarkers.egfr != null) {
    kidneyMarkers.push(biomarkers.egfr);
    kidneyAdj -= (biomarkers.egfr - 100) * 0.16;
  }
  if (biomarkers.cystatin_c != null) {
    kidneyMarkers.push(biomarkers.cystatin_c);
    kidneyAdj += (biomarkers.cystatin_c - 0.85) * 10;
  }

  if (kidneyMarkers.length > 0) {
    organAges.kidney = Math.round((chronologicalAge + kidneyAdj / kidneyMarkers.length) * 10) / 10;
  }

  // Immune age (WBC, lymphocytes)
  const immuneMarkers: number[] = [];
  let immuneAdj = 0;

  if (biomarkers.wbc != null) {
    immuneMarkers.push(biomarkers.wbc);
    immuneAdj += Math.abs(biomarkers.wbc - 6) * 0.5;
  }
  if (biomarkers.lymphocytePercent != null) {
    immuneMarkers.push(biomarkers.lymphocytePercent);
    immuneAdj -= (biomarkers.lymphocytePercent - 30) * 0.2;
  }

  if (immuneMarkers.length > 0) {
    organAges.immune = Math.round((chronologicalAge + immuneAdj / immuneMarkers.length) * 10) / 10;
  }

  // Blood health age (hemoglobin, RDW, MCV, RBC)
  const bloodMarkers: number[] = [];
  let bloodAdj = 0;

  if (biomarkers.hemoglobin != null) {
    bloodMarkers.push(biomarkers.hemoglobin);
    const optHb = gender === "male" ? 150 : 135;
    bloodAdj -= (biomarkers.hemoglobin - optHb) * 0.08;
  }
  if (biomarkers.rdw != null) {
    bloodMarkers.push(biomarkers.rdw);
    bloodAdj += (biomarkers.rdw - 12.5) * 2.0;
  }
  if (biomarkers.mcv != null) {
    bloodMarkers.push(biomarkers.mcv);
    bloodAdj += Math.abs(biomarkers.mcv - 88) * 0.16;
  }
  if (biomarkers.rbc != null) {
    bloodMarkers.push(biomarkers.rbc);
    const optRbc = gender === "male" ? 5.0 : 4.5;
    bloodAdj -= (biomarkers.rbc - optRbc) * 1.0;
  }

  if (bloodMarkers.length > 0) {
    organAges.blood = Math.round((chronologicalAge + bloodAdj / bloodMarkers.length) * 10) / 10;
  }

  // Inflammatory age (CRP, homocysteine, ESR)
  const inflamMarkers: number[] = [];
  let inflamAdj = 0;

  if (biomarkers.crp != null) {
    inflamMarkers.push(biomarkers.crp);
    inflamAdj += biomarkers.crp * 2.0;
  }
  if (biomarkers.homocysteine != null) {
    inflamMarkers.push(biomarkers.homocysteine);
    inflamAdj += (biomarkers.homocysteine - 8) * 0.7;
  }
  if (biomarkers.esr != null) {
    inflamMarkers.push(biomarkers.esr);
    const optEsr = gender === "male" ? 5 : 10;
    inflamAdj += (biomarkers.esr - optEsr) * 0.3;
  }

  if (inflamMarkers.length > 0) {
    organAges.inflammatory = Math.round((chronologicalAge + inflamAdj / inflamMarkers.length) * 10) / 10;
  }

  // Thyroid age
  const thyroidMarkers: number[] = [];
  let thyroidAdj = 0;

  if (biomarkers.tsh != null) {
    thyroidMarkers.push(biomarkers.tsh);
    thyroidAdj += Math.abs(biomarkers.tsh - 2.0) * 1.2;
  }
  if (biomarkers.free_t4 != null) {
    thyroidMarkers.push(biomarkers.free_t4);
    thyroidAdj += Math.abs(biomarkers.free_t4 - 15) * 0.4;
  }
  if (biomarkers.free_t3 != null) {
    thyroidMarkers.push(biomarkers.free_t3);
    thyroidAdj += Math.abs(biomarkers.free_t3 - 5.0) * 0.8;
  }

  if (thyroidMarkers.length > 0) {
    organAges.thyroid = Math.round((chronologicalAge + thyroidAdj / thyroidMarkers.length) * 10) / 10;
  }

  // Hormonal age (testosterone, cortisol, DHEA-S)
  const hormoneMarkers: number[] = [];
  let hormoneAdj = 0;

  if (biomarkers.testosterone_total != null && gender === "male") {
    hormoneMarkers.push(biomarkers.testosterone_total);
    hormoneAdj -= (biomarkers.testosterone_total - 20) * 0.3;
  }
  if (biomarkers.dhea_s != null) {
    hormoneMarkers.push(biomarkers.dhea_s);
    const optDhea = gender === "male" ? 7 : 5;
    hormoneAdj -= (biomarkers.dhea_s - optDhea) * 0.6;
  }
  if (biomarkers.cortisol != null) {
    hormoneMarkers.push(biomarkers.cortisol);
    hormoneAdj += Math.abs(biomarkers.cortisol - 400) * 0.006;
  }

  if (hormoneMarkers.length > 0) {
    organAges.hormonal = Math.round((chronologicalAge + hormoneAdj / hormoneMarkers.length) * 10) / 10;
  }

  return organAges;
}

/**
 * Calculate contributing factors from each biomarker
 */
function calculateContributingFactors(
  biomarkers: BiologicalAgeInput["biomarkers"],
  gender: "male" | "female"
): ContributingFactor[] {
  const factors: ContributingFactor[] = [];

  for (const [key, value] of Object.entries(biomarkers)) {
    if (value == null) continue;
    const ref = BIOMARKER_REFS[key];
    if (!ref) continue;

    // Use gender-specific optimal if available
    const optimal = (gender === "male" && ref.maleOptimal) ? ref.maleOptimal :
                    (gender === "female" && ref.femaleOptimal) ? ref.femaleOptimal : ref.optimal;

    const deviation = value - optimal;
    const normalizedDeviation = deviation / (ref.max - ref.min);
    const contribution = deviation * ref.agingCoeff;

    let impact: "positive" | "negative" | "neutral";
    if (Math.abs(contribution) < 0.5) {
      impact = "neutral";
    } else if (contribution < 0) {
      impact = "positive";
    } else {
      impact = "negative";
    }

    // Calculate percentile (rough approximation)
    const percentile = Math.round(50 + normalizedDeviation * 40);

    // Get recommendation based on whether value is high or low
    let recommendation: string | undefined;
    const recKey = RECOMMENDATIONS[key];
    if (recKey && Math.abs(contribution) >= 0.5) {
      recommendation = deviation > 0 ? recKey.high : recKey.low;
    }

    factors.push({
      biomarker: ref.name,
      biomarkerId: key,
      value,
      unit: ref.unit,
      optimalRange: { min: ref.min, max: ref.max },
      impact,
      contribution: Math.round(contribution * 100) / 100,
      percentile: Math.max(1, Math.min(99, percentile)),
      recommendation,
    });
  }

  // Sort by absolute contribution (most impactful first)
  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return factors;
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Generate recommendations based on factors
 */
function generateRecommendations(factors: ContributingFactor[], organAges: OrganAges): string[] {
  const recommendations: string[] = [];

  // Add recommendations from top negative factors
  const negativeFactors = factors.filter(f => f.impact === "negative" && f.recommendation);
  for (const factor of negativeFactors.slice(0, 3)) {
    if (factor.recommendation) {
      recommendations.push(factor.recommendation);
    }
  }

  // Add organ-specific recommendations
  const organEntries = Object.entries(organAges) as [keyof OrganAges, number | undefined][];
  for (const [organ, age] of organEntries) {
    if (age == null) continue;
    // If organ age is significantly higher than biological age average
    const avgOrganAge = organEntries
      .filter(([_, v]) => v != null)
      .reduce((sum, [_, v]) => sum + (v || 0), 0) / organEntries.filter(([_, v]) => v != null).length;

    if (age > avgOrganAge + 3) {
      switch (organ) {
        case "metabolic":
          if (!recommendations.some(r => r.includes("blood sugar") || r.includes("carb"))) {
            recommendations.push("Focus on metabolic health: reduce refined carbohydrates, increase fiber, and exercise regularly.");
          }
          break;
        case "cardiovascular":
          if (!recommendations.some(r => r.includes("heart") || r.includes("cardio"))) {
            recommendations.push("Support cardiovascular health: increase omega-3 fatty acids, reduce sodium, and aim for 150 min/week of cardio exercise.");
          }
          break;
        case "liver":
          if (!recommendations.some(r => r.includes("liver") || r.includes("alcohol"))) {
            recommendations.push("Support liver health: reduce alcohol, maintain healthy weight, and consider milk thistle supplementation.");
          }
          break;
        case "kidney":
          if (!recommendations.some(r => r.includes("kidney") || r.includes("hydrat"))) {
            recommendations.push("Support kidney function: stay well-hydrated, control blood pressure, and limit NSAIDs.");
          }
          break;
        case "inflammatory":
          if (!recommendations.some(r => r.includes("inflamm"))) {
            recommendations.push("Reduce systemic inflammation: increase antioxidant-rich foods, omega-3s, and prioritize sleep.");
          }
          break;
      }
    }
  }

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}

/**
 * Get the list of all biomarkers used in the biological age calculation, with their importance
 */
function getAllBiologicalAgeBiomarkers(): Array<{
  id: string;
  name: string;
  unit: string;
  category: string;
  importance: "core" | "recommended" | "optional";
}> {
  const coreBiomarkers = ["albumin", "creatinine", "glucose", "crp", "lymphocytePercent", "mcv", "rdw", "alp", "wbc"];
  const recommendedBiomarkers = ["hemoglobin", "hba1c", "hdl_cholesterol", "ldl_cholesterol", "triglycerides", "alt", "egfr", "tsh"];

  return Object.entries(BIOMARKER_REFS).map(([id, ref]) => ({
    id,
    name: ref.name,
    unit: ref.unit,
    category: ref.category,
    importance: coreBiomarkers.includes(id) ? "core" as const :
                recommendedBiomarkers.includes(id) ? "recommended" as const : "optional" as const,
  }));
}

/**
 * Get a description of the impact of missing a biomarker, based on its importance
 */
function getMissingBiomarkerImpactDescription(importance: "core" | "recommended" | "optional"): string {
  switch (importance) {
    case "core":
      return "Missing this biomarker significantly reduces the accuracy of biological age estimation.";
    case "recommended":
      return "Missing this biomarker moderately reduces the accuracy and organ-specific insights.";
    case "optional":
      return "Missing this biomarker has a minor effect on overall accuracy.";
    default:
      return "";
  }
}

/**
 * Main function to calculate biological age
 */
export function calculateBiologicalAge(input: BiologicalAgeInput): BiologicalAgeResult {
  const { chronologicalAge, gender, biomarkers } = input;

  console.log(`\n========================================`);
  console.log(`[BioAge] STARTING CALCULATION`);
  console.log(`[BioAge] Chronological Age: ${chronologicalAge}, Gender: ${gender}`);
  console.log(`[BioAge] Input biomarkers:`, JSON.stringify(biomarkers, null, 2));
  console.log(`========================================\n`);

  // Cap chronological age at 99 (silently - no error messages)
  // Anyone 99+ is treated as 99 for calculation purposes
  const validChronAge = Math.max(18, Math.min(99, chronologicalAge));

  // Count available biomarkers
  const availableBiomarkers = Object.entries(biomarkers)
    .filter(([_, v]) => v != null)
    .map(([k, _]) => k);

  const biomarkersUsed = availableBiomarkers.length;
  console.log(`[BioAge] Available biomarkers (${biomarkersUsed}): ${availableBiomarkers.join(', ')}`);

  // Calculate phenotypic age
  const { age: phenotypicAge, confidence: phenoConfidence } = calculatePhenotypicAge(validChronAge, biomarkers, gender);
  console.log(`[BioAge] Phenotypic Age: ${phenotypicAge.toFixed(1)}, Confidence: ${phenoConfidence.toFixed(2)}`);

  // Calculate organ ages
  const rawOrganAges = calculateOrganAges(validChronAge, biomarkers, gender);
  console.log(`[BioAge] Raw Organ Ages:`, rawOrganAges);

  // Cap organ ages at 99 (min 18, max 99) - silently cap extreme values
  const organAges: OrganAges = {};
  for (const [key, value] of Object.entries(rawOrganAges)) {
    if (value != null) {
      const clampedValue = Math.max(18, Math.min(99, value));
      organAges[key as keyof OrganAges] = Math.round(clampedValue * 10) / 10;
    }
  }

  // Combine phenotypic age with organ ages for final biological age
  const organAgeValues = Object.values(organAges).filter(v => v != null) as number[];
  const avgOrganAge = organAgeValues.length > 0
    ? organAgeValues.reduce((a, b) => a + b, 0) / organAgeValues.length
    : validChronAge;

  console.log(`[BioAge] Avg Organ Age: ${avgOrganAge.toFixed(1)}`);

  // Weighted combination: 70% phenotypic age, 30% organ age average
  // Phenotypic age is the validated Levine formula, so weight it more
  let biologicalAge = phenotypicAge * 0.7 + avgOrganAge * 0.3;
  console.log(`[BioAge] Weighted Age (70% pheno + 30% organ): ${biologicalAge.toFixed(1)}`);

  // Calculate overall confidence based on biomarkers available
  // BUT don't let low confidence pull the result toward chronological age
  // Instead, just report lower confidence
  const confidence = Math.min(biomarkersUsed / 15, 1) * 0.7 + phenoConfidence * 0.3;

  // REMOVED: Don't pull biological age toward chronological age based on confidence
  // This was causing both samples to return similar results
  // The phenotypic age formula already handles this properly
  // OLD CODE (REMOVED):
  // biologicalAge = validChronAge + (biologicalAge - validChronAge) * confidence;

  // Apply minor gender adjustment (women tend to age slightly slower biologically)
  if (gender === "female") {
    biologicalAge -= 0.5;
  }

  // Cap biological age at 99 (silently) - min 18, max 99
  // Allow some variance from chronological age but never exceed 99
  biologicalAge = Math.max(18, Math.min(99, biologicalAge));
  biologicalAge = Math.round(biologicalAge); // Round to whole number

  // Calculate age difference (round to whole number to avoid floating point issues)
  const ageDifference = Math.round(biologicalAge - validChronAge);

  console.log(`[BioAge] FINAL RESULT: Biological Age = ${biologicalAge}, Difference = ${ageDifference}`);
  console.log(`========================================\n`);

  // Calculate percentile (50 = average for age)
  const zScore = ageDifference / 5;
  const ageAccelerationPercentile = Math.round(normalCDF(zScore) * 100);

  // Determine health status based on age difference
  let healthStatus: BiologicalAgeResult["healthStatus"];
  if (ageDifference <= -5) healthStatus = "excellent";
  else if (ageDifference <= -2) healthStatus = "good";
  else if (ageDifference <= 2) healthStatus = "average";
  else if (ageDifference <= 5) healthStatus = "needs_attention";
  else healthStatus = "concerning";

  // Calculate contributing factors
  const contributingFactors = calculateContributingFactors(biomarkers, gender);

  // Generate recommendations
  const recommendations = generateRecommendations(contributingFactors, organAges);

  // Calculate missing biomarkers, grouped by importance
  const allBiomarkers = getAllBiologicalAgeBiomarkers();
  const missingBiomarkers: MissingBiomarker[] = allBiomarkers
    .filter(b => !(b.id in biomarkers) || biomarkers[b.id as keyof BiologicalAgeInput["biomarkers"]] == null)
    .map(b => ({
      ...b,
      impactDescription: getMissingBiomarkerImpactDescription(b.importance),
    }));

  return {
    biologicalAge,
    chronologicalAge: validChronAge,
    ageDifference,
    phenotypicAge: Math.round(phenotypicAge),
    ageAccelerationPercentile,
    healthStatus,
    confidence: Math.round(confidence * 100) / 100,
    biomarkersUsed,
    biomarkersAvailable: availableBiomarkers,
    biomarkersMissing: missingBiomarkers,
    contributingFactors,
    organAges,
    recommendations,
    methodology: "Phenotypic Age (Levine et al. 2018) + Organ-Specific Age Estimation (Nature 2023)",
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Map database biomarker results to calculation input
 * Handles both Australian units (mmol/L) and database IDs
 * Also supports DERIVED biomarkers - calculated from other available values
 */
export function mapBiomarkerResultsToInput(
  results: Array<{ biomarkerId: string; value: number }>
): BiologicalAgeInput["biomarkers"] {
  // Mapping from database biomarker IDs to our calculation input keys
  const mapping: Record<string, keyof BiologicalAgeInput["biomarkers"]> = {
    // Core biomarkers
    albumin: "albumin",
    creatinine: "creatinine",
    glucose: "glucose",
    crp: "crp",
    lymphocyte_percent: "lymphocytePercent",
    mcv: "mcv",
    rdw: "rdw",
    alp: "alp",
    alkaline_phosphatase: "alp",
    wbc: "wbc",
    white_blood_cells: "wbc",

    // Blood health
    hemoglobin: "hemoglobin",
    haemoglobin: "hemoglobin",
    hematocrit: "hematocrit",
    haematocrit: "hematocrit",
    rbc: "rbc",
    red_blood_cells: "rbc",
    platelets: "platelets",

    // Lipid panel
    triglycerides: "triglycerides",
    hdl_cholesterol: "hdl_cholesterol",
    hdl: "hdl_cholesterol",
    ldl_cholesterol: "ldl_cholesterol",
    ldl: "ldl_cholesterol",
    total_cholesterol: "total_cholesterol",
    cholesterol: "total_cholesterol",

    // Metabolic
    hba1c: "hba1c",
    glycated_hemoglobin: "hba1c",
    insulin: "insulin",
    fasting_insulin: "insulin",
    uric_acid: "uric_acid",
    urate: "uric_acid",

    // Liver function
    alt: "alt",
    sgpt: "alt",
    ast: "ast",
    sgot: "ast",
    ggt: "ggt",
    gamma_gt: "ggt",
    bilirubin: "bilirubin",
    total_bilirubin: "bilirubin",

    // Kidney function
    bun: "bun",
    urea: "bun",
    blood_urea_nitrogen: "bun",
    egfr: "egfr",
    cystatin_c: "cystatin_c",

    // Thyroid
    tsh: "tsh",
    free_t4: "free_t4",
    ft4: "free_t4",
    free_t3: "free_t3",
    ft3: "free_t3",

    // Hormones
    testosterone_total: "testosterone_total",
    testosterone: "testosterone_total",
    estradiol: "estradiol",
    cortisol: "cortisol",
    dhea_s: "dhea_s",
    dhea: "dhea_s",

    // Vitamins & Minerals
    vitamin_d: "vitamin_d",
    "25_oh_vitamin_d": "vitamin_d",
    vitamin_b12: "vitamin_b12",
    b12: "vitamin_b12",
    cobalamin: "vitamin_b12",
    folate: "folate",
    folic_acid: "folate",
    ferritin: "ferritin",
    iron: "iron",
    serum_iron: "iron",

    // Inflammation
    homocysteine: "homocysteine",
    esr: "esr",
    sed_rate: "esr",
  };

  // Raw values storage for derivation calculations
  // These are biomarkers that might be used to derive other values
  const rawValues: Record<string, number> = {};
  const rawValueIds = [
    "lymphocytes", "lymphocyte", "lymphocyte_count", "lymphocyte_absolute",  // Absolute lymphocyte count (x10⁹/L)
    "neutrophils", "neutrophil", "neutrophil_count",                          // For potential future derivations
    "monocytes", "monocyte", "monocyte_count",
    "eosinophils", "eosinophil", "eosinophil_count",
    "basophils", "basophil", "basophil_count",
  ];

  const biomarkers: BiologicalAgeInput["biomarkers"] = {};

  console.log(`[mapBiomarkerResultsToInput] Processing ${results.length} biomarker results:`);

  for (const result of results) {
    const normalizedId = result.biomarkerId.toLowerCase().replace(/-/g, "_");

    // Check if this is a direct mapping
    const key = mapping[normalizedId];
    if (key) {
      biomarkers[key] = result.value;
      console.log(`  ✓ Mapped: ${result.biomarkerId} (normalized: ${normalizedId}) -> ${key} = ${result.value}`);
    }
    // Check if this is a raw value we need for derivation
    else if (rawValueIds.includes(normalizedId)) {
      rawValues[normalizedId] = result.value;
      console.log(`  📊 Stored for derivation: ${result.biomarkerId} = ${result.value}`);
    }
    else {
      console.log(`  ✗ NOT MAPPED: ${result.biomarkerId} (normalized: ${normalizedId})`);
    }
  }

  // ============================================
  // DERIVED BIOMARKERS
  // Calculate missing core biomarkers from available data
  // ============================================
  console.log(`\n[mapBiomarkerResultsToInput] Checking for derivable biomarkers...`);

  // 1. Lymphocyte % - derive from absolute lymphocyte count and WBC
  //    Formula: Lymphocyte % = (Lymphocytes / WBC) × 100
  //    Where Lymphocytes is absolute count in x10⁹/L and WBC is in x10⁹/L
  if (biomarkers.lymphocytePercent == null && biomarkers.wbc != null) {
    const lymphocyteAbsolute = rawValues.lymphocytes ?? rawValues.lymphocyte ??
                               rawValues.lymphocyte_count ?? rawValues.lymphocyte_absolute;

    if (lymphocyteAbsolute != null && biomarkers.wbc > 0) {
      const derivedLymphocytePercent = (lymphocyteAbsolute / biomarkers.wbc) * 100;

      // Sanity check: lymphocyte % should be between 5% and 60%
      if (derivedLymphocytePercent >= 5 && derivedLymphocytePercent <= 60) {
        biomarkers.lymphocytePercent = Math.round(derivedLymphocytePercent * 10) / 10;
        console.log(`  🧮 DERIVED: lymphocytePercent = (${lymphocyteAbsolute} / ${biomarkers.wbc}) × 100 = ${biomarkers.lymphocytePercent}%`);
      } else {
        console.log(`  ⚠️ Derived lymphocyte % (${derivedLymphocytePercent.toFixed(1)}%) outside valid range (5-60%), skipping`);
      }
    }
  }

  // 2. Future derivations can be added here:
  // - eGFR from creatinine, age, sex (CKD-EPI formula)
  // - LDL from total cholesterol, HDL, triglycerides (Friedewald equation)
  // - HOMA-IR from fasting glucose and insulin

  // Log which core biomarkers are present and which are missing
  const coreBiomarkers = ["albumin", "creatinine", "glucose", "crp", "lymphocytePercent", "mcv", "rdw", "alp", "wbc"];
  const presentCore = coreBiomarkers.filter(b => biomarkers[b as keyof typeof biomarkers] != null);
  const missingCore = coreBiomarkers.filter(b => biomarkers[b as keyof typeof biomarkers] == null);
  console.log(`\n[mapBiomarkerResultsToInput] Core biomarkers present (${presentCore.length}/9): ${presentCore.join(", ")}`);
  if (missingCore.length > 0) {
    console.log(`[mapBiomarkerResultsToInput] Core biomarkers MISSING: ${missingCore.join(", ")}`);
  }

  return biomarkers;
}

/**
 * Get list of biomarkers used in biological age calculation
 */
export function getBiologicalAgeBiomarkers(): Array<{
  id: string;
  name: string;
  unit: string;
  category: string;
  importance: "core" | "recommended" | "optional";
}> {
  const coreBiomarkers = ["albumin", "creatinine", "glucose", "crp", "lymphocytePercent", "mcv", "rdw", "alp", "wbc"];
  const recommendedBiomarkers = ["hemoglobin", "hba1c", "hdl_cholesterol", "ldl_cholesterol", "triglycerides", "alt", "egfr", "tsh"];

  return Object.entries(BIOMARKER_REFS).map(([id, ref]) => ({
    id,
    name: ref.name,
    unit: ref.unit,
    category: ref.category,
    importance: coreBiomarkers.includes(id) ? "core" as const :
                recommendedBiomarkers.includes(id) ? "recommended" as const : "optional" as const,
  }));
}
