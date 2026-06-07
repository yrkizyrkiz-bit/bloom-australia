import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { getDataDate, isResultsStale } from "@/lib/ai-report-cache";

const anthropic = new Anthropic();

interface BiomarkerData {
  id: string;
  name: string;
  value: number;
  unit: string;
  optimalMin?: number;
  optimalMax?: number;
  normalMin?: number;
  normalMax?: number;
  testedAt: string;
}

// ==================== KDIGO CKD CLASSIFICATION ====================
// Based on KDIGO 2024 Clinical Practice Guideline for CKD
// Reference: https://kdigo.org/guidelines/ckd-evaluation-and-management/

/**
 * KDIGO eGFR Categories (G1-G5)
 * Unit: mL/min/1.73m²
 */
type GFRCategory = "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5";

interface GFRCategoryInfo {
  category: GFRCategory;
  range: string;
  description: string;
  riskScore: number; // 0-100 scale for UI
}

function getGFRCategory(eGFR: number): GFRCategoryInfo {
  if (eGFR >= 90) return { category: "G1", range: "≥90", description: "Normal or high", riskScore: 5 };
  if (eGFR >= 60) return { category: "G2", range: "60-89", description: "Mildly decreased", riskScore: 15 };
  if (eGFR >= 45) return { category: "G3a", range: "45-59", description: "Mildly to moderately decreased", riskScore: 30 };
  if (eGFR >= 30) return { category: "G3b", range: "30-44", description: "Moderately to severely decreased", riskScore: 50 };
  if (eGFR >= 15) return { category: "G4", range: "15-29", description: "Severely decreased", riskScore: 75 };
  return { category: "G5", range: "<15", description: "Kidney failure", riskScore: 95 };
}

/**
 * KDIGO Albuminuria Categories (A1-A3)
 * Based on UACR (Urine Albumin-to-Creatinine Ratio)
 * Unit: mg/g (or mg/mmol with conversion factor 0.113)
 */
type AlbuminuriaCategory = "A1" | "A2" | "A3";

interface AlbuminuriaCategoryInfo {
  category: AlbuminuriaCategory;
  range: string;
  description: string;
  riskScore: number;
}

function getAlbuminuriaCategory(uacr: number): AlbuminuriaCategoryInfo {
  if (uacr < 30) return { category: "A1", range: "<30 mg/g", description: "Normal to mildly increased", riskScore: 5 };
  if (uacr <= 300) return { category: "A2", range: "30-300 mg/g", description: "Moderately increased (microalbuminuria)", riskScore: 35 };
  return { category: "A3", range: ">300 mg/g", description: "Severely increased (macroalbuminuria)", riskScore: 70 };
}

/**
 * KDIGO CKD Heat Map Risk Prognosis
 * Combines GFR category (G1-G5) with Albuminuria category (A1-A3)
 * Returns: "low" | "moderate" | "high" | "very_high"
 */
type CKDRiskLevel = "low" | "moderate" | "high" | "very_high";

interface CKDRiskInfo {
  level: CKDRiskLevel;
  color: "green" | "yellow" | "orange" | "red";
  description: string;
  riskScore: number;
  monitoringFrequency: string;
}

function getCKDRiskFromHeatMap(gfrCategory: GFRCategory, albuminuriaCategory: AlbuminuriaCategory): CKDRiskInfo {
  // KDIGO CKD Heat Map - mapping GFR x Albuminuria to risk
  const heatMap: Record<GFRCategory, Record<AlbuminuriaCategory, CKDRiskLevel>> = {
    G1: { A1: "low", A2: "moderate", A3: "high" },
    G2: { A1: "low", A2: "moderate", A3: "high" },
    G3a: { A1: "moderate", A2: "high", A3: "very_high" },
    G3b: { A1: "high", A2: "very_high", A3: "very_high" },
    G4: { A1: "very_high", A2: "very_high", A3: "very_high" },
    G5: { A1: "very_high", A2: "very_high", A3: "very_high" }
  };

  const level = heatMap[gfrCategory][albuminuriaCategory];

  const riskDetails: Record<CKDRiskLevel, Omit<CKDRiskInfo, "level">> = {
    low: {
      color: "green",
      description: "Low risk of CKD progression",
      riskScore: 10,
      monitoringFrequency: "Annual monitoring recommended"
    },
    moderate: {
      color: "yellow",
      description: "Moderately increased risk of CKD progression",
      riskScore: 35,
      monitoringFrequency: "Monitor every 6-12 months"
    },
    high: {
      color: "orange",
      description: "High risk of CKD progression and cardiovascular events",
      riskScore: 60,
      monitoringFrequency: "Monitor every 3-6 months"
    },
    very_high: {
      color: "red",
      description: "Very high risk - consider nephrology referral",
      riskScore: 85,
      monitoringFrequency: "Monitor every 1-3 months, nephrology referral recommended"
    }
  };

  return { level, ...riskDetails[level] };
}

