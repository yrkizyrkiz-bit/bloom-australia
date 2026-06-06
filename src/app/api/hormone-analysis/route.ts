import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const anthropic = new Anthropic();

// Hormone biomarker IDs for analysis
const HORMONE_BIOMARKER_IDS = [
  "testosterone_total",
  "free_testosterone",
  "estradiol",
  "progesterone",
  "cortisol",
  "dhea_s",
  "fsh",
  "lh",
  "shbg",
  "prolactin",
  "tsh",
  "free_t4",
  "free_t3",
  "insulin",
  "igf1"
];

interface HormoneAnalysisResult {
  overallRisk: "low" | "moderate" | "elevated" | "high";
  riskScore: number;
  summary: string;
  hormoneBalance: {
    category: string;
    status: "optimal" | "suboptimal" | "imbalanced";
    description: string;
  }[];
  riskFactors: {
    factor: string;
    severity: "low" | "moderate" | "high";
    explanation: string;
    biomarkers: string[];
  }[];
  predictions: {
    condition: string;
    likelihood: "unlikely" | "possible" | "likely";
    timeframe: string;
    preventable: boolean;
  }[];
  insights: string[];
  recommendations: {
    category: "lifestyle" | "nutrition" | "supplement" | "medical" | "testing";
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }[];
  cyclePhaseAnalysis?: {
    estimatedPhase: "follicular" | "ovulatory" | "luteal" | "menstrual" | "perimenopausal" | "menopausal" | "unknown";
    confidence: number;
    interpretation: string;
    expectedRanges: {
      biomarker: string;
      expectedRange: string;
      actualValue: number;
      status: "within" | "above" | "below";
    }[];
  };
  urgentActions: string[];
  analysisTimestamp: string;
}

