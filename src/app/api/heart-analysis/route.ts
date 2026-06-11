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

// ==================== ASCVD RISK CALCULATOR ====================
// Based on 2013 ACC/AHA Pooled Cohort Equations
// Reference: Goff DC Jr, et al. Circulation. 2014;129(25 Suppl 2):S49-S73

interface ASCVDInput {
  age: number;
  sex: "male" | "female";
  race: "white" | "african_american" | "other";
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number; // mg/dL
  systolicBP: number; // mmHg
  onBPMeds: boolean;
  diabetes: boolean;
  smoker: boolean;
}

interface ASCVDResult {
  tenYearRisk: number; // percentage
  lifetimeRisk: number; // percentage (estimated)
  riskCategory: "low" | "borderline" | "intermediate" | "high";
  optimal10YearRisk: number; // same age with optimal risk factors
  heartAge: number; // estimated heart age based on risk
  applicable: boolean;
  reason?: string;
  // Data source tracking for UI display
  dataSource?: {
    bloodPressure: "measured" | "estimated";
    smoking: "reported" | "assumed_non_smoker";
    race: "reported" | "default_white";
  };
  // Input values used for calculation
  inputValues?: {
    systolicBP: number;
    onBPMeds: boolean;
    smoker: boolean;
    race: string;
  };
}