/**
 * Calculate Kidney Failure Risk Equation (KFRE)
 * Estimates 2-year and 5-year risk of kidney failure requiring dialysis/transplant
 * For patients with eGFR < 60 (CKD stage 3-5)
 * Reference: Tangri et al. JAMA 2016
 */
interface KFREResult {
  twoYearRisk: number; // percentage
  fiveYearRisk: number; // percentage
  applicable: boolean;
  reason?: string;
}

function calculateKFRE(eGFR: number, uacr: number, age: number, sex: "male" | "female"): KFREResult {
  // KFRE is only applicable for eGFR < 60
  if (eGFR >= 60) {
    return { twoYearRisk: 0, fiveYearRisk: 0, applicable: false, reason: "eGFR ≥60 - KFRE not applicable" };
  }

  // 4-variable KFRE equation coefficients
  const isMale = sex === "male" ? 1 : 0;
  const logUACR = Math.log(Math.max(uacr, 1)); // Prevent log(0)

  // 2-year risk calculation
  const alpha2 = -0.2201 * (age / 10 - 7.036) +
                 0.2467 * (isMale - 0.5642) -
                 0.5567 * (eGFR / 5 - 7.222) +
                 0.4510 * (logUACR - 5.137);
  const twoYearRisk = (1 - Math.pow(0.9832, Math.exp(alpha2))) * 100;

  // 5-year risk calculation
  const alpha5 = -0.2201 * (age / 10 - 7.036) +
                 0.2467 * (isMale - 0.5642) -
                 0.5567 * (eGFR / 5 - 7.222) +
                 0.4510 * (logUACR - 5.137);
  const fiveYearRisk = (1 - Math.pow(0.9365, Math.exp(alpha5))) * 100;

  return {
    twoYearRisk: Math.min(100, Math.max(0, Math.round(twoYearRisk * 10) / 10)),
    fiveYearRisk: Math.min(100, Math.max(0, Math.round(fiveYearRisk * 10) / 10)),
    applicable: true
  };
}

/**
 * Assess electrolyte status for CKD complications
 */
interface ElectrolyteAssessment {
  status: "normal" | "borderline" | "abnormal";
  findings: string[];
  riskContribution: number;
}

