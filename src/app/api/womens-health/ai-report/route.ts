import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDataDate, isResultsStale } from "@/lib/ai-report-cache";
import { WOMENS_HEALTH_SUBCATEGORIES } from "@/lib/womens-health-biomarker-subcategories";
import { type ClinicalMetadata } from "@/lib/womens-health-clinical-checkins";

const anthropic = new Anthropic();
const ANALYSIS_TYPE = "womens_health_comprehensive";
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const CLAUDE_TIMEOUT_MS = 90_000;

const WOMENS_HEALTH_MARKER_IDS = [
  ...new Set(WOMENS_HEALTH_SUBCATEGORIES.flatMap((item) => item.markerIds)),
];

const REPORT_TOOL = {
  name: "submit_womens_health_report",
  description: "Submit the complete structured Women's Health biomarker report.",
  input_schema: {
    type: "object",
    required: [
      "reportTitle",
      "overallRisk",
      "riskScore",
      "executiveSummary",
      "clinicalContext",
      "inputReview",
      "biomarkerFindings",
      "womenHealthAreas",
      "symptomBiomarkerCorrelations",
      "recommendations",
      "questionsForCareTeam",
      "retestingGuidance",
      "urgentActions",
      "limitations",
      "analysisTimestamp",
    ],
    properties: {
      reportTitle: { type: "string" },
      overallRisk: { type: "string", enum: ["low", "moderate", "elevated", "high"] },
      riskScore: { type: "number" },
      executiveSummary: { type: "string" },
      clinicalContext: { type: "string" },
      inputReview: {
        type: "object",
        required: ["summary", "usefulInputs", "missingOrUnclearInputs", "possibleContradictions"],
        properties: {
          summary: { type: "string" },
          usefulInputs: { type: "array", items: { type: "string" } },
          missingOrUnclearInputs: { type: "array", items: { type: "string" } },
          possibleContradictions: { type: "array", items: { type: "string" } },
        },
      },
      biomarkerFindings: { type: "array", items: { type: "object" } },
      womenHealthAreas: { type: "array", items: { type: "object" } },
      symptomBiomarkerCorrelations: { type: "array", items: { type: "object" } },
      recommendations: { type: "array", items: { type: "object" } },
      questionsForCareTeam: { type: "array", items: { type: "string" } },
      retestingGuidance: { type: "string" },
      urgentActions: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
      analysisTimestamp: { type: "string" },
    },
  },
};

type WomensHealthCheckInRow = {
  careArea: string;
  periodStatus: string | null;
  cycleDay: number | null;
  lastPeriodDate: Date | null;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  painLevel: number | null;
  libidoLevel: number | null;
  hotFlushesLevel: number | null;
  cravingsLevel: number | null;
  symptoms: string[];
  notes: string | null;
  treatmentSideEffectFlag: boolean;
  metadata: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: Date;
};

type WomensHealthAIReport = {
  aiProvider?: "claude";
  aiModel?: string;
  reportTitle: string;
  overallRisk: "low" | "moderate" | "elevated" | "high";
  riskScore: number;
  executiveSummary: string;
  clinicalContext: string;
  inputReview: {
    summary: string;
    usefulInputs: string[];
    missingOrUnclearInputs: string[];
    possibleContradictions: string[];
  };
  biomarkerFindings: Array<{
    area: string;
    finding: string;
    interpretation: string;
    relatedBiomarkers: string[];
    priority: "low" | "medium" | "high";
  }>;
  womenHealthAreas: Array<{
    area: "hormones" | "menopause" | "pcos" | "fertility" | "metabolic" | "thyroid" | "nutrient";
    status: "reassuring" | "watch" | "needs_review";
    summary: string;
    evidence: string[];
  }>;
  symptomBiomarkerCorrelations: Array<{
    symptomPattern: string;
    possibleBiomarkerLinks: string[];
    explanation: string;
  }>;
  recommendations: Array<{
    category: "medical" | "testing" | "lifestyle" | "nutrition" | "tracking" | "follow_up";
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }>;
  questionsForCareTeam: string[];
  retestingGuidance: string;
  urgentActions: string[];
  limitations: string[];
  analysisTimestamp: string;
};

function generateBiomarkerHash(biomarkers: Array<{ biomarkerId: string; value: number; testedAt: Date | string }>): string {
  const sortedData = biomarkers
    .map((item) => `${item.biomarkerId}:${item.value}:${new Date(item.testedAt).toISOString()}`)
    .sort()
    .join("|");
  return crypto.createHash("md5").update(sortedData).digest("hex");
}