function calculateASCVD(input: ASCVDInput): ASCVDResult {
  // ASCVD calculator is validated for ages 40-79
  if (input.age < 40 || input.age > 79) {
    return {
      tenYearRisk: 0,
      lifetimeRisk: 0,
      riskCategory: "low",
      optimal10YearRisk: 0,
      heartAge: input.age,
      applicable: false,
      reason: input.age < 40
        ? "ASCVD calculator is validated for ages 40-79. Consider lifetime risk assessment."
        : "ASCVD calculator is validated for ages 40-79."
    };
  }

  // Pooled Cohort Equations coefficients
  // White Female coefficients
  const whiteFemaleLn = {
    lnAge: -29.799,
    lnAgeSq: 4.884,
    lnTC: 13.540,
    lnAgeLnTC: -3.114,
    lnHDL: -13.578,
    lnAgeLnHDL: 3.149,
    lnTreatedSBP: 2.019,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.957,
    lnAgeLnUntreatedSBP: 0,
    smoker: 7.574,
    lnAgeSmoker: -1.665,
    diabetes: 0.661,
    baseline: 0.96652,
    meanCoeff: -29.18
  };

  // White Male coefficients
  const whiteMaleLn = {
    lnAge: 12.344,
    lnAgeSq: 0,
    lnTC: 11.853,
    lnAgeLnTC: -2.664,
    lnHDL: -7.990,
    lnAgeLnHDL: 1.769,
    lnTreatedSBP: 1.797,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.764,
    lnAgeLnUntreatedSBP: 0,
    smoker: 7.837,
    lnAgeSmoker: -1.795,
    diabetes: 0.658,
    baseline: 0.91436,
    meanCoeff: 61.18
  };

  // African American Female coefficients
  const aaFemaleLn = {
    lnAge: 17.114,
    lnAgeSq: 0,
    lnTC: 0.940,
    lnAgeLnTC: 0,
    lnHDL: -18.920,
    lnAgeLnHDL: 4.475,
    lnTreatedSBP: 29.291,
    lnAgeLnTreatedSBP: -6.432,
    lnUntreatedSBP: 27.820,
    lnAgeLnUntreatedSBP: -6.087,
    smoker: 0.691,
    lnAgeSmoker: 0,
    diabetes: 0.874,
    baseline: 0.95334,
    meanCoeff: 86.61
  };

  // African American Male coefficients
  const aaMaleLn = {
    lnAge: 2.469,
    lnAgeSq: 0,
    lnTC: 0.302,
    lnAgeLnTC: 0,
    lnHDL: -0.307,
    lnAgeLnHDL: 0,
    lnTreatedSBP: 1.916,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.809,
    lnAgeLnUntreatedSBP: 0,
    smoker: 0.549,
    lnAgeSmoker: 0,
    diabetes: 0.645,
    baseline: 0.89536,
    meanCoeff: 19.54
  };

  // Select appropriate coefficients
  const isAA = input.race === "african_american";
  const isMale = input.sex === "male";

  let coeff;
  if (isAA && isMale) coeff = aaMaleLn;
  else if (isAA && !isMale) coeff = aaFemaleLn;
  else if (!isAA && isMale) coeff = whiteMaleLn;
  else coeff = whiteFemaleLn;

  // Calculate individual sum
  const lnAge = Math.log(input.age);
  const lnTC = Math.log(input.totalCholesterol);
  const lnHDL = Math.log(input.hdlCholesterol);
  const lnSBP = Math.log(input.systolicBP);

  let individualSum =
    coeff.lnAge * lnAge +
    coeff.lnAgeSq * Math.pow(lnAge, 2) +
    coeff.lnTC * lnTC +
    coeff.lnAgeLnTC * lnAge * lnTC +
    coeff.lnHDL * lnHDL +
    coeff.lnAgeLnHDL * lnAge * lnHDL;

  if (input.onBPMeds) {
    individualSum += coeff.lnTreatedSBP * lnSBP;
    individualSum += coeff.lnAgeLnTreatedSBP * lnAge * lnSBP;
  } else {
    individualSum += coeff.lnUntreatedSBP * lnSBP;
    individualSum += coeff.lnAgeLnUntreatedSBP * lnAge * lnSBP;
  }

  if (input.smoker) {
    individualSum += coeff.smoker;
    individualSum += coeff.lnAgeSmoker * lnAge;
  }

  if (input.diabetes) {
    individualSum += coeff.diabetes;
  }

  // Calculate 10-year risk
  const tenYearRisk = (1 - Math.pow(coeff.baseline, Math.exp(individualSum - coeff.meanCoeff))) * 100;

  // Calculate optimal 10-year risk (same age, optimal factors)
  const optimalInput: ASCVDInput = {
    ...input,
    totalCholesterol: 170, // optimal TC
    hdlCholesterol: 50, // optimal HDL
    systolicBP: 110, // optimal SBP
    onBPMeds: false,
    diabetes: false,
    smoker: false
  };

  const optimalSum =
    coeff.lnAge * lnAge +
    coeff.lnAgeSq * Math.pow(lnAge, 2) +
    coeff.lnTC * Math.log(170) +
    coeff.lnAgeLnTC * lnAge * Math.log(170) +
    coeff.lnHDL * Math.log(50) +
    coeff.lnAgeLnHDL * lnAge * Math.log(50) +
    coeff.lnUntreatedSBP * Math.log(110) +
    coeff.lnAgeLnUntreatedSBP * lnAge * Math.log(110);

  const optimal10YearRisk = (1 - Math.pow(coeff.baseline, Math.exp(optimalSum - coeff.meanCoeff))) * 100;

  // Calculate heart age (age at which optimal risk equals current risk)
  let heartAge = input.age;
  for (let testAge = 40; testAge <= 80; testAge++) {
    const testLnAge = Math.log(testAge);
    const testSum =
      coeff.lnAge * testLnAge +
      coeff.lnAgeSq * Math.pow(testLnAge, 2) +
      coeff.lnTC * Math.log(170) +
      coeff.lnAgeLnTC * testLnAge * Math.log(170) +
      coeff.lnHDL * Math.log(50) +
      coeff.lnAgeLnHDL * testLnAge * Math.log(50) +
      coeff.lnUntreatedSBP * Math.log(110) +
      coeff.lnAgeLnUntreatedSBP * testLnAge * Math.log(110);

    const testRisk = (1 - Math.pow(coeff.baseline, Math.exp(testSum - coeff.meanCoeff))) * 100;
    if (testRisk >= tenYearRisk) {
      heartAge = testAge;
      break;
    }
  }

  // Estimate lifetime risk (simplified)
  let lifetimeRisk = 0;
  if (input.age < 60) {
    // Simplified lifetime risk based on risk factors
    const riskFactorCount = [
      input.totalCholesterol >= 240,
      input.hdlCholesterol < 40,
      input.systolicBP >= 140,
      input.diabetes,
      input.smoker
    ].filter(Boolean).length;

    if (riskFactorCount === 0) lifetimeRisk = isMale ? 5 : 8;
    else if (riskFactorCount === 1) lifetimeRisk = isMale ? 36 : 27;
    else lifetimeRisk = isMale ? 50 : 39;
  } else {
    lifetimeRisk = tenYearRisk * 2; // Rough estimate
  }

  // Determine risk category
  let riskCategory: "low" | "borderline" | "intermediate" | "high";
  if (tenYearRisk < 5) riskCategory = "low";
  else if (tenYearRisk < 7.5) riskCategory = "borderline";
  else if (tenYearRisk < 20) riskCategory = "intermediate";
  else riskCategory = "high";

  return {
    tenYearRisk: Math.round(tenYearRisk * 10) / 10,
    lifetimeRisk: Math.round(lifetimeRisk),
    riskCategory,
    optimal10YearRisk: Math.round(optimal10YearRisk * 10) / 10,
    heartAge: Math.round(heartAge),
    applicable: true
  };
}

