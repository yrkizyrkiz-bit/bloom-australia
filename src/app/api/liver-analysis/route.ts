import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { getDataDate, isResultsStale } from "@/lib/ai-report-cache";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  category: "liver" | "metabolic" | "cardiovascular" | "inflammation";
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

interface LiverAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
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

/** Catalog IDs used by Sanative Essential / NSW labs (AU SI units). */
const LIVER_BIOMARKER_IDS = [
  "alt",
  "ast",
  "ggt",
  "alp",
  "bilirubin_total",
  "bilirubin_direct",
  "albumin",
  "total_protein",
  "globulin",
  "platelets",
  "inr",
  "ferritin",
  "glucose",
  "hba1c",
  "insulin",
  "total_cholesterol",
  "ldl_cholesterol",
  "hdl_cholesterol",
  "triglycerides",
  "crp",
  "homocysteine",
  "fib4",
  "apri",
  "ast_alt_ratio",
];

const LIVER_REPORT_TOOL = {
  name: "submit_liver_analysis",
  description: "Submit the structured liver health risk analysis.",
  input_schema: {
    type: "object",
    required: [
      "overallRiskScore",
      "previousOverallRisk",
      "summary",
      "riskFactors",
      "predictions",
      "personalizedInsights",
      "urgentActions",
      "lifestyleRecommendations",
    ],
    properties: {
      overallRiskScore: { type: "number" },
      previousOverallRisk: { type: "number" },
      summary: { type: "string" },
      riskFactors: { type: "array", items: { type: "object" } },
      predictions: { type: "array", items: { type: "object" } },
      personalizedInsights: { type: "array", items: { type: "string" } },
      urgentActions: { type: "array", items: { type: "string" } },
      lifestyleRecommendations: { type: "array", items: { type: "string" } },
    },
  },
} as const;

/**
 * Create a hash of biomarker data to detect changes
 * If biomarkers change, we need to regenerate the analysis
 */
function createBiomarkerHash(biomarkers: BiomarkerData[]): string {
  const sortedData = biomarkers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.id}:${b.value}:${b.testedAt}`)
    .join("|");

  return crypto.createHash("md5").update(sortedData).digest("hex");
}

function asLiverAnalysis(
  raw: Record<string, unknown>
): Omit<LiverAnalysisResult, "analyzedAt"> {
  const overallRiskScore = Number(raw.overallRiskScore);
  if (!Number.isFinite(overallRiskScore)) {
    throw new Error("Missing overallRiskScore in response");
  }
  return {
    overallRiskScore,
    previousOverallRisk: Number(raw.previousOverallRisk) || overallRiskScore,
    summary: String(raw.summary || ""),
    riskFactors: Array.isArray(raw.riskFactors) ? (raw.riskFactors as RiskFactor[]) : [],
    predictions: Array.isArray(raw.predictions) ? (raw.predictions as HealthPrediction[]) : [],
    personalizedInsights: Array.isArray(raw.personalizedInsights)
      ? (raw.personalizedInsights as string[])
      : [],
    urgentActions: Array.isArray(raw.urgentActions) ? (raw.urgentActions as string[]) : [],
    lifestyleRecommendations: Array.isArray(raw.lifestyleRecommendations)
      ? (raw.lifestyleRecommendations as string[])
      : [],
  };
}

/** Best-effort extract of a JSON object from free-text Claude output (fallback). */
function extractJsonObject(text: string): string {
  let jsonStr = text.trim();
  if (jsonStr.includes("```json")) {
    const parts = jsonStr.split("```json");
    if (parts.length > 1) jsonStr = parts[1].split("```")[0];
  } else if (jsonStr.includes("```")) {
    const parts = jsonStr.split("```");
    if (parts.length >= 2) {
      jsonStr = parts[1];
      if (jsonStr.startsWith("json")) jsonStr = jsonStr.slice(4);
    }
  }
  jsonStr = jsonStr.trim();
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }
  return jsonStr.trim();
}

