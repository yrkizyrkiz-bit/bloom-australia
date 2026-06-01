import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Cache duration: 24 hours
const CACHE_DURATION_HOURS = 24;

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
}

// Liver-related biomarker IDs
const LIVER_BIOMARKER_IDS = [
  "alt", "ast", "ggt", "alp",
  "bilirubin_total", "bilirubin_direct",
  "albumin", "total_protein", "globulin",
  "platelets", "inr", "ferritin",
  "glucose", "hba1c", "insulin",
  "cholesterol_total", "ldl", "hdl", "triglycerides",
  "crp", "homocysteine"
];

/**
 * Create a hash of biomarker data to detect changes
 * If biomarkers change, we need to regenerate the analysis
 */
function createBiomarkerHash(biomarkers: BiomarkerData[]): string {
  const sortedData = biomarkers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(b => `${b.id}:${b.value}:${b.testedAt}`)
    .join("|");

  return crypto.createHash("md5").update(sortedData).digest("hex");
}

export async function GET(request: Request) {
  try {
    console.log("[Liver Analysis] API called");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("[Liver Analysis] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Liver Analysis] User:", session.user.id);

    // Check if refresh is requested
    let forceRefresh = false;
    try {
      // Handle both full URLs and relative paths
      const urlString = request.url;
      if (urlString.includes("?")) {
        const queryString = urlString.split("?")[1];
        const params = new URLSearchParams(queryString);
        forceRefresh = params.get("refresh") === "true";
      }
    } catch (urlError) {
      console.log("[Liver Analysis] URL parsing failed:", urlError);
    }

    // Get the user's latest liver-related biomarkers
    const results = await prisma.biomarkerResult.findMany({
      where: {
        userId: session.user.id,
        biomarkerId: { in: LIVER_BIOMARKER_IDS }
      },
      orderBy: { testedAt: "desc" },
      include: {
        biomarker: true
      }
    });

    // Get latest value for each biomarker
    const latestByBiomarker = new Map<string, typeof results[0]>();
    for (const r of results) {
      if (!latestByBiomarker.has(r.biomarkerId)) {
        latestByBiomarker.set(r.biomarkerId, r);
      }
    }

    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, dateOfBirth: true, firstName: true }
    });

    // Calculate age
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

    // Get user gender for appropriate ranges
    const userGender = user?.gender?.toUpperCase() === "FEMALE" ? "female" : "male";

    // Format biomarkers for AI analysis
    const biomarkerData: BiomarkerData[] = Array.from(latestByBiomarker.values()).map(r => {
      // Parse the gender-specific ranges from JSON
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
        error: "No liver biomarker data available",
        message: "Please upload blood test results to enable AI analysis"
      }, { status: 404 });
    }

    // Create hash of current biomarker data
    let biomarkerHash: string;
    try {
      biomarkerHash = createBiomarkerHash(biomarkerData);
      console.log("[Liver Analysis] Biomarker hash:", biomarkerHash);
    } catch (hashError) {
      console.error("[Liver Analysis] Hash creation error:", hashError);
      throw new Error(`Failed to create biomarker hash: ${hashError instanceof Error ? hashError.message : "Unknown error"}`);
    }

    // Check for cached analysis (unless force refresh requested)
    if (!forceRefresh) {
      try {
        const cachedAnalysis = await prisma.aIAnalysisCache.findUnique({
          where: {
            userId_analysisType: {
              userId: session.user.id,
              analysisType: "liver"
            }
          }
        });

        // Return cached data if valid
        if (cachedAnalysis &&
            cachedAnalysis.biomarkerHash === biomarkerHash &&
            cachedAnalysis.expiresAt > new Date()) {

          console.log("[Liver Analysis] Returning cached analysis");

          const cachedData = cachedAnalysis.analysisData as unknown as LiverAnalysisResult;
          return NextResponse.json({
            ...cachedData,
            cached: true,
            cacheExpiresAt: cachedAnalysis.expiresAt.toISOString()
          });
        }
        console.log("[Liver Analysis] No valid cache found");
      } catch (cacheError) {
        console.error("[Liver Analysis] Cache lookup error:", cacheError);
        // Continue without cache if there's an error
      }
    }

    console.log("[Liver Analysis] Generating new AI analysis...");
    console.log("[Liver Analysis] Biomarker count:", biomarkerData.length);
    console.log("[Liver Analysis] Biomarkers:", biomarkerData.map(b => `${b.id}=${b.value}`).join(", "));

    // Call Claude AI for analysis
    let analysis: LiverAnalysisResult;
    try {
      analysis = await analyzeWithClaude(biomarkerData, {
        gender: user?.gender || "UNKNOWN",
        age,
        firstName: user?.firstName || "User"
      });
    } catch (aiError) {
      console.error("[Liver Analysis] Claude AI error:", aiError);
      throw new Error(`AI analysis failed: ${aiError instanceof Error ? aiError.message : "Unknown error"}`);
    }

    // Cache the analysis
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

    try {
      // Save to cache
      await prisma.aIAnalysisCache.upsert({
        where: {
          userId_analysisType: {
            userId: session.user.id,
            analysisType: "liver"
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
          analysisType: "liver",
          analysisData: analysis as object,
          biomarkerHash,
          expiresAt
        }
      });
      console.log("[Liver Analysis] Analysis cached until", expiresAt.toISOString());

      // Save to history
      const riskLevel = analysis.overallRiskScore < 20 ? "low" :
                        analysis.overallRiskScore < 40 ? "moderate" :
                        analysis.overallRiskScore < 60 ? "elevated" : "high";

      await prisma.aIAnalysisHistory.create({
        data: {
          userId: session.user.id,
          analysisType: "liver",
          analysisData: analysis as object,
          overallScore: analysis.overallRiskScore,
          riskLevel,
          biomarkerCount: biomarkerData.length
        }
      });
      console.log("[Liver Analysis] Analysis saved to history");
    } catch (cacheError) {
      console.error("[Liver Analysis] Failed to cache analysis:", cacheError);
      // Continue without caching - we still have the analysis to return
    }

    return NextResponse.json({
      ...analysis,
      cached: false,
      cacheExpiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error("Liver analysis error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to analyze liver health";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Error details:", error.stack);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(
  biomarkers: BiomarkerData[],
  userContext: { gender: string; age: number | null; firstName: string }
): Promise<LiverAnalysisResult> {

  // Format biomarker data concisely
  const biomarkerList = biomarkers.map(b =>
    `${b.name}: ${b.value} ${b.unit}`
  ).join(", ");

  const prompt = `Analyze liver biomarkers for a ${userContext.age || "adult"} year old ${userContext.gender?.toLowerCase() || "patient"}.

BIOMARKERS: ${biomarkerList}

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "overallRiskScore": number 0-100,
  "previousOverallRisk": number 0-100,
  "summary": "2-3 sentence summary",
  "riskFactors": [
    {
      "id": "string",
      "name": "condition name",
      "category": "liver|metabolic|cardiovascular|inflammation",
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

Include 2-3 risk factors and 2 predictions. Keep responses concise. Return ONLY valid JSON.`;

  console.log("[Liver Analysis] Calling Claude API...");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  console.log("[Liver Analysis] Claude API response received, stop_reason:", response.stop_reason);

  // Check if response was truncated
  if (response.stop_reason === "max_tokens") {
    console.error("[Liver Analysis] Response was truncated!");
    throw new Error("AI response was truncated. Please try again.");
  }

  // Extract the text content
  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse the JSON response
  try {
    let jsonStr = textContent.text.trim();

    console.log("[Liver Analysis] Raw Claude response length:", jsonStr.length);
    console.log("[Liver Analysis] Raw response preview:", jsonStr.substring(0, 300));

    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      const parts = jsonStr.split("```json");
      if (parts.length > 1) {
        jsonStr = parts[1].split("```")[0];
      }
    } else if (jsonStr.includes("```")) {
      // Handle generic code blocks
      const parts = jsonStr.split("```");
      if (parts.length >= 2) {
        jsonStr = parts[1];
        // Remove language identifier if present (e.g., "json\n")
        if (jsonStr.startsWith("json")) {
          jsonStr = jsonStr.slice(4);
        }
      }
    }

    jsonStr = jsonStr.trim();

    // Find the JSON object boundaries
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    console.log("[Liver Analysis] Cleaned JSON length:", jsonStr.length);
    console.log("[Liver Analysis] JSON preview:", jsonStr.substring(0, 200));

    // Validate it's actually JSON before parsing
    if (!jsonStr.startsWith("{")) {
      console.error("[Liver Analysis] Response doesn't start with {:", jsonStr.substring(0, 100));
      throw new Error("AI response is not valid JSON");
    }

    const analysis = JSON.parse(jsonStr) as Omit<LiverAnalysisResult, "analyzedAt">;

    // Validate required fields
    if (typeof analysis.overallRiskScore !== "number") {
      throw new Error("Missing overallRiskScore in response");
    }

    return {
      ...analysis,
      analyzedAt: new Date().toISOString()
    };
  } catch (parseError) {
    console.error("[Liver Analysis] Failed to parse Claude response:");
    console.error("[Liver Analysis] Error:", parseError);
    console.error("[Liver Analysis] Raw text:", textContent.text.substring(0, 1000));
    throw new Error(`AI analysis parsing failed. Please try again.`);
  }
}
