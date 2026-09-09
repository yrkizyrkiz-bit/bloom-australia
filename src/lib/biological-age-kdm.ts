/**
 * Klemera–Doubal Method (KDM) biological age from blood chemistry.
 *
 * Used as the primary biological-age number for members aged ≤30 (backend only;
 * same API/UI contract as Levine PhenoAge path).
 *
 * Trained on NHANES III (BioAge package data), sex-specific, ages 30–75,
 * non-pregnant adults. Blood-only marker set (no SBP / FEV1) so it can run
 * from Sanative pathology panels.
 *
 * Reference: Klemera & Doubal (2006); Kwon & Belsky BioAge toolkit.
 */

/** Members at or below this chronological age use KDM for biologicalAge. */
export const YOUNG_ADULT_KDM_MAX_AGE = 30;

export type KdmSex = "female" | "male";

export type KdmAuInput = {
  chronologicalAge: number;
  sex: KdmSex;
  /** Total cholesterol, mmol/L */
  totalCholesterol: number;
  /** HbA1c, NGSP % */
  hba1c: number;
  /** Albumin, g/L */
  albumin: number;
  /** Creatinine, µmol/L */
  creatinine: number;
  /** hs-CRP, mg/L */
  crp: number;
  /** Alkaline phosphatase, U/L */
  alp: number;
  /** Blood urea nitrogen / urea, mmol/L (AU) */
  bun: number;
};

export type KdmResult = {
  biologicalAge: number;
  chronologicalAge: number;
  ageAcceleration: number;
  biomarkersUsed: number;
  method: "kdm_blood_nhanes3";
  notes: string[];
};

type LmRow = { bm: string; q: number; k: number; s: number; r: number; n2: number };

type SexFit = {
  s_ba2: number;
  lm_age: LmRow[];
};

/** NHANES III sex-specific fits for: totchol, hba1c, albumin, creat, lncrp, alp, bun */
const KDM_FITS: Record<KdmSex, SexFit> = {
  female: {
    s_ba2: 210.4798609244489,
    lm_age: [
      { bm: "totchol", q: 146.34952433877507, k: 1.3147915158570156, s: 41.23107254425241, r: 0.1596301359265695, n2: 0.0010168678613906624 },
      { bm: "hba1c", q: 4.449792928334947, k: 0.022953616902608585, s: 1.0118626503116004, r: 0.08777710169650199, n2: 0.0005145873747414273 },
      { bm: "albumin", q: 4.157074783337938, k: -0.002187196803035441, s: 0.34276922013916866, r: 0.007527412985648851, n2: 4.071665499299997e-5 },
      { bm: "creat", q: 0.5844741806686873, k: 0.0032543828523632717, s: 0.16523228777978477, r: 0.06736920367109356, n2: 0.0003879247185175517 },
      { bm: "lncrp", q: 0.30328932692716326, k: 0.0011775995601857742, s: 0.27998582370065966, r: 0.003284956261049965, n2: 1.768981065284773e-5 },
      { bm: "alp", q: 54.95837586679219, k: 0.629927313420123, s: 27.885066405307082, r: 0.08681897330722299, n2: 0.0005103140354160337 },
      { bm: "bun", q: 6.193569618960992, k: 0.14484356956869238, s: 4.2351366409279185, r: 0.1786476235589356, n2: 0.0011696706289900198 },
    ],
  },
  male: {
    s_ba2: 392.33515299484003,
    lm_age: [
      { bm: "totchol", q: 190.32578886088015, k: 0.38494211703773845, s: 40.855239843758675, r: 0.016506483887551937, n2: 8.87759507470906e-5 },
      { bm: "hba1c", q: 4.731511105861744, k: 0.017329422922901648, s: 0.9211202032442296, r: 0.06293101253204048, n2: 0.0003539448402645049 },
      { bm: "albumin", q: 4.577019066155238, k: -0.007252059792304574, s: 0.34325534219879544, r: 0.07770399518182736, n2: 0.00044636295314101447 },
      { bm: "creat", q: 0.7886081632934154, k: 0.0033725936081036127, s: 0.20548971263234278, r: 0.04837371721721295, n2: 0.0002693691498108618 },
      { bm: "lncrp", q: 0.15497513195063414, k: 0.00278167930826365, s: 0.21909775021995226, r: 0.029511307252888752, n2: 0.0001611900699746498 },
      { bm: "alp", q: 76.03706100516024, k: 0.2228907027080839, s: 25.49458647204045, r: 0.014212484077906429, n2: 7.643424196524875e-5 },
      { bm: "bun", q: 10.107635605090598, k: 0.10113295950921466, s: 4.827920343371405, r: 0.0763786608173348, n2: 0.0004387986076704971 },
    ],
  },
};