function assessElectrolytes(biomarkers: Map<string, number>): ElectrolyteAssessment {
  const findings: string[] = [];
  let abnormalCount = 0;

  // Potassium (normal: 3.5-5.0 mmol/L for CKD)
  const potassium = biomarkers.get("potassium");
  if (potassium !== undefined) {
    if (potassium > 5.5) { findings.push("Hyperkalemia detected - cardiac risk"); abnormalCount += 2; }
    else if (potassium > 5.0) { findings.push("Mild hyperkalemia - monitor closely"); abnormalCount += 1; }
    else if (potassium < 3.5) { findings.push("Hypokalemia detected"); abnormalCount += 1; }
  }

  // Sodium (normal: 136-145 mmol/L)
  const sodium = biomarkers.get("sodium");
  if (sodium !== undefined) {
    if (sodium < 130) { findings.push("Significant hyponatremia"); abnormalCount += 2; }
    else if (sodium < 136) { findings.push("Mild hyponatremia"); abnormalCount += 1; }
    else if (sodium > 145) { findings.push("Hypernatremia detected"); abnormalCount += 1; }
  }

  // Bicarbonate (normal: 22-29 mmol/L, CKD often shows metabolic acidosis)
  const bicarbonate = biomarkers.get("bicarbonate");
  if (bicarbonate !== undefined) {
    if (bicarbonate < 18) { findings.push("Severe metabolic acidosis - may accelerate CKD progression"); abnormalCount += 2; }
    else if (bicarbonate < 22) { findings.push("Metabolic acidosis present"); abnormalCount += 1; }
  }

  // Phosphate (normal: 0.8-1.5 mmol/L, elevated in CKD stages 4-5)
  const phosphate = biomarkers.get("phosphate");
  if (phosphate !== undefined) {
    if (phosphate > 1.8) { findings.push("Hyperphosphatemia - bone-mineral disorder risk"); abnormalCount += 2; }
    else if (phosphate > 1.5) { findings.push("Elevated phosphate - monitor for CKD-MBD"); abnormalCount += 1; }
  }

  // Calcium (normal: 2.1-2.6 mmol/L)
  const calcium = biomarkers.get("calcium");
  if (calcium !== undefined) {
    if (calcium < 2.0) { findings.push("Hypocalcemia - check vitamin D and PTH"); abnormalCount += 1; }
    else if (calcium > 2.6) { findings.push("Hypercalcemia detected"); abnormalCount += 1; }
  }

  const status = abnormalCount === 0 ? "normal" : abnormalCount <= 2 ? "borderline" : "abnormal";
  const riskContribution = Math.min(30, abnormalCount * 8);

  return { status, findings, riskContribution };
}

/**
 * Assess anemia status (common CKD complication)
 */
interface AnemiaAssessment {
  status: "normal" | "mild" | "moderate" | "severe";
  hemoglobin?: number;
  findings: string[];
  riskContribution: number;
}

function assessAnemia(biomarkers: Map<string, number>, sex: "male" | "female"): AnemiaAssessment {
  const hemoglobin = biomarkers.get("hemoglobin");
  const findings: string[] = [];

  if (hemoglobin === undefined) {
    return { status: "normal", findings: ["Hemoglobin not available"], riskContribution: 0 };
  }

  // WHO anemia thresholds (adjusted for sex)
  // Male: <130 g/L, Female: <120 g/L
  const anemiaThreshold = sex === "male" ? 130 : 120;
  const moderateThreshold = sex === "male" ? 110 : 100;
  const severeThreshold = 80;

  if (hemoglobin < severeThreshold) {
    findings.push(`Severe anemia (Hb ${hemoglobin} g/L) - urgent intervention needed`);
    return { status: "severe", hemoglobin, findings, riskContribution: 25 };
  }
  if (hemoglobin < moderateThreshold) {
    findings.push(`Moderate anemia (Hb ${hemoglobin} g/L) - consider EPO therapy evaluation`);
    return { status: "moderate", hemoglobin, findings, riskContribution: 15 };
  }
  if (hemoglobin < anemiaThreshold) {
    findings.push(`Mild anemia (Hb ${hemoglobin} g/L) - monitor iron studies`);
    return { status: "mild", hemoglobin, findings, riskContribution: 8 };
  }

  findings.push("Hemoglobin within normal range");
  return { status: "normal", hemoglobin, findings, riskContribution: 0 };
}

/**
 * Calculate eGFR decline rate over time
 * Rapid progression is defined as >5 mL/min/1.73m²/year
 */
interface EGFRDeclineResult {
  annualDeclineRate: number; // mL/min/1.73m²/year
  isRapidProgression: boolean;
  dataPoints: { date: string; value: number }[];
  timeSpanMonths: number;
  trend: "stable" | "slow_decline" | "moderate_decline" | "rapid_decline";
  projectedEGFR12Months?: number;
}