export async function GET() {
  try {
    console.log("[Liver Analysis] API called");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("[Liver Analysis] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Liver Analysis] User:", session.user.id);

    const results = await prisma.biomarkerResult.findMany({
      where: {
        userId: session.user.id,
        biomarkerId: { in: LIVER_BIOMARKER_IDS },
      },
      orderBy: { testedAt: "desc" },
      include: {
        biomarker: true,
      },
    });

    const latestByBiomarker = new Map<string, (typeof results)[0]>();
    for (const r of results) {
      if (!latestByBiomarker.has(r.biomarkerId)) {
        latestByBiomarker.set(r.biomarkerId, r);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, dateOfBirth: true, firstName: true },
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

    const biomarkerData: BiomarkerData[] = Array.from(latestByBiomarker.values()).map((r) => {
      let ranges: {
        low?: number;
        optimal_low?: number;
        optimal_high?: number;
        high?: number;
      } = {};
      try {
        const rangeField =
          userGender === "female" ? r.biomarker?.femaleRanges : r.biomarker?.maleRanges;
        if (rangeField) {
          ranges =
            typeof rangeField === "string"
              ? (JSON.parse(rangeField) as typeof ranges)
              : (rangeField as typeof ranges);
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
        testedAt: r.testedAt.toISOString(),
      };
    });

    if (biomarkerData.length === 0) {
      return NextResponse.json(
        {
          error: "No liver biomarker data available",
          message: "Please upload blood test results to enable AI analysis",
        },
        { status: 404 }
      );
    }

    const dataDate = getDataDate(biomarkerData.map((b) => b.testedAt));
    const resultsStale = isResultsStale(dataDate);

    let biomarkerHash: string;
    try {
      biomarkerHash = createBiomarkerHash(biomarkerData);
      console.log("[Liver Analysis] Biomarker hash:", biomarkerHash);
    } catch (hashError) {
      console.error("[Liver Analysis] Hash creation error:", hashError);
      throw new Error(
        `Failed to create biomarker hash: ${hashError instanceof Error ? hashError.message : "Unknown error"}`
      );
    }

    try {
      const cachedAnalysis = await prisma.aIAnalysisCache.findUnique({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "liver",
          },
        },
      });

      if (cachedAnalysis && cachedAnalysis.biomarkerHash === biomarkerHash) {
        console.log("[Liver Analysis] Returning saved analysis for unchanged data");

        const cachedData = cachedAnalysis.analysisData as unknown as LiverAnalysisResult;
        return NextResponse.json({
          ...cachedData,
          cached: true,
          dataDate,
          resultsStale,
        });
      }
      console.log("[Liver Analysis] No saved analysis for current data");
    } catch (cacheError) {
      console.error("[Liver Analysis] Cache lookup error:", cacheError);
    }

    console.log("[Liver Analysis] Generating new AI analysis...");
    console.log("[Liver Analysis] Biomarker count:", biomarkerData.length);
    console.log(
      "[Liver Analysis] Biomarkers:",
      biomarkerData.map((b) => `${b.id}=${b.value}`).join(", ")
    );

    let analysis: LiverAnalysisResult;
    try {
      analysis = await analyzeWithClaude(biomarkerData, {
        gender: user?.gender || "UNKNOWN",
        age,
        firstName: user?.firstName || "User",
      });
    } catch (aiError) {
      console.error("[Liver Analysis] Claude AI error:", aiError);
      // Another concurrent request may have finished while we were generating.
      const raced = await prisma.aIAnalysisCache.findUnique({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "liver",
          },
        },
      });
      if (raced && raced.biomarkerHash === biomarkerHash) {
        console.log("[Liver Analysis] Using concurrent sibling cache after AI error");
        return NextResponse.json({
          ...(raced.analysisData as unknown as LiverAnalysisResult),
          cached: true,
          dataDate,
          resultsStale,
        });
      }
      throw new Error(
        `AI analysis failed: ${aiError instanceof Error ? aiError.message : "Unknown error"}`
      );
    }

    // Re-check cache in case a parallel request already saved the same hash.
    const sibling = await prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: {
          userId: session.user.id,
          analysisType: "liver",
        },
      },
    });
    if (sibling && sibling.biomarkerHash === biomarkerHash) {
      console.log("[Liver Analysis] Concurrent request already cached this hash");
      return NextResponse.json({
        ...(sibling.analysisData as unknown as LiverAnalysisResult),
        cached: true,
        dataDate,
        resultsStale,
      });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    try {
      await prisma.aIAnalysisCache.upsert({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "liver",
          },
        },
        update: {
          analysisData: analysis as object,
          biomarkerHash,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          analysisType: "liver",
          analysisData: analysis as object,
          biomarkerHash,
          expiresAt,
        },
      });
      console.log("[Liver Analysis] Analysis cached until", expiresAt.toISOString());

      const riskLevel =
        analysis.overallRiskScore < 20
          ? "low"
          : analysis.overallRiskScore < 40
            ? "moderate"
            : analysis.overallRiskScore < 60
              ? "elevated"
              : "high";

      await prisma.aIAnalysisHistory.create({
        data: {
          userId: session.user.id,
          analysisType: "liver",
          analysisData: analysis as object,
          overallScore: analysis.overallRiskScore,
          riskLevel,
          biomarkerCount: biomarkerData.length,
        },
      });
      console.log("[Liver Analysis] Analysis saved to history");
    } catch (cacheError) {
      console.error("[Liver Analysis] Failed to cache analysis:", cacheError);
    }

    return NextResponse.json({
      ...analysis,
      cached: false,
      dataDate,
      resultsStale,
    });
  } catch (error) {
    console.error("Liver analysis error:", error);

    let errorMessage = "Failed to analyze liver health";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Error details:", error.stack);
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function analyzeWithClaude(
  biomarkers: BiomarkerData[],
  userContext: { gender: string; age: number | null; firstName: string }
): Promise<LiverAnalysisResult> {
  const biomarkerList = biomarkers.map((b) => `${b.name}: ${b.value} ${b.unit}`).join(", ");

  const prompt = `Analyze liver biomarkers for ${userContext.firstName}, a ${userContext.age || "adult"} year old ${userContext.gender?.toLowerCase() || "patient"} (Australian SI units).

BIOMARKERS: ${biomarkerList}

Provide a concise liver health risk analysis:
- 2-3 risk factors and 2 predictions
- Plain language; educational only, not a diagnosis
- Australian GP follow-up where appropriate

Submit via the submit_liver_analysis tool only.`;

  console.log("[Liver Analysis] Calling Claude API (tool_use)...");

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [LIVER_REPORT_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: "submit_liver_analysis" },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  console.log("[Liver Analysis] Claude API response received, stop_reason:", response.stop_reason);

  if (response.stop_reason === "max_tokens") {
    console.error("[Liver Analysis] Response was truncated!");
    throw new Error("AI response was truncated. Please try again.");
  }

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_liver_analysis"
  );

  if (toolUse && toolUse.type === "tool_use") {
    const analysis = asLiverAnalysis(toolUse.input as Record<string, unknown>);
    return {
      ...analysis,
      analyzedAt: new Date().toISOString(),
    };
  }

  // Fallback: some models return free-text JSON despite tool_choice
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude did not return a structured liver analysis");
  }

  try {
    const jsonStr = extractJsonObject(textContent.text);
    console.log("[Liver Analysis] Fallback text JSON length:", jsonStr.length);
    if (!jsonStr.startsWith("{")) {
      throw new Error("AI response is not valid JSON");
    }
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const analysis = asLiverAnalysis(parsed);
    return {
      ...analysis,
      analyzedAt: new Date().toISOString(),
    };
  } catch (parseError) {
    console.error("[Liver Analysis] Failed to parse Claude response:");
    console.error("[Liver Analysis] Error:", parseError);
    console.error("[Liver Analysis] Raw text:", textContent.text.substring(0, 1000));
    const detail = parseError instanceof Error ? parseError.message : "Unknown parse error";
    throw new Error(`AI analysis parsing failed (${detail}). Please try again.`);
  }
}