// ==================== END ASCVD CALCULATOR ====================

interface RiskFactor {
  id: string;
  name: string;
  category: "cardiovascular" | "metabolic" | "lipid" | "inflammation";
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
}

interface HealthPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

interface HeartAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  ascvdRisk?: ASCVDResult;
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

// Heart-related biomarker IDs
const HEART_BIOMARKER_IDS = [
  "total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides",
  "non_hdl_cholesterol", "vldl", "apob", "lpa",
  "crp", "homocysteine", "fibrinogen",
  "glucose", "hba1c", "insulin",
  "sodium", "potassium", "magnesium",
  "hemoglobin", "hematocrit", "rbc"
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
    console.log("[Heart Analysis] API called - using ASCVD Pooled Cohort Equations");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await prisma.biomarkerResult.findMany({
      where: {
        userId: session.user.id,
        biomarkerId: { in: HEART_BIOMARKER_IDS }
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
        error: "No heart biomarker data available",
        message: "Please upload blood test results to enable AI analysis"
      }, { status: 404 });
    }

    // Date of the underlying results (most recent test) + staleness flag
    const dataDate = getDataDate(biomarkerData.map(b => b.testedAt));
    const resultsStale = isResultsStale(dataDate);

    // Heart analysis also depends on the editable health profile (BP, smoking,
    // race, etc.), so fold it into the cache key — changing the profile counts
    // as changed data and produces an updated report.
    const healthProfile = await prisma.healthProfile.findUnique({
      where: { userId: session.user.id }
    });
    const profileKey = JSON.stringify({
      systolicBP: healthProfile?.systolicBP ?? null,
      diastolicBP: healthProfile?.diastolicBP ?? null,
      onBPMedication: healthProfile?.onBPMedication ?? null,
      smokingStatus: healthProfile?.smokingStatus ?? null,
      race: healthProfile?.race ?? null,
      familyHistoryCVD: healthProfile?.familyHistoryCVD ?? null
    });
    const biomarkerHash = crypto
      .createHash("md5")
      .update(`${createBiomarkerHash(biomarkerData)}|${profileKey}`)
      .digest("hex");

    // Return the saved analysis whenever the biomarker data is unchanged. A new
    // analysis is only generated when the underlying results change (i.e. a new
    // blood test is uploaded) — the report is never force-regenerated.
    let cachedAnalysis: { biomarkerHash: string; analysisData: unknown } | null = null;
    {
      try {
        cachedAnalysis = await prisma.aIAnalysisCache.findUnique({
          where: {
            userId_analysisType: {
              userId: session.user.id,
              analysisType: "heart"
            }
          }
        });

        if (cachedAnalysis && cachedAnalysis.biomarkerHash === biomarkerHash) {
          console.log("[Heart Analysis] Returning saved analysis for unchanged data");
          const cachedData = cachedAnalysis.analysisData as unknown as HeartAnalysisResult;
          return NextResponse.json({
            ...cachedData,
            cached: true,
            dataDate,
            resultsStale
          });
        }
      } catch (cacheError) {
        console.error("[Heart Analysis] Cache lookup error:", cacheError);
      }
    }

    console.log("[Heart Analysis] Generating new scientific analysis...");
    console.log("[Heart Analysis] Biomarkers:", biomarkerData.map(b => `${b.id}=${b.value}`).join(", "));

    if (healthProfile) {
      console.log("[Heart Analysis] Health profile found:", {
        systolicBP: healthProfile.systolicBP,
        onBPMeds: healthProfile.onBPMedication,
        smoking: healthProfile.smokingStatus,
        race: healthProfile.race
      });
    }

    // Build biomarker map for ASCVD calculation
    const biomarkerMap = new Map<string, number>();
    for (const b of biomarkerData) {
      biomarkerMap.set(b.id, b.value);
    }

    // ==================== ASCVD CALCULATION ====================
    // Convert Australian units to US units for ASCVD calculator
    // Total Cholesterol: mmol/L to mg/dL (multiply by 38.67)
    // HDL: mmol/L to mg/dL (multiply by 38.67)
    const totalCholesterol = biomarkerMap.get("total_cholesterol");
    const hdlCholesterol = biomarkerMap.get("hdl_cholesterol");

    let ascvdResult: ASCVDResult | null = null;

    if (totalCholesterol !== undefined && hdlCholesterol !== undefined && age !== null) {
      // Convert from mmol/L to mg/dL
      const tcMgDl = totalCholesterol * 38.67;
      const hdlMgDl = hdlCholesterol * 38.67;

      // Check for diabetes via HbA1c or glucose
      const hba1c = biomarkerMap.get("hba1c");
      const glucose = biomarkerMap.get("glucose");
      const hasDiabetes = (hba1c !== undefined && hba1c >= 6.5) || (glucose !== undefined && glucose >= 7.0);

      // Map race from database enum to ASCVD calculator format
      let ascvdRace: "white" | "african_american" | "other" = "white";
      if (healthProfile?.race === "AFRICAN_AMERICAN") {
        ascvdRace = "african_american";
      } else if (healthProfile?.race && healthProfile.race !== "WHITE") {
        ascvdRace = "other";
      }

      // Determine smoking status
      const isSmoker = healthProfile?.smokingStatus === "CURRENT";

      // Use health profile BP if available, otherwise use defaults
      const systolicBP = healthProfile?.systolicBP || 120;
      const onBPMeds = healthProfile?.onBPMedication || false;

      // Build ASCVD input with actual patient data
      const ascvdInput: ASCVDInput = {
        age,
        sex: userGender,
        race: ascvdRace,
        totalCholesterol: tcMgDl,
        hdlCholesterol: hdlMgDl,
        systolicBP,
        onBPMeds,
        diabetes: hasDiabetes,
        smoker: isSmoker
      };

      ascvdResult = calculateASCVD(ascvdInput);

      // Add info about data sources and input values used
      ascvdResult = {
        ...ascvdResult,
        dataSource: {
          bloodPressure: healthProfile?.systolicBP ? "measured" : "estimated",
          smoking: healthProfile?.smokingStatus ? "reported" : "assumed_non_smoker",
          race: healthProfile?.race ? "reported" : "default_white"
        },
        inputValues: {
          systolicBP,
          onBPMeds,
          smoker: isSmoker,
          race: ascvdRace
        }
      };

      console.log("[Heart Analysis] ASCVD Result:", ascvdResult);
    }

    // ==================== END ASCVD CALCULATION ====================

    const analysis = await analyzeWithClaude(biomarkerData, {
      gender: user?.gender || "UNKNOWN",
      age,
      firstName: user?.firstName || "User",
      ascvdResult
    });

    // Merge ASCVD result with AI analysis
    const finalAnalysis: HeartAnalysisResult = {
      ...analysis,
      ascvdRisk: ascvdResult || undefined
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
            analysisType: "heart"
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
          analysisType: "heart",
          analysisData: finalAnalysis as object,
          biomarkerHash,
          expiresAt
        }
      });

      const riskLevel = finalAnalysis.overallRiskScore < 20 ? "low" :
                        finalAnalysis.overallRiskScore < 40 ? "moderate" :
                        finalAnalysis.overallRiskScore < 60 ? "elevated" : "high";

      if (!cachedAnalysis || cachedAnalysis.biomarkerHash !== biomarkerHash) {
        await prisma.aIAnalysisHistory.create({
          data: {
            userId: session.user.id,
            analysisType: "heart",
            analysisData: finalAnalysis as object,
            overallScore: finalAnalysis.overallRiskScore,
            riskLevel,
            biomarkerCount: biomarkerData.length
          }
        });
      }
    } catch (cacheError) {
      console.error("[Heart Analysis] Failed to cache:", cacheError);
    }

    return NextResponse.json({
      ...finalAnalysis,
      cached: false,
      dataDate,
      resultsStale
    });

  } catch (error) {
    console.error("Heart analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze heart health" },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(
  biomarkers: BiomarkerData[],
  userContext: { gender: string; age: number | null; firstName: string; ascvdResult: ASCVDResult | null }
): Promise<Omit<HeartAnalysisResult, "ascvdRisk">> {

  const biomarkerList = biomarkers.map(b => `${b.name}: ${b.value} ${b.unit}`).join(", ");

  const ascvdContext = userContext.ascvdResult?.applicable
    ? `
ASCVD RISK CALCULATION (Pooled Cohort Equations):
- 10-Year ASCVD Risk: ${userContext.ascvdResult.tenYearRisk}%
- Risk Category: ${userContext.ascvdResult.riskCategory.toUpperCase()}
- Optimal 10-Year Risk: ${userContext.ascvdResult.optimal10YearRisk}%
- Estimated Heart Age: ${userContext.ascvdResult.heartAge} years
- Lifetime Risk: ~${userContext.ascvdResult.lifetimeRisk}%`
    : `
ASCVD Risk: ${userContext.ascvdResult?.reason || "Not calculated - missing required data"}`;

  const prompt = `Analyze cardiovascular biomarkers for a ${userContext.age || "adult"} year old ${userContext.gender?.toLowerCase() || "patient"}.

BIOMARKERS: ${biomarkerList}

${ascvdContext}

Focus on cardiovascular health assessment including:
- Coronary heart disease risk
- Stroke risk
- Atherosclerosis progression
- Metabolic syndrome indicators
- Lipid profile analysis
- Inflammation markers

IMPORTANT: Reference the ASCVD 10-year risk calculation in your analysis if available.

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "overallRiskScore": number 0-100,
  "previousOverallRisk": number 0-100,
  "summary": "2-3 sentence summary focusing on heart health and ASCVD risk if available",
  "riskFactors": [
    {
      "id": "string",
      "name": "condition name",
      "category": "cardiovascular|metabolic|lipid|inflammation",
      "currentRisk": number 0-100,
      "previousRisk": number 0-100,
      "trend": "improving|stable|worsening",
      "contributingBiomarkers": [{"name": "string", "value": number, "unit": "string", "status": "optimal|borderline|elevated|critical", "impact": number}],
      "timeToRisk": "string",
      "preventionPotential": number 0-100,
      "explanation": "brief explanation"
    }
  ],
  "predictions": [
    {
      "condition": "string",
      "probability": number 0-100,
      "timeframe": "string",
      "preventable": boolean,
      "keyFactors": ["string"],
      "recommendations": ["string"]
    }
  ],
  "personalizedInsights": ["insight1", "insight2", "insight3"],
  "urgentActions": [],
  "lifestyleRecommendations": ["rec1", "rec2", "rec3"]
}

Include 3-4 risk factors covering coronary disease, stroke, metabolic syndrome, and lipid abnormalities.
Include 2-3 predictions for cardiovascular conditions.
Keep responses concise. Return ONLY valid JSON.`;

  console.log("[Heart Analysis] Calling Claude API with ASCVD context...");

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

    const analysis = JSON.parse(jsonStr.trim()) as Omit<HeartAnalysisResult, "analyzedAt" | "ascvdRisk">;

    return {
      ...analysis,
      analyzedAt: new Date().toISOString()
    };
  } catch (parseError) {
    console.error("[Heart Analysis] Parse error:", parseError);
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}