async function calculateEGFRDecline(
  userId: string,
  currentEGFR: number
): Promise<EGFRDeclineResult | null> {
  try {
    // Fetch all eGFR results for the user, ordered by date
    const eGFRResults = await prisma.biomarkerResult.findMany({
      where: {
        userId,
        biomarkerId: "egfr"
      },
      orderBy: { testedAt: "asc" },
      select: {
        value: true,
        testedAt: true
      }
    });

    if (eGFRResults.length < 2) {
      return null; // Need at least 2 data points
    }

    const dataPoints = eGFRResults.map(r => ({
      date: r.testedAt.toISOString(),
      value: r.value
    }));

    // Calculate time span in months
    const firstDate = new Date(dataPoints[0].date);
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date);
    const timeSpanMonths = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (timeSpanMonths < 3) {
      return null; // Need at least 3 months of data for meaningful trend
    }

    // Calculate annual decline rate using linear regression
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    const firstTime = firstDate.getTime();
    dataPoints.forEach((point, i) => {
      const x = (new Date(point.date).getTime() - firstTime) / (1000 * 60 * 60 * 24 * 365.25); // Years from first
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    // Linear regression slope (change per year)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const annualDeclineRate = -slope; // Positive value indicates decline

    // Determine trend category
    let trend: "stable" | "slow_decline" | "moderate_decline" | "rapid_decline";
    if (annualDeclineRate < 1) trend = "stable";
    else if (annualDeclineRate < 3) trend = "slow_decline";
    else if (annualDeclineRate < 5) trend = "moderate_decline";
    else trend = "rapid_decline";

    // Project eGFR 12 months from now
    const projectedEGFR12Months = Math.max(0, currentEGFR - annualDeclineRate);

    return {
      annualDeclineRate: Math.round(annualDeclineRate * 10) / 10,
      isRapidProgression: annualDeclineRate >= 5,
      dataPoints,
      timeSpanMonths: Math.round(timeSpanMonths),
      trend,
      projectedEGFR12Months: Math.round(projectedEGFR12Months)
    };
  } catch (error) {
    console.error("[Kidney Analysis] Error calculating eGFR decline:", error);
    return null;
  }
}

// ==================== END KDIGO CLASSIFICATION ====================

interface RiskFactor {
  id: string;
  name: string;
  category: "ckd_staging" | "albuminuria" | "electrolyte" | "anemia" | "progression";
  currentRisk: number;
  previousRisk: number;
  trend: "improving" | "stable" | "worsening";
  contributingBiomarkers: {
    name: string;
    value: number;
    unit: string;
    status: "optimal" | "borderline" | "elevated" | "critical";
    impact: number;
  }[];
  timeToRisk?: string;
  preventionPotential: number;
  explanation: string;
  scientificBasis?: string;
}

interface HealthPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

interface KidneyAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  // Scientific KDIGO Classification
  ckdStage: {
    gfrCategory: GFRCategoryInfo;
    albuminuriaCategory: AlbuminuriaCategoryInfo | null;
    overallRisk: CKDRiskInfo;
    kfre: KFREResult | null;
  };
  // eGFR Decline Tracking
  eGFRDecline?: EGFRDeclineResult;
  riskFactors: RiskFactor[];
  predictions: HealthPrediction[];
  personalizedInsights: string[];
  urgentActions: string[];
  lifestyleRecommendations: string[];
  analyzedAt: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  dataDate?: string | null;
  resultsStale?: boolean;
}

// Kidney-related biomarker IDs
const KIDNEY_BIOMARKER_IDS = [
  "creatinine", "urea", "egfr", "cystatin_c", "uric_acid", "uacr",
  "sodium", "potassium", "chloride", "bicarbonate",
  "calcium", "phosphate", "magnesium",
  "albumin", "total_protein",
  "glucose", "hba1c",
  "crp", "homocysteine",
  "hemoglobin", "rbc", "hematocrit"
];

function createBiomarkerHash(biomarkers: BiomarkerData[]): string {
  const sortedData = biomarkers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(b => `${b.id}:${b.value}:${b.testedAt}`)
    .join("|");
  return crypto.createHash("md5").update(sortedData).digest("hex");
}

