/**
 * Derive calculated biomarkers from measured lab values (Australian SI units).
 * Used at upload time and when persisting missing derived results for a member.
 */

import { tryCalculatePhenotypicAgeYears } from "@/lib/biological-age";

export const DERIVED_BIOMARKER_IDS = [
  "lymphocyte_percent",
  "neutrophil_percent",
  "monocyte_percent",
  "eosinophil_percent",
  "basophil_percent",
  "ldl_cholesterol",
  "non_hdl_cholesterol",
  "homa_ir",
  "tc_hdl_ratio",
  "ldl_hdl_ratio",
  "tg_hdl_ratio",
  "atherogenic_index_plasma",
  "vldl_cholesterol",
  "globulin",
  "transferrin_saturation",
  "egfr",
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
  "remnant_cholesterol",
  "atherogenic_coefficient",
  "homa_b",
  "quicki",
  "mcauley_index",
  "uric_acid_hdl_ratio",
  "fib4",
  "apri",
  "sii",
  "siri",
  "mlr",
  "nhr",
  "corrected_calcium",
  "calculated_osmolality",
  "mentzer_index",
  "kdigo_risk",
  "tsh_index",
  "phenotypic_age",
  "age_acceleration",
] as const;

export type DerivedBiomarkerId = (typeof DERIVED_BIOMARKER_IDS)[number];

export interface BiomarkerValueInput {
  biomarkerId: string;
  value: number;
}

export interface DerivedBiomarkerOutput {
  biomarkerId: DerivedBiomarkerId;
  value: number;
  notes: string;
}

export interface DeriveBiomarkerContext {
  gender?: "male" | "female" | "MALE" | "FEMALE" | "OTHER" | null;
  ageYears?: number | null;
}

export function normalizeDeriveGender(
  gender?: string | null
): DeriveBiomarkerContext["gender"] {
  if (!gender) return undefined;
  const upper = gender.toUpperCase();
  if (upper === "MALE" || upper === "FEMALE" || upper === "OTHER") {
    return upper as DeriveBiomarkerContext["gender"];
  }
  if (upper === "PREFER_NOT_TO_SAY") return "OTHER";
  const lower = gender.toLowerCase();
  if (lower === "male" || lower === "female" || lower === "other") {
    return lower as DeriveBiomarkerContext["gender"];
  }
  return undefined;
}

function genderIsFemale(gender?: DeriveBiomarkerContext["gender"]): boolean {
  return gender?.toString().toLowerCase() === "female";
}

