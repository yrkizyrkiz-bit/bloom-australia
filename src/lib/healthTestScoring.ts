import { getBiomarkerById, getStatusForValue } from "@/data/biomarkers";

// Health Test Categories Configuration
export const healthTestsConfig = [
  {
    id: "liver",
    name: "Liver Function",
    color: "#84cc16",
    bgColor: "bg-lime-500/10",
    href: "/dashboard/liver-test",
    biomarkerIds: ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin", "platelets"],
    useScientificScoring: true
  },
  {
    id: "kidney",
    name: "Kidney Function",
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    href: "/dashboard/kidney-test",
    biomarkerIds: ["creatinine", "egfr", "bun", "cystatin_c", "uacr", "potassium", "sodium", "calcium", "phosphorus", "bicarbonate", "pth"],
    useScientificScoring: true // KDIGO methodology
  },
  {
    id: "heart",
    name: "Heart Health",
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    href: "/dashboard/heart-test",
    biomarkerIds: ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "crp", "homocysteine", "glucose", "hba1c"],
    useScientificScoring: true // Cardiovascular risk scoring
  },
  {
    id: "thyroid",
    name: "Thyroid Function",
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    href: "/dashboard/thyroid-test",
    biomarkerIds: ["tsh", "free_t4", "free_t3"],
    useScientificScoring: true // TSH/T4 clinical guidelines
  },
  {
    id: "hormones",
    name: "Hormone Health",
    color: "#a855f7",
    bgColor: "bg-purple-500/10",
    href: "/dashboard/hormone-test",
    biomarkerIds: ["testosterone_total", "estradiol", "progesterone", "cortisol", "dhea_s", "fsh", "lh", "shbg", "free_testosterone"],
    useScientificScoring: true // Endocrine Society guidelines, sex-specific panels
  },
  {
    id: "metabolic",
    name: "Metabolic Panel",
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    href: "/dashboard/metabolic-panel",
    biomarkerIds: ["glucose", "hba1c", "insulin", "creatinine", "egfr", "bun", "sodium", "potassium", "calcium", "bicarbonate"],
    useScientificScoring: true // HOMA-IR and metabolic syndrome criteria
  }
] as const;

export type HealthTestId = typeof healthTestsConfig[number]["id"];

export interface BiomarkerResultInput {
  id: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: string;
}

export interface HealthTestScore {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  href: string;
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  trend: "improving" | "stable" | "declining";
  hasData: boolean;
  lastTested: string | null;
  biomarkerIds: readonly string[];
}

export interface OverallHealthScore {
  overall: number;
  categories: HealthTestScore[];
  totalOptimal: number;
  totalNormal: number;
  totalOutOfRange: number;
  totalBiomarkers: number;
  lastUpdated: string;
}

// Helper function to count biomarker status using consistent criteria
function countBiomarkerStatuses(
  biomarkerIds: readonly string[],
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): { optimal: number; normal: number; outOfRange: number; hasData: boolean } {
  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;

  for (const biomarkerId of biomarkerIds) {
    const result = biomarkerResults.find(r => r.biomarkerId === biomarkerId);
    const biomarker = getBiomarkerById(biomarkerId);

    if (result && biomarker) {
      // Use the stored status if available, otherwise calculate from value
      let status = result.status?.toLowerCase();
      if (!status || status === "") {
        status = getStatusForValue(biomarker, result.value, gender);
      }

      if (status === "optimal") {
        optimal++;
      } else if (status === "normal") {
        normal++;
      } else {
        // out_of_range, critical, or any other status
        outOfRange++;
      }
    }
  }

  return { optimal, normal, outOfRange, hasData: optimal + normal + outOfRange > 0 };
}