function generateBiomarkerHash(biomarkers: any[]): string {
  const sortedData = biomarkers
    .map(b => `${b.biomarkerId}:${b.value}`)
    .sort()
    .join("|");
  return crypto.createHash("md5").update(sortedData).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;

    // Get the latest cached analysis
    const cachedAnalysis = await prisma.aIAnalysisCache.findFirst({
      where: {
        userId,
        analysisType: "hormone",
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (cachedAnalysis) {
      return NextResponse.json({
        analysis: cachedAnalysis.analysisData,
        cached: true,
        cacheExpires: cachedAnalysis.expiresAt
      });
    }

    return NextResponse.json({ analysis: null, cached: false });
  } catch (error) {
    console.error("Error fetching hormone analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch hormone analysis" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = body.userId || session.user.id;
    const forceRefresh = body.refresh === true;

    // Get user details for sex-specific analysis
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gender: true,
        dateOfBirth: true,
        firstName: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const gender = user.gender?.toLowerCase() === "female" ? "female" : "male";
    const age = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Fetch user's hormone-related biomarker results
    const biomarkerResults = await prisma.biomarkerResult.findMany({
      where: {
        userId,
        biomarkerId: { in: HORMONE_BIOMARKER_IDS }
      },
      include: {
        biomarker: true
      },
      orderBy: { testedAt: "desc" }
    });

    // Get latest result for each biomarker
    const latestResults = new Map();
    for (const result of biomarkerResults) {
      if (!latestResults.has(result.biomarkerId)) {
        latestResults.set(result.biomarkerId, result);
      }
    }
    const uniqueResults = Array.from(latestResults.values());

    if (uniqueResults.length === 0) {
      return NextResponse.json({
        error: "No hormone biomarker results found",
        requiresBiomarkers: true
      }, { status: 400 });
    }

    // Check cache
    const biomarkerHash = generateBiomarkerHash(uniqueResults);

    if (!forceRefresh) {
      const cachedAnalysis = await prisma.aIAnalysisCache.findFirst({
        where: {
          userId,
          analysisType: "hormone",
          biomarkerHash,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: "desc" }
      });

      if (cachedAnalysis) {
        return NextResponse.json({
          analysis: cachedAnalysis.analysisData,
          cached: true,
          cacheExpires: cachedAnalysis.expiresAt
        });
      }
    }

    // Prepare biomarker data for Claude
    const biomarkerSummary = uniqueResults.map(r => ({
      name: r.biomarker?.name || r.biomarkerId,
      shortName: r.biomarker?.shortName || r.biomarkerId,
      value: r.value,
      unit: r.biomarker?.unit || "",
      status: r.status,
      testedAt: r.testedAt
    }));

    // Build the prompt for Claude
    const prompt = `You are an expert endocrinologist and hormone health specialist analyzing hormone biomarker results. Provide a comprehensive, personalized analysis.

PATIENT PROFILE:
- Sex: ${gender}
- Age: ${age ? `${age} years old` : "Unknown"}
${gender === "female" ? "- Note: Consider menstrual cycle phase when interpreting sex hormone results" : ""}

HORMONE BIOMARKER RESULTS:
${biomarkerSummary.map(b => `- ${b.name} (${b.shortName}): ${b.value} ${b.unit} [Status: ${b.status}] (Tested: ${new Date(b.testedAt).toLocaleDateString()})`).join("\n")}

REFERENCE RANGES BY SEX:
${gender === "male" ? `
Male Reference Ranges (Australian SI Units):
- Testosterone Total: Optimal 14-28 nmol/L, Normal 8-30 nmol/L
- Free Testosterone: Optimal 250-500 pmol/L, Normal 180-600 pmol/L
- SHBG: Optimal 20-50 nmol/L
- Estradiol: Optimal 70-150 pmol/L
- Cortisol (AM): Optimal 300-500 nmol/L, Normal 200-600 nmol/L
- DHEA-S: Optimal 4-10 µmol/L
- FSH: Normal 1-12 IU/L
- LH: Normal 1-9 IU/L
- Prolactin: Normal 4-15 mIU/L
` : `
Female Reference Ranges (Australian SI Units):
Vary by menstrual cycle phase:

Follicular Phase (Day 1-14):
- Estradiol: 70-500 pmol/L
- Progesterone: 0.5-3 nmol/L
- FSH: 3-10 IU/L
- LH: 2-10 IU/L

Ovulatory Phase (Day 14-16):
- Estradiol: 500-1500 pmol/L (peak)
- Progesterone: 1-5 nmol/L
- FSH: 8-25 IU/L (surge)
- LH: 15-60 IU/L (surge)

Luteal Phase (Day 16-28):
- Estradiol: 150-750 pmol/L
- Progesterone: 16-85 nmol/L (confirms ovulation >16)
- FSH: 1-8 IU/L
- LH: 1-10 IU/L

Perimenopause/Menopause:
- FSH: >25 IU/L indicates perimenopause, >40 IU/L menopause
- Estradiol: <150 pmol/L
- Progesterone: <1 nmol/L

Common for all phases:
- Testosterone Total: Optimal 0.5-2.0 nmol/L
- Cortisol (AM): Optimal 300-500 nmol/L
- DHEA-S: Optimal 2-8 µmol/L
- SHBG: 30-120 nmol/L
- Prolactin: Normal 4-25 mIU/L
`}

ANALYSIS REQUIREMENTS:
1. Assess overall hormone balance and identify any imbalances
2. ${gender === "female" ? "Estimate menstrual cycle phase based on hormone levels" : "Assess androgen status and male hormone health"}
3. Identify risk factors for hormone-related conditions
4. Predict potential health issues if imbalances continue
5. Provide actionable, evidence-based recommendations
6. Flag any urgent concerns requiring immediate medical attention

Return your analysis as a JSON object with this exact structure:
{
  "overallRisk": "low" | "moderate" | "elevated" | "high",
  "riskScore": <number 0-100, where 0 is best>,
  "summary": "<2-3 sentence personalized summary>",
  "hormoneBalance": [
    {
      "category": "<e.g., Sex Hormones, Adrenal Function, Thyroid, etc.>",
      "status": "optimal" | "suboptimal" | "imbalanced",
      "description": "<brief description>"
    }
  ],
  "riskFactors": [
    {
      "factor": "<risk factor name>",
      "severity": "low" | "moderate" | "high",
      "explanation": "<detailed explanation>",
      "biomarkers": ["<relevant biomarker IDs>"]
    }
  ],
  "predictions": [
    {
      "condition": "<potential condition>",
      "likelihood": "unlikely" | "possible" | "likely",
      "timeframe": "<e.g., 1-2 years, 5+ years>",
      "preventable": true | false
    }
  ],
  "insights": ["<personalized insight 1>", "<insight 2>", ...],
  "recommendations": [
    {
      "category": "lifestyle" | "nutrition" | "supplement" | "medical" | "testing",
      "priority": "high" | "medium" | "low",
      "action": "<specific action>",
      "rationale": "<why this helps>"
    }
  ],
  ${gender === "female" ? `"cyclePhaseAnalysis": {
    "estimatedPhase": "follicular" | "ovulatory" | "luteal" | "menstrual" | "perimenopausal" | "menopausal" | "unknown",
    "confidence": <0-100>,
    "interpretation": "<how to interpret results based on estimated phase>",
    "expectedRanges": [
      {
        "biomarker": "<biomarker name>",
        "expectedRange": "<expected range for this phase>",
        "actualValue": <number>,
        "status": "within" | "above" | "below"
      }
    ]
  },` : ""}
  "urgentActions": ["<any urgent actions needed>"],
  "analysisTimestamp": "<ISO timestamp>"
}

Provide ONLY the JSON object, no additional text.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Parse the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let analysis: HormoneAnalysisResult;
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      analysis = JSON.parse(jsonMatch[0]);
      analysis.analysisTimestamp = new Date().toISOString();
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      console.error("Response text:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI analysis" },
        { status: 500 }
      );
    }

    // Cache the analysis (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.aIAnalysisCache.create({
      data: {
        userId,
        analysisType: "hormone",
        analysisData: JSON.parse(JSON.stringify(analysis)),
        biomarkerHash,
        expiresAt
      }
    });

    return NextResponse.json({
      analysis,
      cached: false,
      cacheExpires: expiresAt
    });

  } catch (error) {
    console.error("Error generating hormone analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate hormone analysis" },
      { status: 500 }
    );
  }
}