/** Convert Sanative AU inputs → NHANES units used in the fit. */
export function toNhanesKdmMarkers(input: Omit<KdmAuInput, "chronologicalAge" | "sex">): Record<string, number> {
  const crpMgdL = Math.max(input.crp / 10, 0.01);
  return {
    totchol: input.totalCholesterol * 38.67, // mmol/L → mg/dL
    hba1c: input.hba1c, // %
    albumin: input.albumin / 10, // g/L → g/dL
    creat: input.creatinine / 88.4, // µmol/L → mg/dL
    lncrp: Math.log(crpMgdL + 1), // BioAge NHANES3 uses ln(crp_mg/dL + 1)
    alp: input.alp, // U/L
    bun: input.bun * 2.801, // mmol/L → mg/dL
  };
}

export type KdmBiomarkerSource = {
  total_cholesterol?: number;
  hba1c?: number;
  albumin?: number;
  creatinine?: number;
  crp?: number;
  alp?: number;
  bun?: number;
};

/** True when all 7 blood-only KDM inputs are present. */
export function hasKdmBloodMarkers(biomarkers: KdmBiomarkerSource): boolean {
  return (
    biomarkers.total_cholesterol != null &&
    biomarkers.hba1c != null &&
    biomarkers.albumin != null &&
    biomarkers.creatinine != null &&
    biomarkers.crp != null &&
    biomarkers.alp != null &&
    biomarkers.bun != null
  );
}

export function buildKdmInputFromBiomarkers(
  chronologicalAge: number,
  sex: KdmSex,
  biomarkers: KdmBiomarkerSource
): KdmAuInput | null {
  if (!hasKdmBloodMarkers(biomarkers)) return null;
  return {
    chronologicalAge,
    sex,
    totalCholesterol: biomarkers.total_cholesterol!,
    hba1c: biomarkers.hba1c!,
    albumin: biomarkers.albumin!,
    creatinine: biomarkers.creatinine!,
    crp: biomarkers.crp!,
    alp: biomarkers.alp!,
    bun: biomarkers.bun!,
  };
}

/**
 * Project KDM biological age (BioAge `kdm_calc` formula with baked NHANES III fits).
 */
export function calculateKdmBiologicalAge(input: KdmAuInput): KdmResult {
  const fit = KDM_FITS[input.sex];
  const markers = toNhanesKdmMarkers(input);
  const notes: string[] = [
    "Prototype KDM blood-only (7 markers). Trained NHANES III ages 30–75; under-30 is extrapolation.",
    "Does not include SBP or FEV1 from the classic 9-marker KDM set.",
  ];

  let baeN = 0;
  let used = 0;
  for (const row of fit.lm_age) {
    const value = markers[row.bm];
    if (value == null || !Number.isFinite(value)) continue;
    baeN += (value - row.q) * (row.k / row.s ** 2);
    used += 1;
  }

  const baeD = fit.lm_age.reduce((sum, row) => sum + row.n2, 0);
  const age = input.chronologicalAge;
  const kdm = (baeN + age / fit.s_ba2) / (baeD + 1 / fit.s_ba2);
  const biologicalAge = Math.round(kdm * 10) / 10;

  if (age < 30) {
    notes.push("Member is under 30; KDM training started at age 30.");
  }

  return {
    biologicalAge,
    chronologicalAge: age,
    ageAcceleration: Math.round((biologicalAge - age) * 10) / 10,
    biomarkersUsed: used,
    method: "kdm_blood_nhanes3",
    notes,
  };
}
