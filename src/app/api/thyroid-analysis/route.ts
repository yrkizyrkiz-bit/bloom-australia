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

interface RiskFactor {
  id: string;
  name: string;
  category: "hypothyroid" | "hyperthyroid" | "autoimmune" | "metabolic";
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

interface ThyroidAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  thyroidStatus: string;
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

// Thyroid-related biomarker IDs
const THYROID_BIOMARKER_IDS = [
  "tsh", "free_t4", "free_t3", "total_t4", "total_t3",
  "reverse_t3", "tpo_antibodies", "thyroglobulin_antibodies",
  "thyroglobulin", "calcitonin",
  "iodine", "selenium", "zinc",
  "cortisol", "dhea_s",
  "vitamin_d", "vitamin_b12", "iron", "ferritin"
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
    console.log("[Thyroid Analysis] API called");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await prisma.biomarkerResult.findMany({
      where: {
        userId: session.user.id,
        biomarkerId: { in: THYROID_BIOMARKER_IDS }
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
        error: "No thyroid biomarker data available",
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
              analysisType: "thyroid"
            }
          }
        });

        if (cachedAnalysis && cachedAnalysis.biomarkerHash === biomarkerHash) {
          console.log("[Thyroid Analysis] Returning saved analysis for unchanged data");
          const cachedData = cachedAnalysis.analysisData as unknown as ThyroidAnalysisResult;
          return NextResponse.json({
            ...cachedData,
            cached: true,
            dataDate,
            resultsStale
          });
        }
      } catch (cacheError) {
        console.error("[Thyroid Analysis] Cache lookup error:", cacheError);
      }
    }

    console.log("[Thyroid Analysis] Generating new AI analysis...");
    console.log("[Thyroid Analysis] Biomarkers:", biomarkerData.map(b => `${b.id}=${b.value}`).join(", "));

    const analysis = await analyzeWithClaude(biomarkerData, {
      gender: user?.gender || "UNKNOWN",
      age,
      firstName: user?.firstName || "User"
    });

    // The saved analysis stays valid until the biomarker data changes, so use a
    // far-future expiry; invalidation is driven by the biomarker hash instead.
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    try {
      await prisma.aIAnalysisCache.upsert({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "thyroid"
          }
        },
        update: {
          analysisData: analysis as object,
          biomarkerHash,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          analysisType: "thyroid",
          analysisData: analysis as object,
          biomarkerHash,
          expiresAt
        }
      });

      const riskLevel = analysis.overallRiskScore < 20 ? "low" :
                        analysis.overallRiskScore < 40 ? "moderate" :
                        analysis.overallRiskScore < 60 ? "elevated" : "high";

      await prisma.aIAnalysisHistory.create({
        data: {
          userId: session.user.id,
          analysisType: "thyroid",
          analysisData: analysis as object,
          overallScore: analysis.overallRiskScore,
          riskLevel,
          biomarkerCount: biomarkerData.length
        }
      });
    } catch (cacheError) {
      console.error("[Thyroid Analysis] Failed to cache:", cacheError);
    }

    return NextResponse.json({
      ...analysis,
      cached: false,
      dataDate,
      resultsStale
    });

  } catch (error) {
    console.error("Thyroid analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze thyroid health" },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(
  biomarkers: BiomarkerData[],
  userContext: { gender: string; age: number | null; firstName: string }
): Promise<ThyroidAnalysisResult> {

  const biomarkerList = biomarkers.map(b => `${b.name}: ${b.value} ${b.unit}`).join(", ");

  const prompt = `Analyze thyroid biomarkers for a ${userContext.age || "adult"} year old ${userContext.gender?.toLowerCase() || "patient"}.

BIOMARKERS: ${biomarkerList}

Focus on thyroid health assessment including:
- Hypothyroidism risk (underactive thyroid)
- Hyperthyroidism risk (overactive thyroid)
- Autoimmune thyroid conditions (Hashimoto's, Graves')
- Thyroid hormone conversion efficiency
- T3/T4 balance
- Supporting nutrients (selenium, iodine, zinc, iron)

Determine thyroidStatus as one of: "Normal", "Possible Hypothyroidism", "Possible Hyperthyroidism", "Subclinical Hypothyroidism", "Subclinical Hyperthyroidism", "Autoimmune Thyroiditis Risk"

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "overallRiskScore": number 0-100,
  "previousOverallRisk": number 0-100,
  "summary": "2-3 sentence summary focusing on thyroid health",
  "thyroidStatus": "status string",
  "riskFactors": [
    {
      "id": "string",
      "name": "condition name",
      "category": "hypothyroid|hyperthyroid|autoimmune|metabolic",
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

Include 2-3 risk factors covering hypothyroidism, hyperthyroidism, and autoimmune/metabolic factors.
Include 2-3 predictions for thyroid conditions.
Keep responses concise. Return ONLY valid JSON.`;

  console.log("[Thyroid Analysis] Calling Claude API...");

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

    const analysis = JSON.parse(jsonStr.trim()) as Omit<ThyroidAnalysisResult, "analyzedAt">;

    return {
      ...analysis,
      analyzedAt: new Date().toISOString()
    };
  } catch (parseError) {
    console.error("[Thyroid Analysis] Parse error:", parseError);
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}