export async function GET() {
  try {
    console.log("[Kidney Analysis] API called - using KDIGO 2024 guidelines");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await prisma.biomarkerResult.findMany({
      where: {
        userId: session.user.id,
        biomarkerId: { in: KIDNEY_BIOMARKER_IDS }
      },
      orderBy: { testedAt: "desc" },
      include: { biomarker: true }
    });

    const latestByBiomarker = new Map<string, typeof results[0]>();
    for (const r of results) {
      if (!latestByBiomarker.has(r.biomarkerId)) {
        latestByBiomarker.set(r.biomarkerId, r);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, dateOfBirth: true, firstName: true }
    });

    let age: number | null = null;
    if (user?.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    const userGender = user?.gender?.toUpperCase() === "FEMALE" ? "female" : "male";

    const biomarkerData: BiomarkerData[] = Array.from(latestByBiomarker.values()).map(r => {
      let ranges: { low?: number; optimal_low?: number; optimal_high?: number; high?: number } = {};
      try {
        const rangeField = userGender === "female" ? r.biomarker?.femaleRanges : r.biomarker?.maleRanges;
        if (rangeField) {
          ranges = typeof rangeField === "string" ? JSON.parse(rangeField) : rangeField as typeof ranges;
        }
      } catch {
        // Ignore parse errors
      }

      return {
        id: r.biomarkerId,
        name: r.biomarker?.name || r.biomarkerId,
        value: r.value,
        unit: r.biomarker?.unit || "",
        optimalMin: ranges.optimal_low,
        optimalMax: ranges.optimal_high,
        normalMin: ranges.low,
        normalMax: ranges.high,
        testedAt: r.testedAt.toISOString()
      };
    });

    if (biomarkerData.length === 0) {
      return NextResponse.json({
        error: "No kidney biomarker data available",
        message: "Please upload blood test results to enable AI analysis"
      }, { status: 404 });
    }

    // Date of the underlying results (most recent test) + staleness flag
    const dataDate = getDataDate(biomarkerData.map(b => b.testedAt));
    const resultsStale = isResultsStale(dataDate);

    const biomarkerHash = createBiomarkerHash(biomarkerData);

    // Return the saved analysis whenever the biomarker data is unchanged. A new
    // analysis is only generated when the underlying results change (i.e. a new
    // blood test is uploaded) — the report is never force-regenerated.
    {
      try {
        const cachedAnalysis = await prisma.aIAnalysisCache.findUnique({
          where: {
            userId_analysisType: {
              userId: session.user.id,
              analysisType: "kidney"
            }
          }
        });

        if (cachedAnalysis && cachedAnalysis.biomarkerHash === biomarkerHash) {
          console.log("[Kidney Analysis] Returning saved analysis for unchanged data");
          const cachedData = cachedAnalysis.analysisData as unknown as KidneyAnalysisResult;
          return NextResponse.json({
            ...cachedData,
            cached: true,
            dataDate,
            resultsStale
          });
        }
      } catch (cacheError) {
        console.error("[Kidney Analysis] Cache lookup error:", cacheError);
      }
    }

    console.log("[Kidney Analysis] Generating new scientific analysis...");
    console.log("[Kidney Analysis] Biomarkers:", biomarkerData.map(b => `${b.id}=${b.value}`).join(", "));

    // Build biomarker map for scientific calculations
    const biomarkerMap = new Map<string, number>();
    for (const b of biomarkerData) {
      biomarkerMap.set(b.id, b.value);
    }

    // ==================== SCIENTIFIC CKD STAGING ====================
    const eGFR = biomarkerMap.get("egfr");
    const uacr = biomarkerMap.get("uacr");
    const creatinine = biomarkerMap.get("creatinine");

    // Calculate GFR category
    const gfrCategory = eGFR !== undefined ? getGFRCategory(eGFR) : getGFRCategory(90); // Default to G1 if not available

    // Calculate Albuminuria category (if UACR available)
    const albuminuriaCategory = uacr !== undefined ? getAlbuminuriaCategory(uacr) : null;

    // Calculate CKD Heat Map Risk
    const overallCKDRisk = getCKDRiskFromHeatMap(
      gfrCategory.category,
      albuminuriaCategory?.category || "A1" // Default to A1 if UACR not available
    );

    // Calculate KFRE (Kidney Failure Risk Equation) for CKD stage 3-5
    let kfreResult: KFREResult | null = null;
    if (eGFR !== undefined && uacr !== undefined && age !== null) {
      kfreResult = calculateKFRE(eGFR, uacr, age, userGender);
    }

    // Assess electrolytes
    const electrolyteAssessment = assessElectrolytes(biomarkerMap);

    // Assess anemia
    const anemiaAssessment = assessAnemia(biomarkerMap, userGender);

    // Calculate overall risk score based on scientific factors
    let overallRiskScore = overallCKDRisk.riskScore;
    overallRiskScore += electrolyteAssessment.riskContribution * 0.3;
    overallRiskScore += anemiaAssessment.riskContribution * 0.3;
    if (kfreResult?.applicable && kfreResult.fiveYearRisk > 5) {
      overallRiskScore += Math.min(20, kfreResult.fiveYearRisk * 0.5);
    }
    overallRiskScore = Math.min(100, Math.round(overallRiskScore));

    // ==================== eGFR DECLINE CALCULATION ====================
    let eGFRDeclineResult: EGFRDeclineResult | null = null;
    if (eGFR !== undefined) {
      eGFRDeclineResult = await calculateEGFRDecline(session.user.id, eGFR);
      if (eGFRDeclineResult) {
        console.log("[Kidney Analysis] eGFR Decline:", eGFRDeclineResult);

        // Add to overall risk if rapid decline
        if (eGFRDeclineResult.isRapidProgression) {
          overallRiskScore = Math.min(100, overallRiskScore + 15);
        } else if (eGFRDeclineResult.trend === "moderate_decline") {
          overallRiskScore = Math.min(100, overallRiskScore + 8);
        }
      }
    }
    // ==================== END eGFR DECLINE ====================

    // Call Claude AI for personalized insights with scientific context
    const analysis = await analyzeWithClaude(biomarkerData, {
      gender: user?.gender || "UNKNOWN",
      age,
      firstName: user?.firstName || "User",
      gfrCategory,
      albuminuriaCategory,
      overallCKDRisk,
      kfreResult,
      electrolyteAssessment,
      anemiaAssessment,
      calculatedRiskScore: overallRiskScore
    });

    // Merge scientific staging with AI analysis
    const finalAnalysis: KidneyAnalysisResult = {
      ...analysis,
      overallRiskScore,
      ckdStage: {
        gfrCategory,
        albuminuriaCategory,
        overallRisk: overallCKDRisk,
        kfre: kfreResult
      },
      eGFRDecline: eGFRDeclineResult || undefined
    };

    // The saved analysis stays valid until the biomarker data changes, so use a
    // far-future expiry; invalidation is driven by the biomarker hash instead.
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    try {
      await prisma.aIAnalysisCache.upsert({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "kidney"
          }
        },
        update: {
          analysisData: finalAnalysis as object,
          biomarkerHash,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          analysisType: "kidney",
          analysisData: finalAnalysis as object,
          biomarkerHash,
          expiresAt
        }
      });

      const riskLevel = overallRiskScore < 20 ? "low" :
                        overallRiskScore < 40 ? "moderate" :
                        overallRiskScore < 60 ? "elevated" : "high";

      await prisma.aIAnalysisHistory.create({
        data: {
          userId: session.user.id,
          analysisType: "kidney",
          analysisData: finalAnalysis as object,
          overallScore: overallRiskScore,
          riskLevel,
          biomarkerCount: biomarkerData.length
        }
      });
    } catch (cacheError) {
      console.error("[Kidney Analysis] Failed to cache:", cacheError);
    }

    return NextResponse.json({
      ...finalAnalysis,
      cached: false,
      dataDate,
      resultsStale
    });

  } catch (error) {
    console.error("Kidney analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze kidney health" },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(
  biomarkers: BiomarkerData[],
  context: {
    gender: string;
    age: number | null;
    firstName: string;
    gfrCategory: GFRCategoryInfo;
    albuminuriaCategory: AlbuminuriaCategoryInfo | null;
    overallCKDRisk: CKDRiskInfo;
    kfreResult: KFREResult | null;
    electrolyteAssessment: ElectrolyteAssessment;
    anemiaAssessment: AnemiaAssessment;
    calculatedRiskScore: number;
  }
): Promise<Omit<KidneyAnalysisResult, "ckdStage">> {

  const biomarkerList = biomarkers.map(b => `${b.name}: ${b.value} ${b.unit}`).join(", ");

  const scientificContext = `
SCIENTIFIC CKD STAGING (KDIGO 2024 Guidelines):
- GFR Category: ${context.gfrCategory.category} (${context.gfrCategory.range} mL/min/1.73m²) - ${context.gfrCategory.description}
- Albuminuria: ${context.albuminuriaCategory ? `${context.albuminuriaCategory.category} (${context.albuminuriaCategory.range}) - ${context.albuminuriaCategory.description}` : "Not available"}
- KDIGO Heat Map Risk: ${context.overallCKDRisk.level.toUpperCase()} (${context.overallCKDRisk.color}) - ${context.overallCKDRisk.description}
- Monitoring: ${context.overallCKDRisk.monitoringFrequency}
${context.kfreResult?.applicable ? `- KFRE 5-Year Kidney Failure Risk: ${context.kfreResult.fiveYearRisk}%` : "- KFRE: Not applicable (eGFR ≥60)"}
- Electrolyte Status: ${context.electrolyteAssessment.status} ${context.electrolyteAssessment.findings.length > 0 ? `(${context.electrolyteAssessment.findings.join("; ")})` : ""}
- Anemia Status: ${context.anemiaAssessment.status} ${context.anemiaAssessment.findings.length > 0 ? `(${context.anemiaAssessment.findings.join("; ")})` : ""}
- Calculated Risk Score: ${context.calculatedRiskScore}/100`;

  const prompt = `You are a nephrology AI assistant analyzing kidney biomarkers using KDIGO 2024 Clinical Practice Guidelines.

PATIENT: ${context.age || "Adult"} year old ${context.gender?.toLowerCase() || "patient"}

BIOMARKERS: ${biomarkerList}

${scientificContext}

Based on the KDIGO classification above, provide personalized clinical insights. Your analysis should:
1. Explain what the CKD staging means for this patient
2. Identify key risk factors based on the biomarkers
3. Provide evidence-based recommendations

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "overallRiskScore": ${context.calculatedRiskScore},
  "previousOverallRisk": ${Math.max(0, context.calculatedRiskScore - 5)},
  "summary": "2-3 sentence clinical summary referencing the CKD stage and key findings",
  "riskFactors": [
    {
      "id": "ckd_staging",
      "name": "CKD Stage ${context.gfrCategory.category}",
      "category": "ckd_staging",
      "currentRisk": ${context.gfrCategory.riskScore},
      "previousRisk": ${Math.max(0, context.gfrCategory.riskScore - 5)},
      "trend": "stable",
      "contributingBiomarkers": [include relevant biomarkers with status],
      "timeToRisk": "${context.overallCKDRisk.monitoringFrequency}",
      "preventionPotential": number 0-100,
      "explanation": "Clinical explanation of GFR category ${context.gfrCategory.category}",
      "scientificBasis": "KDIGO 2024 CKD-EPI equation"
    }
  ],
  "predictions": [
    {
      "condition": "CKD condition based on staging",
      "probability": number based on KFRE if applicable,
      "timeframe": "5 years",
      "preventable": true/false,
      "keyFactors": ["list key factors"],
      "recommendations": ["evidence-based recommendations"]
    }
  ],
  "personalizedInsights": ["3 insights referencing KDIGO staging"],
  "urgentActions": [${context.overallCKDRisk.level === "very_high" ? '"Nephrology referral recommended"' : ""}],
  "lifestyleRecommendations": ["evidence-based lifestyle recommendations for CKD"]
}

Include 3-4 risk factors covering: CKD staging, electrolytes (if abnormal), anemia (if present), and progression risk.
Reference KDIGO guidelines in your explanations. Return ONLY valid JSON.`;

  console.log("[Kidney Analysis] Calling Claude API with KDIGO context...");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }]
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("AI response was truncated. Please try again.");
  }

  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    let jsonStr = textContent.text.trim();

    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1];
      if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[0];
      }
    } else if (jsonStr.includes("```")) {
      const parts = jsonStr.split("```");
      if (parts.length >= 2) {
        jsonStr = parts[1];
        if (jsonStr.startsWith("json")) {
          jsonStr = jsonStr.slice(4);
        }
      }
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysis = JSON.parse(jsonStr.trim());

    return {
      ...analysis,
      analyzedAt: new Date().toISOString()
    };
  } catch (parseError) {
    console.error("[Kidney Analysis] Parse error:", parseError);
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}