function calculateAge(dateOfBirth?: Date | null): number | null {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Claude report generation timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function generateClaudeReport(prompt: string): Promise<WomensHealthAIReport> {
  const message = await withTimeout(anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 6000,
    tools: [REPORT_TOOL as any],
    tool_choice: { type: "tool", name: "submit_womens_health_report" } as any,
    messages: [
      {
        role: "user",
        content: `${prompt}

Use the submit_womens_health_report tool. Do not return free-form text.`,
      },
    ],
  }), CLAUDE_TIMEOUT_MS);

  const toolUse = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_womens_health_report"
  );

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return the structured report tool output");
  }

  return toolUse.input as WomensHealthAIReport;
}

function assertClaudeReportUsable(report: WomensHealthAIReport) {
  if (!report.executiveSummary || !report.clinicalContext) {
    throw new Error("Claude report is missing core narrative sections");
  }
  if (!Array.isArray(report.biomarkerFindings) || report.biomarkerFindings.length === 0) {
    throw new Error("Claude report did not include biomarker findings");
  }
  if (!Array.isArray(report.womenHealthAreas) || report.womenHealthAreas.length === 0) {
    throw new Error("Claude report did not include Women's Health area analysis");
  }
  if (!Array.isArray(report.recommendations) || report.recommendations.length === 0) {
    throw new Error("Claude report did not include recommendations");
  }
}

async function loadReportContext(userId: string) {
  const [user, biomarkerResults] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, gender: true, dateOfBirth: true, subscriptionTier: true },
    }),
    prisma.biomarkerResult.findMany({
      where: {
        userId,
        biomarkerId: { in: WOMENS_HEALTH_MARKER_IDS },
      },
      include: { biomarker: true },
      orderBy: { testedAt: "desc" },
    }),
  ]);

  let checkIns: WomensHealthCheckInRow[] = [];
  try {
    checkIns = await prisma.$queryRaw<WomensHealthCheckInRow[]>`
      SELECT
        "careArea",
        "periodStatus",
        "cycleDay",
        "lastPeriodDate",
        "energyLevel",
        "moodLevel",
        "sleepQuality",
        "stressLevel",
        "painLevel",
        "libidoLevel",
        "hotFlushesLevel",
        "cravingsLevel",
        "symptoms",
        "notes",
        "treatmentSideEffectFlag",
        "metadata",
        "checkedInAt"
      FROM "WomensHealthCheckIn"
      WHERE "userId" = ${userId}
      ORDER BY "checkedInAt" DESC
      LIMIT 20
    `;
  } catch (error) {
    console.warn("[womens-health/ai-report] Check-ins unavailable, continuing with biomarkers only", error);
  }

  if (!user) return null;

  const latestResults = new Map<string, (typeof biomarkerResults)[number]>();
  for (const result of biomarkerResults) {
    if (!latestResults.has(result.biomarkerId)) {
      latestResults.set(result.biomarkerId, result);
    }
  }

  const uniqueResults = Array.from(latestResults.values());
  const biomarkerHash = uniqueResults.length ? generateBiomarkerHash(uniqueResults) : null;
  const dataDate = getDataDate(uniqueResults.map((result) => result.testedAt));
  const resultsStale = isResultsStale(dataDate);

  return {
    user,
    age: calculateAge(user.dateOfBirth),
    uniqueResults,
    biomarkerHash,
    dataDate,
    resultsStale,
    checkIns,
  };
}