// ==================== LIVER RISK SCORE ====================
function calculateLiverRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  // ALT - Primary marker of hepatocellular injury (Weight: 20%)
  const altValue = getBiomarkerValue("alt");
  const altNormal = gender === "male" ? 45 : 34;
  if (altValue !== null) {
    let altScore: number;
    if (altValue <= altNormal * 0.5) {
      altScore = 100;
    } else if (altValue <= altNormal) {
      altScore = 80;
    } else if (altValue <= altNormal * 3) {
      altScore = 50;
    } else {
      altScore = 20;
    }
    totalWeight += 20;
    totalScore += altScore * 0.2;
  }

  // AST - Hepatocellular injury (Weight: 15%)
  const astValue = getBiomarkerValue("ast");
  const astNormal = gender === "male" ? 40 : 32;
  if (astValue !== null) {
    let astScore: number;
    if (astValue <= astNormal * 0.5) {
      astScore = 100;
    } else if (astValue <= astNormal) {
      astScore = 80;
    } else if (astValue <= astNormal * 3) {
      astScore = 50;
    } else {
      astScore = 20;
    }
    totalWeight += 15;
    totalScore += astScore * 0.15;
  }

  // GGT - Cholestasis, alcohol, medications (Weight: 15%)
  const ggtValue = getBiomarkerValue("ggt");
  const ggtNormal = gender === "male" ? 60 : 40;
  if (ggtValue !== null) {
    let ggtScore: number;
    if (ggtValue <= ggtNormal * 0.5) {
      ggtScore = 100;
    } else if (ggtValue <= ggtNormal) {
      ggtScore = 80;
    } else if (ggtValue <= ggtNormal * 3) {
      ggtScore = 50;
    } else {
      ggtScore = 20;
    }
    totalWeight += 15;
    totalScore += ggtScore * 0.15;
  }

  // ALP - Cholestatic/infiltrative disease (Weight: 10%)
  const alpValue = getBiomarkerValue("alp");
  if (alpValue !== null) {
    let alpScore: number;
    if (alpValue >= 40 && alpValue <= 100) {
      alpScore = 100;
    } else if (alpValue >= 30 && alpValue <= 130) {
      alpScore = 80;
    } else if (alpValue <= 200) {
      alpScore = 50;
    } else {
      alpScore = 20;
    }
    totalWeight += 10;
    totalScore += alpScore * 0.1;
  }

  // Total Bilirubin - Excretory function (Weight: 15%)
  const bilirubinValue = getBiomarkerValue("bilirubin_total");
  if (bilirubinValue !== null) {
    let bilScore: number;
    if (bilirubinValue <= 17) {
      bilScore = 100;
    } else if (bilirubinValue <= 21) {
      bilScore = 80;
    } else if (bilirubinValue <= 50) {
      bilScore = 50;
    } else {
      bilScore = 20;
    }
    totalWeight += 15;
    totalScore += bilScore * 0.15;
  }

  // Albumin - Synthetic function (Weight: 15%)
  const albuminValue = getBiomarkerValue("albumin");
  if (albuminValue !== null) {
    let albScore: number;
    if (albuminValue >= 40 && albuminValue <= 50) {
      albScore = 100;
    } else if (albuminValue >= 35 && albuminValue <= 55) {
      albScore = 80;
    } else if (albuminValue >= 28) {
      albScore = 50;
    } else {
      albScore = 20;
    }
    totalWeight += 15;
    totalScore += albScore * 0.15;
  }

  // Platelets - Portal hypertension marker (Weight: 10%)
  const plateletsValue = getBiomarkerValue("platelets");
  if (plateletsValue !== null) {
    let pltScore: number;
    if (plateletsValue >= 150 && plateletsValue <= 400) {
      pltScore = 100;
    } else if (plateletsValue >= 100 && plateletsValue <= 450) {
      pltScore = 80;
    } else if (plateletsValue >= 50) {
      pltScore = 50;
    } else {
      pltScore = 20;
    }
    totalWeight += 10;
    totalScore += pltScore * 0.1;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  // Use the helper to count statuses for the actual biomarker results
  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin", "platelets"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== KIDNEY RISK SCORE (KDIGO-based) ====================
function calculateKidneyRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  // ===== eGFR Category (KDIGO G1-G5) - Weight: 35% =====
  const egfrValue = getBiomarkerValue("egfr");
  if (egfrValue !== null) {
    let egfrScore: number;
    if (egfrValue >= 90) {
      egfrScore = 100;
    } else if (egfrValue >= 60) {
      egfrScore = 85;
    } else if (egfrValue >= 45) {
      egfrScore = 60;
    } else if (egfrValue >= 30) {
      egfrScore = 40;
    } else if (egfrValue >= 15) {
      egfrScore = 25;
    } else {
      egfrScore = 10;
    }
    totalWeight += 35;
    totalScore += egfrScore * 0.35;
  }

  // ===== UACR/Albuminuria (KDIGO A1-A3) - Weight: 25% =====
  const uacrValue = getBiomarkerValue("uacr");
  if (uacrValue !== null) {
    let uacrScore: number;
    if (uacrValue < 30) {
      uacrScore = 100;
    } else if (uacrValue <= 300) {
      uacrScore = 55;
    } else {
      uacrScore = 20;
    }
    totalWeight += 25;
    totalScore += uacrScore * 0.25;
  }

  // ===== Electrolyte Balance - Weight: 15% =====
  let electrolyteScore = 0;
  let electrolyteCount = 0;

  const potassiumValue = getBiomarkerValue("potassium");
  if (potassiumValue !== null) {
    if (potassiumValue >= 3.5 && potassiumValue <= 5.0) {
      electrolyteScore += 100;
    } else if (potassiumValue >= 3.0 && potassiumValue <= 5.5) {
      electrolyteScore += 70;
    } else if (potassiumValue > 5.5 || potassiumValue < 3.0) {
      electrolyteScore += 30;
    }
    electrolyteCount++;
  }

  const sodiumValue = getBiomarkerValue("sodium");
  if (sodiumValue !== null) {
    if (sodiumValue >= 136 && sodiumValue <= 145) {
      electrolyteScore += 100;
    } else if (sodiumValue >= 130 && sodiumValue <= 150) {
      electrolyteScore += 70;
    } else {
      electrolyteScore += 30;
    }
    electrolyteCount++;
  }

  const bicarbonateValue = getBiomarkerValue("bicarbonate");
  if (bicarbonateValue !== null) {
    if (bicarbonateValue >= 22 && bicarbonateValue <= 29) {
      electrolyteScore += 100;
    } else if (bicarbonateValue >= 18 && bicarbonateValue < 22) {
      electrolyteScore += 60;
    } else if (bicarbonateValue < 18) {
      electrolyteScore += 25;
    } else {
      electrolyteScore += 80;
    }
    electrolyteCount++;
  }

  if (electrolyteCount > 0) {
    totalWeight += 15;
    totalScore += (electrolyteScore / electrolyteCount) * 0.15;
  }

  // ===== Mineral Metabolism (CKD-MBD) - Weight: 15% =====
  let mineralScore = 0;
  let mineralCount = 0;

  const calciumValue = getBiomarkerValue("calcium");
  if (calciumValue !== null) {
    if (calciumValue >= 2.15 && calciumValue <= 2.55) {
      mineralScore += 100;
    } else if (calciumValue >= 2.0 && calciumValue <= 2.75) {
      mineralScore += 70;
    } else {
      mineralScore += 30;
    }
    mineralCount++;
  }

  const phosphorusValue = getBiomarkerValue("phosphorus");
  if (phosphorusValue !== null) {
    if (phosphorusValue >= 0.8 && phosphorusValue <= 1.5) {
      mineralScore += 100;
    } else if (phosphorusValue <= 1.8) {
      mineralScore += 60;
    } else {
      mineralScore += 25;
    }
    mineralCount++;
  }

  const pthValue = getBiomarkerValue("pth");
  if (pthValue !== null) {
    if (pthValue >= 1.5 && pthValue <= 6.5) {
      mineralScore += 100;
    } else if (pthValue <= 10) {
      mineralScore += 60;
    } else {
      mineralScore += 25;
    }
    mineralCount++;
  }

  if (mineralCount > 0) {
    totalWeight += 15;
    totalScore += (mineralScore / mineralCount) * 0.15;
  }

  // ===== Additional Markers - Weight: 10% =====
  let additionalScore = 0;
  let additionalCount = 0;

  const creatinineValue = getBiomarkerValue("creatinine");
  const creatNormal = gender === "male" ? 110 : 90;
  if (creatinineValue !== null) {
    if (creatinineValue <= creatNormal) {
      additionalScore += 100;
    } else if (creatinineValue <= creatNormal * 1.5) {
      additionalScore += 60;
    } else {
      additionalScore += 25;
    }
    additionalCount++;
  }

  const bunValue = getBiomarkerValue("bun");
  if (bunValue !== null) {
    if (bunValue >= 2.5 && bunValue <= 7.5) {
      additionalScore += 100;
    } else if (bunValue <= 10) {
      additionalScore += 65;
    } else {
      additionalScore += 30;
    }
    additionalCount++;
  }

  const cystatinValue = getBiomarkerValue("cystatin_c");
  if (cystatinValue !== null) {
    if (cystatinValue >= 0.55 && cystatinValue <= 0.95) {
      additionalScore += 100;
    } else if (cystatinValue <= 1.2) {
      additionalScore += 60;
    } else {
      additionalScore += 25;
    }
    additionalCount++;
  }

  if (additionalCount > 0) {
    totalWeight += 10;
    totalScore += (additionalScore / additionalCount) * 0.1;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["creatinine", "egfr", "bun", "cystatin_c", "uacr", "potassium", "sodium", "calcium", "phosphorus", "bicarbonate", "pth"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== HEART RISK SCORE (Cardiovascular) ====================
function calculateHeartRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  const totalCholesterol = getBiomarkerValue("total_cholesterol");
  const hdlCholesterol = getBiomarkerValue("hdl_cholesterol");

  if (totalCholesterol !== null && hdlCholesterol !== null && hdlCholesterol > 0) {
    const ratio = totalCholesterol / hdlCholesterol;
    let ratioScore: number;

    const optimalRatio = gender === "male" ? 4.0 : 3.5;
    const normalRatio = gender === "male" ? 5.0 : 4.5;

    if (ratio <= optimalRatio) {
      ratioScore = 100;
    } else if (ratio <= normalRatio) {
      ratioScore = 75;
    } else if (ratio <= 6.0) {
      ratioScore = 45;
    } else {
      ratioScore = 20;
    }
    totalWeight += 20;
    totalScore += ratioScore * 0.2;
  }

  const ldlCholesterol = getBiomarkerValue("ldl_cholesterol");
  if (ldlCholesterol !== null) {
    let ldlScore: number;
    if (ldlCholesterol < 2.6) {
      ldlScore = 100;
    } else if (ldlCholesterol <= 3.4) {
      ldlScore = 80;
    } else if (ldlCholesterol <= 4.1) {
      ldlScore = 55;
    } else if (ldlCholesterol <= 4.9) {
      ldlScore = 35;
    } else {
      ldlScore = 15;
    }
    totalWeight += 20;
    totalScore += ldlScore * 0.2;
  }

  if (hdlCholesterol !== null) {
    let hdlScore: number;
    const optimalHDL = gender === "male" ? 1.2 : 1.5;
    const lowHDL = gender === "male" ? 1.0 : 1.3;

    if (hdlCholesterol >= optimalHDL) {
      hdlScore = 100;
    } else if (hdlCholesterol >= lowHDL) {
      hdlScore = 75;
    } else if (hdlCholesterol >= lowHDL * 0.8) {
      hdlScore = 45;
    } else {
      hdlScore = 20;
    }
    totalWeight += 15;
    totalScore += hdlScore * 0.15;
  }

  const triglycerides = getBiomarkerValue("triglycerides");
  if (triglycerides !== null) {
    let tgScore: number;
    if (triglycerides < 1.7) {
      tgScore = 100;
    } else if (triglycerides <= 2.3) {
      tgScore = 70;
    } else if (triglycerides <= 5.6) {
      tgScore = 40;
    } else {
      tgScore = 15;
    }
    totalWeight += 15;
    totalScore += tgScore * 0.15;
  }

  const crp = getBiomarkerValue("crp");
  if (crp !== null) {
    let crpScore: number;
    if (crp < 1.0) {
      crpScore = 100;
    } else if (crp <= 3.0) {
      crpScore = 65;
    } else if (crp <= 10) {
      crpScore = 35;
    } else {
      crpScore = 15;
    }
    totalWeight += 10;
    totalScore += crpScore * 0.1;
  }

  const homocysteine = getBiomarkerValue("homocysteine");
  if (homocysteine !== null) {
    let hcyScore: number;
    if (homocysteine >= 5 && homocysteine <= 9) {
      hcyScore = 100;
    } else if (homocysteine <= 12) {
      hcyScore = 75;
    } else if (homocysteine <= 15) {
      hcyScore = 45;
    } else {
      hcyScore = 20;
    }
    totalWeight += 10;
    totalScore += hcyScore * 0.1;
  }

  let metabolicScore = 0;
  let metabolicCount = 0;

  const glucose = getBiomarkerValue("glucose");
  if (glucose !== null) {
    if (glucose < 5.6) {
      metabolicScore += 100;
    } else if (glucose < 7.0) {
      metabolicScore += 55;
    } else {
      metabolicScore += 20;
    }
    metabolicCount++;
  }

  const hba1c = getBiomarkerValue("hba1c");
  if (hba1c !== null) {
    if (hba1c < 5.7) {
      metabolicScore += 100;
    } else if (hba1c < 6.5) {
      metabolicScore += 55;
    } else {
      metabolicScore += 20;
    }
    metabolicCount++;
  }

  if (metabolicCount > 0) {
    totalWeight += 10;
    totalScore += (metabolicScore / metabolicCount) * 0.1;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "crp", "homocysteine", "glucose", "hba1c"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== THYROID RISK SCORE ====================
function calculateThyroidRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  // ===== TSH (Primary Marker) - Weight: 50% =====
  const tshValue = getBiomarkerValue("tsh");
  if (tshValue !== null) {
    let tshScore: number;
    if (tshValue >= 0.5 && tshValue <= 2.5) {
      tshScore = 100;
    } else if (tshValue >= 0.4 && tshValue <= 4.0) {
      tshScore = 80;
    } else if (tshValue > 4.0 && tshValue <= 10.0) {
      tshScore = 50;
    } else if (tshValue > 10.0) {
      tshScore = 20;
    } else if (tshValue >= 0.1 && tshValue < 0.4) {
      tshScore = 55;
    } else {
      tshScore = 25;
    }
    totalWeight += 50;
    totalScore += tshScore * 0.5;
  }

  // ===== Free T4 - Weight: 35% =====
  const ft4Value = getBiomarkerValue("free_t4");
  if (ft4Value !== null) {
    let ft4Score: number;
    if (ft4Value >= 12 && ft4Value <= 20) {
      ft4Score = 100;
    } else if (ft4Value >= 10 && ft4Value <= 25) {
      ft4Score = 80;
    } else if (ft4Value > 25 && ft4Value <= 35) {
      ft4Score = 50;
    } else if (ft4Value > 35) {
      ft4Score = 20;
    } else if (ft4Value >= 7 && ft4Value < 10) {
      ft4Score = 50;
    } else {
      ft4Score = 20;
    }
    totalWeight += 35;
    totalScore += ft4Score * 0.35;
  }

  // ===== Free T3 (If available) - Weight: 15% =====
  const ft3Value = getBiomarkerValue("free_t3");
  if (ft3Value !== null) {
    let ft3Score: number;
    if (ft3Value >= 4.0 && ft3Value <= 6.0) {
      ft3Score = 100;
    } else if (ft3Value >= 3.5 && ft3Value <= 6.5) {
      ft3Score = 80;
    } else if (ft3Value > 6.5 && ft3Value <= 10) {
      ft3Score = 45;
    } else if (ft3Value > 10) {
      ft3Score = 20;
    } else if (ft3Value >= 2.5 && ft3Value < 3.5) {
      ft3Score = 50;
    } else {
      ft3Score = 25;
    }
    totalWeight += 15;
    totalScore += ft3Score * 0.15;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["tsh", "free_t4", "free_t3"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== METABOLIC PANEL SCORE ====================
function calculateMetabolicRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  // ===== Glycemic Control - Weight: 30% =====
  let glycemicScore = 0;
  let glycemicCount = 0;

  const glucoseValue = getBiomarkerValue("glucose");
  if (glucoseValue !== null) {
    if (glucoseValue < 5.0) {
      glycemicScore += 100;
    } else if (glucoseValue <= 5.5) {
      glycemicScore += 85;
    } else if (glucoseValue < 7.0) {
      glycemicScore += 50;
    } else if (glucoseValue < 10.0) {
      glycemicScore += 30;
    } else {
      glycemicScore += 15;
    }
    glycemicCount++;
  }

  const hba1cValue = getBiomarkerValue("hba1c");
  if (hba1cValue !== null) {
    if (hba1cValue < 5.4) {
      glycemicScore += 100;
    } else if (hba1cValue <= 5.6) {
      glycemicScore += 85;
    } else if (hba1cValue < 6.5) {
      glycemicScore += 50;
    } else if (hba1cValue < 8.0) {
      glycemicScore += 35;
    } else {
      glycemicScore += 15;
    }
    glycemicCount++;
  }

  if (glycemicCount > 0) {
    totalWeight += 30;
    totalScore += (glycemicScore / glycemicCount) * 0.3;
  }

  // ===== Insulin Resistance (HOMA-IR) - Weight: 25% =====
  const insulinValue = getBiomarkerValue("insulin");
  if (insulinValue !== null && glucoseValue !== null) {
    const homaIR = (insulinValue * glucoseValue) / 22.5;
    let irScore: number;
    if (homaIR < 1.0) {
      irScore = 100;
    } else if (homaIR < 2.0) {
      irScore = 80;
    } else if (homaIR < 3.0) {
      irScore = 50;
    } else if (homaIR < 5.0) {
      irScore = 30;
    } else {
      irScore = 15;
    }
    totalWeight += 25;
    totalScore += irScore * 0.25;
  } else if (insulinValue !== null) {
    let insulinScore: number;
    if (insulinValue >= 2 && insulinValue <= 6) {
      insulinScore = 100;
    } else if (insulinValue <= 12) {
      insulinScore = 75;
    } else if (insulinValue <= 25) {
      insulinScore = 45;
    } else {
      insulinScore = 20;
    }
    totalWeight += 25;
    totalScore += insulinScore * 0.25;
  }

  // ===== Kidney Markers - Weight: 20% =====
  let kidneyScore = 0;
  let kidneyCount = 0;

  const egfrValue = getBiomarkerValue("egfr");
  if (egfrValue !== null) {
    if (egfrValue >= 90) {
      kidneyScore += 100;
    } else if (egfrValue >= 60) {
      kidneyScore += 80;
    } else if (egfrValue >= 45) {
      kidneyScore += 55;
    } else if (egfrValue >= 30) {
      kidneyScore += 35;
    } else {
      kidneyScore += 15;
    }
    kidneyCount++;
  }

  const creatinineValue = getBiomarkerValue("creatinine");
  const creatNormal = gender === "male" ? 100 : 85;
  if (creatinineValue !== null) {
    if (creatinineValue <= creatNormal * 0.9) {
      kidneyScore += 100;
    } else if (creatinineValue <= creatNormal * 1.1) {
      kidneyScore += 80;
    } else if (creatinineValue <= creatNormal * 1.5) {
      kidneyScore += 50;
    } else {
      kidneyScore += 25;
    }
    kidneyCount++;
  }

  const bunValue = getBiomarkerValue("bun");
  if (bunValue !== null) {
    if (bunValue >= 2.5 && bunValue <= 6.5) {
      kidneyScore += 100;
    } else if (bunValue <= 8.0) {
      kidneyScore += 75;
    } else if (bunValue <= 12.0) {
      kidneyScore += 45;
    } else {
      kidneyScore += 20;
    }
    kidneyCount++;
  }

  if (kidneyCount > 0) {
    totalWeight += 20;
    totalScore += (kidneyScore / kidneyCount) * 0.2;
  }

  // ===== Electrolyte Balance - Weight: 25% =====
  let electrolyteScore = 0;
  let electrolyteCount = 0;

  const sodiumValue = getBiomarkerValue("sodium");
  if (sodiumValue !== null) {
    if (sodiumValue >= 138 && sodiumValue <= 142) {
      electrolyteScore += 100;
    } else if (sodiumValue >= 136 && sodiumValue <= 145) {
      electrolyteScore += 80;
    } else if (sodiumValue >= 130 && sodiumValue <= 150) {
      electrolyteScore += 50;
    } else {
      electrolyteScore += 20;
    }
    electrolyteCount++;
  }

  const potassiumValue = getBiomarkerValue("potassium");
  if (potassiumValue !== null) {
    if (potassiumValue >= 3.8 && potassiumValue <= 4.8) {
      electrolyteScore += 100;
    } else if (potassiumValue >= 3.5 && potassiumValue <= 5.0) {
      electrolyteScore += 80;
    } else if (potassiumValue >= 3.0 && potassiumValue <= 5.5) {
      electrolyteScore += 50;
    } else {
      electrolyteScore += 20;
    }
    electrolyteCount++;
  }

  const calciumValue = getBiomarkerValue("calcium");
  if (calciumValue !== null) {
    if (calciumValue >= 2.2 && calciumValue <= 2.5) {
      electrolyteScore += 100;
    } else if (calciumValue >= 2.1 && calciumValue <= 2.6) {
      electrolyteScore += 80;
    } else if (calciumValue >= 2.0 && calciumValue <= 2.8) {
      electrolyteScore += 50;
    } else {
      electrolyteScore += 20;
    }
    electrolyteCount++;
  }

  const bicarbonateValue = getBiomarkerValue("bicarbonate");
  if (bicarbonateValue !== null) {
    if (bicarbonateValue >= 23 && bicarbonateValue <= 27) {
      electrolyteScore += 100;
    } else if (bicarbonateValue >= 22 && bicarbonateValue <= 29) {
      electrolyteScore += 80;
    } else if (bicarbonateValue >= 18 && bicarbonateValue <= 32) {
      electrolyteScore += 50;
    } else {
      electrolyteScore += 20;
    }
    electrolyteCount++;
  }

  if (electrolyteCount > 0) {
    totalWeight += 25;
    totalScore += (electrolyteScore / electrolyteCount) * 0.25;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["glucose", "hba1c", "insulin", "creatinine", "egfr", "bun", "sodium", "potassium", "calcium", "bicarbonate"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== HORMONE HEALTH SCORE ====================
// Based on Endocrine Society Clinical Practice Guidelines
// Sex-specific reference ranges from Australian pathology standards
// Incorporates: HPA axis assessment, gonadal function, adrenal reserve
function calculateHormoneRiskScore(
  biomarkerResults: BiomarkerResultInput[],
  gender: "male" | "female"
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  hasData: boolean;
} {
  const getBiomarkerValue = (id: string): number | null => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result ? result.value : null;
  };

  let totalWeight = 0;
  let totalScore = 0;

  // ============================================================
  // MALE HORMONE PANEL
  // ============================================================
  if (gender === "male") {
    // ===== Testosterone Total - Primary Male Marker - Weight: 30% =====
    // Reference: Endocrine Society Guidelines for Testosterone Therapy (2018)
    // Units: nmol/L (Australian standard)
    const testosteroneValue = getBiomarkerValue("testosterone_total");
    if (testosteroneValue !== null) {
      let testScore: number;
      // Optimal: 14-28 nmol/L (functional optimal for vitality)
      // Normal: 8-30 nmol/L (laboratory reference range)
      // Low: <8 nmol/L (hypogonadism threshold)
      // High: >35 nmol/L (may indicate supplementation or pathology)
      if (testosteroneValue >= 14 && testosteroneValue <= 28) {
        testScore = 100;
      } else if (testosteroneValue >= 10 && testosteroneValue < 14) {
        testScore = 80;
      } else if (testosteroneValue > 28 && testosteroneValue <= 35) {
        testScore = 80;
      } else if (testosteroneValue >= 8 && testosteroneValue < 10) {
        testScore = 60;
      } else if (testosteroneValue < 8) {
        // Frank hypogonadism
        testScore = 30;
      } else {
        // >35 nmol/L - supraphysiological
        testScore = 50;
      }
      totalWeight += 30;
      totalScore += testScore * 0.30;
    }

    // ===== Free Testosterone (if available) - Weight: 15% =====
    // Units: pmol/L
    const freeTestValue = getBiomarkerValue("free_testosterone");
    if (freeTestValue !== null) {
      let ftScore: number;
      // Optimal: 250-500 pmol/L
      // Normal: 180-600 pmol/L
      if (freeTestValue >= 250 && freeTestValue <= 500) {
        ftScore = 100;
      } else if (freeTestValue >= 180 && freeTestValue < 250) {
        ftScore = 75;
      } else if (freeTestValue > 500 && freeTestValue <= 600) {
        ftScore = 75;
      } else if (freeTestValue >= 150 && freeTestValue < 180) {
        ftScore = 55;
      } else if (freeTestValue < 150) {
        ftScore = 30;
      } else {
        ftScore = 50;
      }
      totalWeight += 15;
      totalScore += ftScore * 0.15;
    }

    // ===== SHBG - Sex Hormone Binding Globulin - Weight: 10% =====
    // Units: nmol/L
    // High SHBG reduces bioavailable testosterone
    const shbgValue = getBiomarkerValue("shbg");
    if (shbgValue !== null) {
      let shbgScore: number;
      // Optimal: 20-50 nmol/L (males)
      // Low SHBG (<10): May indicate insulin resistance, obesity
      // High SHBG (>70): May reduce free testosterone availability
      if (shbgValue >= 20 && shbgValue <= 50) {
        shbgScore = 100;
      } else if (shbgValue >= 15 && shbgValue < 20) {
        shbgScore = 75;
      } else if (shbgValue > 50 && shbgValue <= 70) {
        shbgScore = 70;
      } else if (shbgValue < 15 || shbgValue > 70) {
        shbgScore = 45;
      } else {
        shbgScore = 50;
      }
      totalWeight += 10;
      totalScore += shbgScore * 0.10;
    }

    // ===== Estradiol (E2) for Males - Weight: 10% =====
    // Units: pmol/L
    // Important for bone health, libido, but high levels problematic
    const estradiolValue = getBiomarkerValue("estradiol");
    if (estradiolValue !== null) {
      let e2Score: number;
      // Optimal: 70-150 pmol/L (males)
      // Low: <50 pmol/L (bone health concern)
      // High: >180 pmol/L (gynecomastia risk)
      if (estradiolValue >= 70 && estradiolValue <= 150) {
        e2Score = 100;
      } else if (estradiolValue >= 50 && estradiolValue < 70) {
        e2Score = 75;
      } else if (estradiolValue > 150 && estradiolValue <= 180) {
        e2Score = 70;
      } else if (estradiolValue < 50) {
        e2Score = 50;
      } else {
        // >180 pmol/L - elevated
        e2Score = 45;
      }
      totalWeight += 10;
      totalScore += e2Score * 0.10;
    }

  // ============================================================
  // FEMALE HORMONE PANEL
  // ============================================================
  } else {
    // ===== Estradiol - Primary Female Marker - Weight: 25% =====
    // Units: pmol/L
    // Reference ranges vary by menstrual phase; using mid-cycle optimal
    const estradiolValue = getBiomarkerValue("estradiol");
    if (estradiolValue !== null) {
      let e2Score: number;
      // Follicular: 70-500 pmol/L
      // Mid-cycle (ovulation): 500-1500 pmol/L
      // Luteal: 150-750 pmol/L
      // Menopause: <150 pmol/L (expected)
      // Using general premenopausal optimal: 200-600 pmol/L
      if (estradiolValue >= 200 && estradiolValue <= 600) {
        e2Score = 100;
      } else if (estradiolValue >= 100 && estradiolValue < 200) {
        e2Score = 80;
      } else if (estradiolValue > 600 && estradiolValue <= 1000) {
        e2Score = 80;
      } else if (estradiolValue >= 50 && estradiolValue < 100) {
        e2Score = 60; // Possibly perimenopausal
      } else if (estradiolValue < 50) {
        e2Score = 50; // Menopausal or hypogonadism
      } else {
        e2Score = 55;
      }
      totalWeight += 25;
      totalScore += e2Score * 0.25;
    }

    // ===== Progesterone - Weight: 20% =====
    // Units: nmol/L
    // Critical for luteal phase, fertility, mood
    const progesteroneValue = getBiomarkerValue("progesterone");
    if (progesteroneValue !== null) {
      let progScore: number;
      // Follicular: 0.5-3 nmol/L
      // Luteal (optimal): >16 nmol/L confirms ovulation
      // Mid-luteal optimal: 25-85 nmol/L
      // Using general indicator - elevated is usually good for fertility
      if (progesteroneValue >= 16 && progesteroneValue <= 85) {
        progScore = 100;
      } else if (progesteroneValue >= 5 && progesteroneValue < 16) {
        progScore = 75; // Follicular phase or suboptimal luteal
      } else if (progesteroneValue >= 1 && progesteroneValue < 5) {
        progScore = 65; // Likely follicular
      } else if (progesteroneValue < 1) {
        progScore = 50;
      } else {
        // Very high - pregnancy or supplementation
        progScore = 70;
      }
      totalWeight += 20;
      totalScore += progScore * 0.20;
    }

    // ===== FSH - Follicle Stimulating Hormone - Weight: 15% =====
    // Units: IU/L
    const fshValue = getBiomarkerValue("fsh");
    if (fshValue !== null) {
      let fshScore: number;
      // Follicular: 3-10 IU/L
      // Mid-cycle surge: 8-25 IU/L
      // Luteal: 1-8 IU/L
      // Menopause: >25 IU/L
      // General premenopausal optimal: 3-10 IU/L
      if (fshValue >= 3 && fshValue <= 10) {
        fshScore = 100;
      } else if (fshValue >= 1 && fshValue < 3) {
        fshScore = 75;
      } else if (fshValue > 10 && fshValue <= 20) {
        fshScore = 70; // May be mid-cycle or perimenopause
      } else if (fshValue > 20 && fshValue <= 40) {
        fshScore = 50; // Perimenopause/menopause
      } else if (fshValue > 40) {
        fshScore = 40; // Menopause
      } else {
        fshScore = 55;
      }
      totalWeight += 15;
      totalScore += fshScore * 0.15;
    }

    // ===== LH - Luteinizing Hormone - Weight: 10% =====
    // Units: IU/L
    const lhValue = getBiomarkerValue("lh");
    if (lhValue !== null) {
      let lhScore: number;
      // Follicular: 2-10 IU/L
      // Mid-cycle surge: 15-60 IU/L
      // Luteal: 1-10 IU/L
      // General: 2-10 IU/L
      if (lhValue >= 2 && lhValue <= 10) {
        lhScore = 100;
      } else if (lhValue >= 1 && lhValue < 2) {
        lhScore = 75;
      } else if (lhValue > 10 && lhValue <= 20) {
        lhScore = 70;
      } else if (lhValue > 20) {
        lhScore = 50;
      } else {
        lhScore = 55;
      }
      totalWeight += 10;
      totalScore += lhScore * 0.10;
    }

    // ===== Testosterone for Females - Weight: 10% =====
    // Units: nmol/L
    // Important for libido, energy, muscle
    const testosteroneValue = getBiomarkerValue("testosterone_total");
    if (testosteroneValue !== null) {
      let testScore: number;
      // Female optimal: 0.5-2.0 nmol/L
      // Low: <0.3 nmol/L
      // High: >2.5 nmol/L (PCOS concern)
      if (testosteroneValue >= 0.5 && testosteroneValue <= 2.0) {
        testScore = 100;
      } else if (testosteroneValue >= 0.3 && testosteroneValue < 0.5) {
        testScore = 75;
      } else if (testosteroneValue > 2.0 && testosteroneValue <= 2.5) {
        testScore = 70;
      } else if (testosteroneValue < 0.3) {
        testScore = 55;
      } else {
        // >2.5 nmol/L - possible hyperandrogenism/PCOS
        testScore = 45;
      }
      totalWeight += 10;
      totalScore += testScore * 0.10;
    }
  }

  // ============================================================
  // ADRENAL/STRESS HORMONES (Both Genders)
  // ============================================================

  // ===== Cortisol (AM) - Weight: 15% =====
  // Units: nmol/L
  // Reference: HPA axis function assessment
  const cortisolValue = getBiomarkerValue("cortisol");
  if (cortisolValue !== null) {
    let cortisolScore: number;
    // Morning cortisol (8-10am):
    // Optimal: 300-500 nmol/L (functional optimal)
    // Normal: 200-600 nmol/L
    // Low: <200 nmol/L (adrenal insufficiency concern)
    // High: >650 nmol/L (chronic stress, Cushing's concern)
    if (cortisolValue >= 300 && cortisolValue <= 500) {
      cortisolScore = 100;
    } else if (cortisolValue >= 200 && cortisolValue < 300) {
      cortisolScore = 80;
    } else if (cortisolValue > 500 && cortisolValue <= 600) {
      cortisolScore = 75;
    } else if (cortisolValue >= 150 && cortisolValue < 200) {
      cortisolScore = 55; // Low morning cortisol
    } else if (cortisolValue > 600 && cortisolValue <= 700) {
      cortisolScore = 55; // Elevated stress
    } else if (cortisolValue < 150) {
      cortisolScore = 35; // Adrenal insufficiency concern
    } else {
      // >700 nmol/L - significantly elevated
      cortisolScore = 40;
    }
    totalWeight += 15;
    totalScore += cortisolScore * 0.15;
  }

  // ===== DHEA-S - Adrenal Reserve Marker - Weight: 10% =====
  // Units: µmol/L
  // Important marker of adrenal function and biological aging
  const dheasValue = getBiomarkerValue("dhea_s");
  if (dheasValue !== null) {
    let dheasScore: number;
    // Age-dependent reference ranges (using adult optimal)
    // Male optimal: 4-10 µmol/L (ages 25-45)
    // Female optimal: 2-8 µmol/L (ages 25-45)
    // DHEA-S naturally declines with age
    const optimalMin = gender === "male" ? 4 : 2;
    const optimalMax = gender === "male" ? 10 : 8;
    const normalMin = gender === "male" ? 2 : 1;
    const normalMax = gender === "male" ? 13 : 10;

    if (dheasValue >= optimalMin && dheasValue <= optimalMax) {
      dheasScore = 100;
    } else if (dheasValue >= normalMin && dheasValue < optimalMin) {
      dheasScore = 70; // Lower than optimal but acceptable
    } else if (dheasValue > optimalMax && dheasValue <= normalMax) {
      dheasScore = 75;
    } else if (dheasValue < normalMin) {
      dheasScore = 45; // Low adrenal reserve
    } else {
      dheasScore = 50;
    }
    totalWeight += 10;
    totalScore += dheasScore * 0.10;
  }

  // ===== Cortisol:DHEA-S Ratio Assessment (Bonus scoring) =====
  // This ratio indicates HPA axis balance and stress resilience
  const cortisolValue2 = getBiomarkerValue("cortisol");
  const dheasValue2 = getBiomarkerValue("dhea_s");
  if (cortisolValue2 !== null && dheasValue2 !== null && dheasValue2 > 0) {
    // Convert to same units for ratio: cortisol (nmol/L) / DHEA-S (µmol/L × 1000)
    const ratio = cortisolValue2 / (dheasValue2 * 1000);
    let ratioScore: number;
    // Optimal ratio: 0.03-0.05
    // High ratio indicates chronic stress, accelerated aging
    if (ratio >= 0.02 && ratio <= 0.06) {
      ratioScore = 100;
    } else if (ratio > 0.06 && ratio <= 0.10) {
      ratioScore = 65;
    } else if (ratio > 0.10) {
      ratioScore = 40; // High stress / low resilience
    } else {
      ratioScore = 70;
    }
    totalWeight += 5;
    totalScore += ratioScore * 0.05;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const { optimal, normal, outOfRange, hasData } = countBiomarkerStatuses(
    ["testosterone_total", "estradiol", "progesterone", "cortisol", "dhea_s", "fsh", "lh", "shbg", "free_testosterone"],
    biomarkerResults,
    gender
  );

  return {
    score: normalizedScore,
    optimal,
    normal,
    outOfRange,
    hasData
  };
}

// ==================== STATUS-BASED SCORING ====================
export function calculateStatusBasedScore(
  biomarkerIds: readonly string[],
  gender: "male" | "female",
  biomarkerResults: BiomarkerResultInput[]
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  trend: "improving" | "stable" | "declining";
  hasData: boolean;
  lastTested: string | null;
} {
  let totalScore = 0;
  let count = 0;
  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;
  let latestDate: Date | null = null;

  for (const biomarkerId of biomarkerIds) {
    const result = biomarkerResults.find(r => r.biomarkerId === biomarkerId);
    const biomarker = getBiomarkerById(biomarkerId);

    if (result && biomarker) {
      const status = result.status?.toLowerCase() || getStatusForValue(biomarker, result.value, gender);
      if (status === "optimal") {
        totalScore += 100;
        optimal++;
      } else if (status === "normal") {
        totalScore += 75;
        normal++;
      } else if (status === "out_of_range") {
        totalScore += 40;
        outOfRange++;
      } else {
        totalScore += 20;
        outOfRange++;
      }
      count++;

      if (result.testedAt) {
        const testDate = new Date(result.testedAt);
        if (!latestDate || testDate > latestDate) {
          latestDate = testDate;
        }
      }
    }
  }

  const score = count > 0 ? Math.round(totalScore / count) : 0;
  let trend: "improving" | "stable" | "declining" = "stable";
  if (optimal > outOfRange * 2) trend = "improving";
  else if (outOfRange > optimal) trend = "declining";

  return {
    score,
    optimal,
    normal,
    outOfRange,
    trend,
    hasData: count > 0,
    lastTested: latestDate ? latestDate.toISOString() : null
  };
}

// ==================== MAIN SCORE CALCULATION ====================
export function calculateTestScore(
  testId: string,
  biomarkerIds: readonly string[],
  gender: "male" | "female",
  biomarkerResults: BiomarkerResultInput[]
): {
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  trend: "improving" | "stable" | "declining";
  hasData: boolean;
  lastTested: string | null;
} {
  const getLatestTestDate = (ids: string[]): string | null => {
    let latestDate: Date | null = null;
    for (const biomarkerId of ids) {
      const result = biomarkerResults.find(r => r.biomarkerId === biomarkerId);
      if (result?.testedAt) {
        const testDate = new Date(result.testedAt);
        if (!latestDate || testDate > latestDate) {
          latestDate = testDate;
        }
      }
    }
    return latestDate ? latestDate.toISOString() : null;
  };

  const calculateTrend = (optimal: number, outOfRange: number): "improving" | "stable" | "declining" => {
    if (optimal > outOfRange * 2) return "improving";
    if (outOfRange > optimal) return "declining";
    return "stable";
  };

  if (testId === "liver") {
    const liverScore = calculateLiverRiskScore(biomarkerResults, gender);
    const liverBiomarkerIds = ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin", "platelets"];
    return {
      ...liverScore,
      trend: calculateTrend(liverScore.optimal, liverScore.outOfRange),
      lastTested: getLatestTestDate(liverBiomarkerIds)
    };
  }

  if (testId === "kidney") {
    const kidneyScore = calculateKidneyRiskScore(biomarkerResults, gender);
    const kidneyBiomarkerIds = ["creatinine", "egfr", "bun", "cystatin_c", "uacr", "potassium", "sodium", "calcium", "phosphorus", "bicarbonate", "pth"];
    return {
      ...kidneyScore,
      trend: calculateTrend(kidneyScore.optimal, kidneyScore.outOfRange),
      lastTested: getLatestTestDate(kidneyBiomarkerIds)
    };
  }

  if (testId === "heart") {
    const heartScore = calculateHeartRiskScore(biomarkerResults, gender);
    const heartBiomarkerIds = ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "crp", "homocysteine", "glucose", "hba1c"];
    return {
      ...heartScore,
      trend: calculateTrend(heartScore.optimal, heartScore.outOfRange),
      lastTested: getLatestTestDate(heartBiomarkerIds)
    };
  }

  if (testId === "thyroid") {
    const thyroidScore = calculateThyroidRiskScore(biomarkerResults, gender);
    const thyroidBiomarkerIds = ["tsh", "free_t4", "free_t3"];
    return {
      ...thyroidScore,
      trend: calculateTrend(thyroidScore.optimal, thyroidScore.outOfRange),
      lastTested: getLatestTestDate(thyroidBiomarkerIds)
    };
  }

  if (testId === "hormones") {
    const hormoneScore = calculateHormoneRiskScore(biomarkerResults, gender);
    const hormoneBiomarkerIds = ["testosterone_total", "estradiol", "progesterone", "cortisol", "dhea_s", "fsh", "lh", "shbg", "free_testosterone"];
    return {
      ...hormoneScore,
      trend: calculateTrend(hormoneScore.optimal, hormoneScore.outOfRange),
      lastTested: getLatestTestDate(hormoneBiomarkerIds)
    };
  }

  if (testId === "metabolic") {
    const metabolicScore = calculateMetabolicRiskScore(biomarkerResults, gender);
    const metabolicBiomarkerIds = ["glucose", "hba1c", "insulin", "creatinine", "egfr", "bun", "sodium", "potassium", "calcium", "bicarbonate"];
    return {
      ...metabolicScore,
      trend: calculateTrend(metabolicScore.optimal, metabolicScore.outOfRange),
      lastTested: getLatestTestDate(metabolicBiomarkerIds)
    };
  }

  return calculateStatusBasedScore(biomarkerIds, gender, biomarkerResults);
}

export function calculateAllHealthTestScores(
  gender: "male" | "female",
  biomarkerResults: BiomarkerResultInput[]
): OverallHealthScore {
  const categories: HealthTestScore[] = healthTestsConfig.map(test => {
    const { score, optimal, normal, outOfRange, trend, hasData, lastTested } = calculateTestScore(
      test.id,
      test.biomarkerIds,
      gender,
      biomarkerResults
    );
    return {
      ...test,
      score,
      optimal,
      normal,
      outOfRange,
      trend,
      hasData,
      lastTested
    };
  });

  const testsWithData = categories.filter(t => t.hasData);

  const overall = testsWithData.length > 0
    ? Math.round(testsWithData.reduce((sum, test) => sum + test.score, 0) / testsWithData.length)
    : 0;

  // Count unique biomarkers and their statuses for totals
  const uniqueBiomarkerIds = Array.from(
    new Set(
      healthTestsConfig.flatMap(test => test.biomarkerIds)
    )
  );
  const { optimal: totalOptimal, normal: totalNormal, outOfRange: totalOutOfRange, hasData } = countBiomarkerStatuses(
    uniqueBiomarkerIds,
    biomarkerResults,
    gender
  );
  const totalBiomarkers = totalOptimal + totalNormal + totalOutOfRange;

  const allLastTested = categories
    .filter(c => c.lastTested)
    .map(c => new Date(c.lastTested!).getTime());
  const lastUpdated = allLastTested.length > 0
    ? new Date(Math.max(...allLastTested)).toISOString()
    : new Date().toISOString();

  return {
    overall,
    categories,
    totalOptimal,
    totalNormal,
    totalOutOfRange,
    totalBiomarkers,
    lastUpdated
  };
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

export function getProgressColor(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Attention";
  return "Requires Action";
}