function getValue(map: Map<string, number>, id: string): number | undefined {
  const value = map.get(id);
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function resolveGlobulin(
  map: Map<string, number>,
  totalProtein?: number,
  albumin?: number
): number | undefined {
  const stored = getValue(map, "globulin");
  if (stored !== undefined) return stored;
  if (totalProtein !== undefined && albumin !== undefined) {
    const calculated = totalProtein - albumin;
    if (calculated > 0 && calculated < 60) return calculated;
  }
  return undefined;
}

/** CKD-EPI 2009 creatinine equation (Scr in µmol/L). */
export function calculateEgfrFromCreatinine(
  creatinineUmol: number,
  ageYears: number,
  gender?: DeriveBiomarkerContext["gender"]
): number | null {
  if (creatinineUmol <= 0 || ageYears <= 0) return null;

  const scrMgDl = creatinineUmol / 88.4;
  const female = genderIsFemale(gender);
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.329 : -0.411;
  const ratio = scrMgDl / kappa;
  const minRatio = Math.min(ratio, 1);
  const maxRatio = Math.max(ratio, 1);

  let egfr =
    141 *
    Math.pow(minRatio, alpha) *
    Math.pow(maxRatio, -1.209) *
    Math.pow(0.993, ageYears);

  if (female) egfr *= 1.018;

  const rounded = Math.round(egfr);
  if (rounded <= 0 || rounded > 200) return null;
  return rounded;
}

export function ageFromDateOfBirth(dateOfBirth?: Date | string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
}

/**
 * Derive all calculable biomarkers for one test episode (same collection date).
 * Skips markers already present in `existingIds`.
 */
export function deriveBiomarkersForEpisode(
  values: BiomarkerValueInput[],
  context: DeriveBiomarkerContext,
  existingIds: Set<string> = new Set()
): DerivedBiomarkerOutput[] {
  const map = new Map<string, number>();
  for (const item of values) {
    if (Number.isFinite(item.value)) {
      map.set(item.biomarkerId, item.value);
    }
  }

  const derived: DerivedBiomarkerOutput[] = [];
  const push = (biomarkerId: DerivedBiomarkerId, value: number, notes: string) => {
    if (existingIds.has(biomarkerId)) return;
    derived.push({ biomarkerId, value, notes });
  };

  const wbc = getValue(map, "wbc");
  if (wbc && wbc > 0) {
    const differential: Array<[DerivedBiomarkerId, string, string]> = [
      ["lymphocyte_percent", "lymphocytes", "Lymphocytes"],
      ["neutrophil_percent", "neutrophils", "Neutrophils"],
      ["monocyte_percent", "monocytes", "Monocytes"],
      ["eosinophil_percent", "eosinophils", "Eosinophils"],
      ["basophil_percent", "basophils", "Basophils"],
    ];

    for (const [percentId, absoluteId, label] of differential) {
      const absolute = getValue(map, absoluteId);
      if (absolute === undefined) continue;
      const percent = Math.round(clampPercent((absolute / wbc) * 100) * 10) / 10;
      push(percentId, percent, `Calculated from ${label} and WBC`);
    }
  }

  const totalCholesterol = getValue(map, "total_cholesterol");
  const hdl = getValue(map, "hdl_cholesterol");
  const triglycerides = getValue(map, "triglycerides");
  let ldl = getValue(map, "ldl_cholesterol");

  if (totalCholesterol !== undefined && hdl !== undefined && triglycerides !== undefined && ldl === undefined) {
    if (triglycerides < 4.5) {
      const calculatedLdl =
        Math.round((totalCholesterol - hdl - triglycerides / 2.2) * 100) / 100;
      if (calculatedLdl > 0 && calculatedLdl < 10) {
        push("ldl_cholesterol", calculatedLdl, "Calculated using Friedewald equation");
        ldl = calculatedLdl;
      }
    }
  }

  if (totalCholesterol !== undefined && hdl !== undefined) {
    const nonHdl = Math.round((totalCholesterol - hdl) * 100) / 100;
    if (nonHdl > 0 && nonHdl < 10) {
      push("non_hdl_cholesterol", nonHdl, "Calculated from total cholesterol minus HDL");
    }
  }

  const glucose = getValue(map, "glucose");
  const insulin = getValue(map, "insulin");
  if (glucose !== undefined && insulin !== undefined) {
    const homa = Math.round(((insulin * glucose) / 22.5) * 100) / 100;
    if (homa > 0 && homa < 20) {
      push("homa_ir", homa, "Calculated from fasting insulin and glucose");
    }
  }

  if (totalCholesterol !== undefined && hdl !== undefined && hdl > 0) {
    const ratio = Math.round((totalCholesterol / hdl) * 10) / 10;
    if (ratio > 0 && ratio < 15) {
      push("tc_hdl_ratio", ratio, "Calculated from total cholesterol and HDL");
    }
  }

  if (ldl !== undefined && hdl !== undefined && hdl > 0) {
    const ratio = Math.round((ldl / hdl) * 10) / 10;
    if (ratio > 0 && ratio < 10) {
      push("ldl_hdl_ratio", ratio, "Calculated from LDL and HDL");
    }
  }

  if (triglycerides !== undefined && hdl !== undefined && hdl > 0) {
    const ratio = Math.round((triglycerides / hdl) * 10) / 10;
    if (ratio > 0 && ratio < 15) {
      push("tg_hdl_ratio", ratio, "Calculated from triglycerides and HDL");
    }

    const aip = Math.round(Math.log10(triglycerides / hdl) * 100) / 100;
    if (Number.isFinite(aip) && aip > -1 && aip < 1) {
      push(
        "atherogenic_index_plasma",
        aip,
        "Calculated as log10(triglycerides / HDL) in mmol/L"
      );
    }
  }

  if (triglycerides !== undefined && triglycerides > 0 && triglycerides < 4.5) {
    const vldl = Math.round((triglycerides / 2.2) * 100) / 100;
    if (vldl > 0 && vldl < 5) {
      push("vldl_cholesterol", vldl, "Calculated from triglycerides (mmol/L ÷ 2.2)");
    }
  }

  const totalProtein = getValue(map, "total_protein");
  const albumin = getValue(map, "albumin");
  if (totalProtein !== undefined && albumin !== undefined) {
    const globulin = Math.round((totalProtein - albumin) * 10) / 10;
    if (globulin > 0 && globulin < 60) {
      push("globulin", globulin, "Calculated from total protein minus albumin");
    }
  }

  const iron = getValue(map, "iron");
  const tibc = getValue(map, "tibc");
  if (iron !== undefined && tibc !== undefined && tibc > 0) {
    const tsat = Math.round((iron / tibc) * 1000) / 10;
    if (tsat >= 0 && tsat <= 100) {
      push("transferrin_saturation", tsat, "Calculated from iron and TIBC");
    }
  }

  const creatinine = getValue(map, "creatinine");
  const ageYears = context.ageYears ?? null;
  let resolvedEgfr = getValue(map, "egfr");
  if (creatinine !== undefined && ageYears) {
    const egfr = calculateEgfrFromCreatinine(creatinine, ageYears, context.gender);
    if (egfr !== null) {
      push("egfr", egfr, "Calculated from creatinine, age and sex (CKD-EPI)");
      if (resolvedEgfr === undefined) resolvedEgfr = egfr;
    }
  }

  const globulin = resolveGlobulin(map, totalProtein, albumin);
  if (albumin !== undefined && globulin !== undefined && globulin > 0) {
    const agRatio = Math.round((albumin / globulin) * 100) / 100;
    if (agRatio > 0 && agRatio < 5) {
      push("albumin_globulin_ratio", agRatio, "Calculated from albumin and globulin");
    }
  }

  const ast = getValue(map, "ast");
  const alt = getValue(map, "alt");
  if (ast !== undefined && alt !== undefined && alt > 0) {
    const deRitis = Math.round((ast / alt) * 100) / 100;
    if (deRitis > 0 && deRitis < 10) {
      push("ast_alt_ratio", deRitis, "Calculated from AST and ALT (De Ritis ratio)");
    }
  }

  const bilirubinTotal = getValue(map, "bilirubin_total");
  const bilirubinDirect = getValue(map, "bilirubin_direct");
  if (bilirubinTotal !== undefined && bilirubinDirect !== undefined) {
    const indirect = Math.round((bilirubinTotal - bilirubinDirect) * 10) / 10;
    if (indirect >= 0 && indirect < 50) {
      push("indirect_bilirubin", indirect, "Calculated from total minus direct bilirubin");
    }
  }

  if (bilirubinTotal !== undefined && albumin !== undefined && albumin > 0) {
    const bar = Math.round((bilirubinTotal / albumin) * 100) / 100;
    if (bar >= 0 && bar < 5) {
      push("bilirubin_albumin_ratio", bar, "Calculated from total bilirubin and albumin");
    }
  }

  const hba1c = getValue(map, "hba1c");
  if (hba1c !== undefined && hba1c > 0 && hba1c < 20) {
    const eag = Math.round((1.59 * hba1c - 2.59) * 10) / 10;
    if (eag > 2 && eag < 25) {
      push(
        "estimated_average_glucose",
        eag,
        "Calculated from HbA1c (%) using ADAG formula (mmol/L)"
      );
    }
  }

  if (triglycerides !== undefined && glucose !== undefined && triglycerides > 0 && glucose > 0) {
    // Standard TyG uses mg/dL; convert from Australian mmol/L
    const tgMgDl = triglycerides * 88.57;
    const glucoseMgDl = glucose * 18.018;
    const tyg = Math.round(Math.log((tgMgDl * glucoseMgDl) / 2) * 100) / 100;
    if (Number.isFinite(tyg) && tyg > 6 && tyg < 12) {
      push(
        "tyg_index",
        tyg,
        "Calculated as ln(triglycerides × glucose / 2) with mmol/L converted to mg/dL"
      );
    }
  }

  const urea = getValue(map, "bun");
  if (urea !== undefined && creatinine !== undefined && creatinine > 0) {
    const creatinineMmol = creatinine / 1000;
    const ureaCrRatio = Math.round((urea / creatinineMmol) * 10) / 10;
    if (ureaCrRatio > 10 && ureaCrRatio < 200) {
      push(
        "urea_creatinine_ratio",
        ureaCrRatio,
        "Calculated from urea (mmol/L) and creatinine (µmol/L)"
      );
    }
  }

  const sodium = getValue(map, "sodium");
  const chloride = getValue(map, "chloride");
  const bicarbonate = getValue(map, "bicarbonate");
  if (sodium !== undefined && chloride !== undefined && bicarbonate !== undefined) {
    const anionGap = Math.round((sodium - (chloride + bicarbonate)) * 10) / 10;
    if (anionGap > 0 && anionGap < 30) {
      push("anion_gap", anionGap, "Calculated from sodium, chloride and bicarbonate");
    }
  }

  const freeT3 = getValue(map, "free_t3");
  const freeT4 = getValue(map, "free_t4");
  if (freeT3 !== undefined && freeT4 !== undefined && freeT4 > 0) {
    const t3t4 = Math.round((freeT3 / freeT4) * 1000) / 1000;
    if (t3t4 > 0.1 && t3t4 < 1) {
      push("free_t3_t4_ratio", t3t4, "Calculated from free T3 and free T4");
    }
  }

  const testosteroneTotal = getValue(map, "testosterone_total");
  const shbg = getValue(map, "shbg");
  if (testosteroneTotal !== undefined && shbg !== undefined && shbg > 0) {
    const fai = Math.round(((100 * testosteroneTotal) / shbg) * 10) / 10;
    if (fai > 0 && fai < 300) {
      push(
        "free_androgen_index",
        fai,
        "Calculated from total testosterone and SHBG"
      );
    }
  }

  const crp = getValue(map, "crp");
  if (crp !== undefined && albumin !== undefined && albumin > 0) {
    const car = Math.round((crp / albumin) * 1000) / 1000;
    if (car >= 0 && car < 2) {
      push("crp_albumin_ratio", car, "Calculated from hs-CRP and albumin");
    }
  }

  const ferritin = getValue(map, "ferritin");
  if (ferritin !== undefined && albumin !== undefined && albumin > 0) {
    const far = Math.round((ferritin / albumin) * 10) / 10;
    if (far >= 0 && far < 500) {
      push("ferritin_albumin_ratio", far, "Calculated from ferritin and albumin");
    }
  }

  const neutrophils = getValue(map, "neutrophils");
  const lymphocytes = getValue(map, "lymphocytes");
  if (neutrophils !== undefined && lymphocytes !== undefined && lymphocytes > 0) {
    const nlr = Math.round((neutrophils / lymphocytes) * 100) / 100;
    if (nlr > 0 && nlr < 20) {
      push("nlr", nlr, "Calculated from neutrophils and lymphocytes");
    }
  }

  const platelets = getValue(map, "platelets");
  if (platelets !== undefined && lymphocytes !== undefined && lymphocytes > 0) {
    const plr = Math.round((platelets / lymphocytes) * 10) / 10;
    if (plr > 0 && plr < 500) {
      push(
        "platelet_lymphocyte_ratio",
        plr,
        "Calculated from platelets and lymphocytes"
      );
    }
  }

  if (
    totalCholesterol !== undefined &&
    hdl !== undefined &&
    ldl !== undefined
  ) {
    const remnant = Math.round((totalCholesterol - hdl - ldl) * 100) / 100;
    if (remnant > -0.5 && remnant < 5) {
      push(
        "remnant_cholesterol",
        remnant,
        "Calculated as total cholesterol − HDL − LDL"
      );
    }
  }

  if (totalCholesterol !== undefined && hdl !== undefined && hdl > 0) {
    const ac = Math.round(((totalCholesterol - hdl) / hdl) * 100) / 100;
    if (ac > 0 && ac < 15) {
      push(
        "atherogenic_coefficient",
        ac,
        "Calculated as (total cholesterol − HDL) / HDL"
      );
    }
  }

  if (glucose !== undefined && insulin !== undefined && glucose > 3.5) {
    const homaB = Math.round(((20 * insulin) / (glucose - 3.5)) * 10) / 10;
    if (homaB > 0 && homaB < 500) {
      push("homa_b", homaB, "HOMA-B from fasting insulin and glucose (mmol/L)");
    }
  }

  if (glucose !== undefined && insulin !== undefined && glucose > 0 && insulin > 0) {
    const glucoseMgDl = glucose * 18.018;
    const quicki =
      Math.round((1 / (Math.log10(insulin) + Math.log10(glucoseMgDl))) * 1000) / 1000;
    if (Number.isFinite(quicki) && quicki > 0.2 && quicki < 0.5) {
      push("quicki", quicki, "QUICKI from fasting insulin and glucose");
    }
  }

  if (insulin !== undefined && triglycerides !== undefined && insulin > 0 && triglycerides > 0) {
    const mcauley =
      Math.round(
        Math.exp(2.63 - 0.28 * Math.log(insulin) - 0.31 * Math.log(triglycerides)) * 100
      ) / 100;
    if (Number.isFinite(mcauley) && mcauley > 1 && mcauley < 20) {
      push(
        "mcauley_index",
        mcauley,
        "McAuley index from fasting insulin and triglycerides. Higher is more insulin-sensitive."
      );
    }
  }

  const uricAcid = getValue(map, "uric_acid");
  if (uricAcid !== undefined && hdl !== undefined && hdl > 0) {
    const uaHdl = Math.round((uricAcid / hdl) * 1000) / 1000;
    if (uaHdl > 0 && uaHdl < 2) {
      push("uric_acid_hdl_ratio", uaHdl, "Uric acid / HDL (both mmol/L)");
    }
  }

  const ageYearsForScores = context.ageYears ?? null;
  if (
    ageYearsForScores &&
    ast !== undefined &&
    alt !== undefined &&
    platelets !== undefined &&
    alt > 0 &&
    platelets > 0
  ) {
    const fib4 =
      Math.round(((ageYearsForScores * ast) / (platelets * Math.sqrt(alt))) * 100) / 100;
    if (Number.isFinite(fib4) && fib4 > 0 && fib4 < 20) {
      push("fib4", fib4, "FIB-4 from age, AST, ALT and platelets");
    }
  }

  if (ast !== undefined && platelets !== undefined && platelets > 0) {
    const astUln = 40;
    const apri = Math.round(((ast / astUln / platelets) * 100) * 100) / 100;
    if (Number.isFinite(apri) && apri > 0 && apri < 20) {
      push("apri", apri, "APRI from AST (ULN 40 U/L) and platelets");
    }
  }

  const monocytes = getValue(map, "monocytes");
  if (
    neutrophils !== undefined &&
    lymphocytes !== undefined &&
    platelets !== undefined &&
    lymphocytes > 0
  ) {
    const sii = Math.round((neutrophils * platelets) / lymphocytes);
    if (sii > 0 && sii < 10000) {
      push("sii", sii, "SII = (neutrophils × platelets) / lymphocytes");
    }
  }

  if (
    neutrophils !== undefined &&
    monocytes !== undefined &&
    lymphocytes !== undefined &&
    lymphocytes > 0
  ) {
    const siri = Math.round(((neutrophils * monocytes) / lymphocytes) * 100) / 100;
    if (siri > 0 && siri < 50) {
      push("siri", siri, "SIRI = (neutrophils × monocytes) / lymphocytes");
    }
  }

  if (monocytes !== undefined && lymphocytes !== undefined && lymphocytes > 0) {
    const mlr = Math.round((monocytes / lymphocytes) * 100) / 100;
    if (mlr >= 0 && mlr < 5) {
      push("mlr", mlr, "Monocyte / lymphocyte ratio");
    }
  }

  if (neutrophils !== undefined && hdl !== undefined && hdl > 0) {
    const nhr = Math.round((neutrophils / hdl) * 100) / 100;
    if (nhr > 0 && nhr < 50) {
      push("nhr", nhr, "Neutrophil / HDL ratio (HDL in mmol/L)");
    }
  }

  const calcium = getValue(map, "calcium");
  if (calcium !== undefined && albumin !== undefined) {
    const corrected = Math.round((calcium + 0.02 * (40 - albumin)) * 100) / 100;
    if (corrected > 1.5 && corrected < 3.5) {
      push(
        "corrected_calcium",
        corrected,
        "Payne correction: calcium + 0.02 × (40 − albumin)"
      );
    }
  }

  if (sodium !== undefined && glucose !== undefined && urea !== undefined) {
    const osm = Math.round((2 * sodium + glucose + urea) * 10) / 10;
    if (osm > 240 && osm < 360) {
      push(
        "calculated_osmolality",
        osm,
        "Calculated osmolality = 2×Na + glucose + urea (mmol/L)"
      );
    }
  }

  const mcv = getValue(map, "mcv");
  const rbc = getValue(map, "rbc");
  if (mcv !== undefined && rbc !== undefined && rbc > 0) {
    const mentzer = Math.round((mcv / rbc) * 10) / 10;
    if (mentzer > 5 && mentzer < 40) {
      push("mentzer_index", mentzer, "MCV / RBC. <13 suggests thalassaemia trait pattern");
    }
  }

  const uacr = getValue(map, "uacr");
  if (uacr !== undefined && resolvedEgfr !== undefined) {
    const kdigo = kdigoRiskScore(resolvedEgfr, uacr);
    if (kdigo !== null) {
      push(
        "kdigo_risk",
        kdigo,
        "KDIGO heat-map risk: 1 low, 2 moderate, 3 high, 4 very high"
      );
    }
  }

  const tsh = getValue(map, "tsh");
  if (tsh !== undefined && freeT4 !== undefined && tsh > 0 && freeT4 > 0) {
    const tshi = Math.round((Math.log(tsh) + 0.1345 * freeT4) * 100) / 100;
    if (Number.isFinite(tshi) && tshi > -2 && tshi < 8) {
      push("tsh_index", tshi, "Jostel TSH index from TSH and free T4");
    }
  }

  if (ageYearsForScores && crp !== undefined) {
    const lymphPct =
      getValue(map, "lymphocyte_percent") ??
      (wbc && lymphocytes !== undefined && wbc > 0
        ? clampPercent((lymphocytes / wbc) * 100)
        : undefined);
    const rdw = getValue(map, "rdw");
    const alp = getValue(map, "alp");
    const pheno = tryCalculatePhenotypicAgeYears(ageYearsForScores, {
      albumin,
      creatinine,
      glucose,
      crp,
      lymphocytePercent: lymphPct,
      mcv,
      rdw,
      alp,
      wbc,
    });
    if (pheno !== null) {
      push("phenotypic_age", pheno, "Levine PhenoAge from 9 core blood markers plus age");
      const accel = Math.round((pheno - ageYearsForScores) * 10) / 10;
      if (accel > -25 && accel < 25) {
        push(
          "age_acceleration",
          accel,
          "PhenoAge minus chronological age. Negative means biologically younger."
        );
      }
    }
  }

  return derived;
}

function kdigoRiskScore(egfr: number, uacrMgMmol: number): number | null {
  if (egfr <= 0 || uacrMgMmol < 0) return null;
  const a = uacrMgMmol < 3 ? 1 : uacrMgMmol <= 30 ? 2 : 3;
  let g = 6;
  if (egfr >= 90) g = 1;
  else if (egfr >= 60) g = 2;
  else if (egfr >= 45) g = 3;
  else if (egfr >= 30) g = 4;
  else if (egfr >= 15) g = 5;
  const table: Record<number, [number, number, number]> = {
    1: [1, 2, 3],
    2: [1, 2, 3],
    3: [2, 3, 4],
    4: [3, 3, 4],
    5: [3, 4, 4],
    6: [4, 4, 4],
  };
  return table[g]?.[a - 1] ?? null;
}

/** Client/server helper: enrich a latest-value map with derived biomarkers (display only). */
export function applyDerivedBiomarkersToMap<T extends { biomarkerId: string; value: number }>(
  latestById: Record<string, T>,
  context: DeriveBiomarkerContext
): Record<string, T & { notes?: string }> {
  const values = Object.values(latestById).map(v => ({
    biomarkerId: v.biomarkerId,
    value: v.value,
  }));
  const existingIds = new Set(Object.keys(latestById));
  const derived = deriveBiomarkersForEpisode(values, context, existingIds);

  const enriched: Record<string, T & { notes?: string }> = { ...latestById };
  const anchor = Object.values(latestById)[0];

  for (const item of derived) {
    enriched[item.biomarkerId] = {
      ...(anchor as T),
      biomarkerId: item.biomarkerId,
      value: item.value,
      notes: item.notes,
    };
  }

  return enriched;
}