function buildPrompt(context: NonNullable<Awaited<ReturnType<typeof loadReportContext>>>) {
  const biomarkerSummary = context.uniqueResults.map((result) => ({
    id: result.biomarkerId,
    name: result.biomarker?.name || result.biomarkerId,
    shortName: result.biomarker?.shortName || result.biomarkerId,
    value: result.value,
    unit: result.biomarker?.unit || "",
    status: result.status,
    testedAt: result.testedAt,
  }));

  const checkInSummary = context.checkIns.map((entry) => ({
    careArea: entry.careArea,
    periodStatus: entry.periodStatus,
    cycleDay: entry.cycleDay,
    energyLevel: entry.energyLevel,
    moodLevel: entry.moodLevel,
    sleepQuality: entry.sleepQuality,
    stressLevel: entry.stressLevel,
    painLevel: entry.painLevel,
    libidoLevel: entry.libidoLevel,
    hotFlushesLevel: entry.hotFlushesLevel,
    cravingsLevel: entry.cravingsLevel,
    symptoms: entry.symptoms,
    clinicalDetails: entry.metadata?.clinical || {},
    treatmentSideEffectFlag: entry.treatmentSideEffectFlag,
    checkedInAt: entry.checkedInAt,
    notes: entry.notes?.slice(0, 300) || null,
  }));

  return `You are an expert Australian women's health clinician creating a comprehensive, evidence-backed but patient-friendly biomarker report.

Depth requirement:
- This must read like a meaningful clinician-style review, not a generic wellness summary.
- Use the member's actual biomarker values, statuses, symptom check-ins and clinicalDetails.
- Cross-check user inputs against biomarkers. If symptoms and biomarkers align, explain why. If they do not clearly align, say so and explain what else may be needed.
- Be specific about uncertainty, missing context and what the care team should clarify.
- Keep language understandable for a non-clinical member, but make the reasoning detailed.
- Do not simply list generic lifestyle advice. Every recommendation must connect to either a biomarker, a user input, or a missing piece of context.

PATIENT PROFILE:
- First name: ${context.user.firstName || "Member"}
- Sex/gender in portal: ${context.user.gender}
- Age: ${context.age ?? "Unknown"}
- Program: Women's Health
- Latest blood test date represented in this report: ${context.dataDate ? new Date(context.dataDate).toLocaleDateString("en-AU") : "Unknown"}

WOMEN'S HEALTH BIOMARKERS:
${biomarkerSummary.map((b) => `- ${b.name} (${b.id}): ${b.value} ${b.unit} [${b.status}] tested ${new Date(b.testedAt).toLocaleDateString("en-AU")}`).join("\n")}

RECENT WOMEN'S HEALTH CHECK-INS:
${checkInSummary.length ? checkInSummary.map((c) => `- ${new Date(c.checkedInAt).toLocaleDateString("en-AU")} | ${c.careArea} | cycle day ${c.cycleDay ?? "n/a"} | symptoms: ${(c.symptoms || []).join(", ") || "none"} | clinical details: ${Object.keys(c.clinicalDetails).length ? JSON.stringify(c.clinicalDetails) : "none"} | energy ${c.energyLevel}/5 sleep ${c.sleepQuality}/5 stress ${c.stressLevel}/5 hot flushes ${c.hotFlushesLevel ?? "n/a"}/5 cravings ${c.cravingsLevel ?? "n/a"}/5${c.notes ? ` | note: ${c.notes}` : ""}${c.treatmentSideEffectFlag ? " | possible treatment side effect flagged" : ""}`).join("\n") : "- No check-ins logged yet"}

USER INPUT REVIEW REQUIREMENTS:
1. Review whether check-in symptoms and clinicalDetails support or conflict with the biomarker pattern.
2. Identify useful user inputs, such as cycle pattern, menopause stage, sleep disruption, hot flushes, cravings, androgen symptoms, fertility planning, medications or treatment context.
3. Identify missing or unclear inputs that limit interpretation, such as blood draw timing, cycle phase, HRT/contraception, thyroid medication, iron supplementation, pregnancy possibility, fasting status or treatment history.
4. Mention possible contradictions only if there is a real mismatch, for example severe symptoms with mostly reassuring markers, or abnormal biomarkers without matching symptoms.

FOCUS AREAS TO COVER:
- Hormone health: estradiol, progesterone, FSH, LH, prolactin, testosterone, SHBG, Free Androgen Index
- Menopause/perimenopause: FSH/LH/estradiol/progesterone, hot flushes, sleep, mood, metabolic changes
- PCOS/metabolic: testosterone, SHBG, Free Androgen Index, glucose, HbA1c, insulin, HOMA-IR, TyG Index
- Fertility/reproductive: FSH, LH, estradiol, progesterone, prolactin, thyroid, iron, vitamin D, metabolic markers
- Thyroid/nutrients: TSH, Free T4, ferritin, iron, transferrin saturation, vitamin D

SAFETY AND SCOPE:
- Do not diagnose.
- Do not recommend prescription changes or medication dose changes.
- Mention that interpretation depends on cycle phase, menopause status, pregnancy status, contraception/HRT and timing of blood draw.
- Urgent symptoms should prompt urgent medical care.

Return ONLY valid JSON with this exact structure:
{
  "reportTitle": "string",
  "overallRisk": "low|moderate|elevated|high",
  "riskScore": 0,
  "executiveSummary": "4-6 sentence summary that names the strongest biomarker and user-input patterns",
  "clinicalContext": "explain how cycle stage, menopause stage, medication/HRT, fasting status and timing affect interpretation",
  "inputReview": {
    "summary": "how the user inputs changed or supported the interpretation",
    "usefulInputs": ["specific input that helped interpretation"],
    "missingOrUnclearInputs": ["specific missing input or unclear detail"],
    "possibleContradictions": ["specific mismatch, or empty array if none"]
  },
  "biomarkerFindings": [
    {
      "area": "hormones|menopause|pcos|fertility|metabolic|thyroid|nutrient",
      "finding": "specific finding naming biomarker values where relevant",
      "interpretation": "detailed interpretation in member-friendly language, including why it matters and what context could change it",
      "relatedBiomarkers": ["biomarker_id"],
      "priority": "low|medium|high"
    }
  ],
  "womenHealthAreas": [
    {
      "area": "hormones|menopause|pcos|fertility|metabolic|thyroid|nutrient",
      "status": "reassuring|watch|needs_review",
      "summary": "specific area summary",
      "evidence": ["specific biomarker value, symptom input, clinical input or missing context"]
    }
  ],
  "symptomBiomarkerCorrelations": [
    {
      "symptomPattern": "string",
      "possibleBiomarkerLinks": ["biomarker_id or clinical input"],
      "explanation": "explain how symptoms and biomarkers may connect, and what remains uncertain"
    }
  ],
  "recommendations": [
    {
      "category": "medical|testing|lifestyle|nutrition|tracking|follow_up",
      "priority": "high|medium|low",
      "action": "specific action",
      "rationale": "must reference a biomarker, user input, or missing context"
    }
  ],
  "questionsForCareTeam": ["string"],
  "retestingGuidance": "string",
  "urgentActions": ["string"],
  "limitations": ["string"],
  "analysisTimestamp": "ISO string"
}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId") || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await loadReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cachedReport = await prisma.aIAnalysisCache.findUnique({
      where: { userId_analysisType: { userId, analysisType: ANALYSIS_TYPE } },
    });

    const canGenerate =
      context.uniqueResults.length > 0 &&
      (!cachedReport || cachedReport.biomarkerHash !== context.biomarkerHash);

    return NextResponse.json({
      report: cachedReport?.analysisData || null,
      cached: Boolean(cachedReport),
      canGenerate,
      requiresNewBloodTest: Boolean(cachedReport && !canGenerate),
      biomarkerCount: context.uniqueResults.length,
      dataDate: context.dataDate,
      resultsStale: context.resultsStale,
      generatedAt: cachedReport?.updatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("[womens-health/ai-report] GET", error);
    return NextResponse.json({ error: "Failed to load Women's Health AI report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await loadReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!context.biomarkerHash || context.uniqueResults.length === 0) {
      return NextResponse.json(
        { error: "No Women's Health biomarker results found", requiresBiomarkers: true },
        { status: 400 }
      );
    }

    const existingReport = await prisma.aIAnalysisCache.findUnique({
      where: { userId_analysisType: { userId, analysisType: ANALYSIS_TYPE } },
    });

    if (existingReport && existingReport.biomarkerHash === context.biomarkerHash) {
      return NextResponse.json(
        {
          report: existingReport.analysisData,
          cached: true,
          blocked: true,
          reason: "A report already exists for the latest blood test. Upload a new blood test to generate another report.",
          dataDate: context.dataDate,
          resultsStale: context.resultsStale,
        },
        { status: 409 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude is not configured. Add ANTHROPIC_API_KEY before generating this report." },
        { status: 503 }
      );
    }

    let report: WomensHealthAIReport;
    try {
      report = await generateClaudeReport(buildPrompt(context));
      assertClaudeReportUsable(report);
    } catch (error) {
      console.error("[womens-health/ai-report] Claude generation failed; report not saved", error);
      return NextResponse.json(
        {
          error:
            "Claude could not generate a valid detailed report. Nothing was saved. Please try again.",
        },
        { status: 502 }
      );
    }

    report.aiProvider = "claude";
    report.aiModel = CLAUDE_MODEL;
    report.analysisTimestamp = new Date().toISOString();
    const analysisData = JSON.parse(JSON.stringify(report));
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    await prisma.aIAnalysisCache.upsert({
      where: { userId_analysisType: { userId, analysisType: ANALYSIS_TYPE } },
      update: {
        analysisData,
        biomarkerHash: context.biomarkerHash,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        analysisType: ANALYSIS_TYPE,
        analysisData,
        biomarkerHash: context.biomarkerHash,
        expiresAt,
      },
    });

    await prisma.aIAnalysisHistory.create({
      data: {
        userId,
        analysisType: ANALYSIS_TYPE,
        analysisData,
        overallScore: Math.round(report.riskScore || 0),
        riskLevel: report.overallRisk || "low",
        biomarkerCount: context.uniqueResults.length,
      },
    });

    return NextResponse.json({
      report,
      cached: false,
      dataDate: context.dataDate,
      resultsStale: context.resultsStale,
    }, { status: 201 });
  } catch (error) {
    console.error("[womens-health/ai-report] POST", error);
    return NextResponse.json({ error: "Failed to generate Women's Health AI report" }, { status: 500 });
  }
}
