import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getDataDate, isResultsStale } from "@/lib/ai-report-cache";
import {
  calculateAllHealthTestScores,
  healthTestsConfig,
  type BiomarkerResultInput,
} from "@/lib/healthTestScoring";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";
import {
  type OrganCareAIReport,
  type OrganCareCategoryKey,
  sanitizeOrganCareReport,
} from "@/lib/organ-care-ai-report-types";

export type { OrganCareAIReport, OrganCareCategoryKey } from "@/lib/organ-care-ai-report-types";

export const ORGAN_CARE_AI_ANALYSIS_TYPE = "organ_care_comprehensive";
const CLAUDE_MODEL =
  process.env.ORGAN_CARE_AI_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const CLAUDE_TIMEOUT_MS = 180_000;
const CLAUDE_MAX_TOKENS = 4096;

type OrganCareReportContext = NonNullable<Awaited<ReturnType<typeof loadOrganCareReportContext>>>;

export const ORGAN_CARE_BIOMARKER_IDS = [
  ...new Set(healthTestsConfig.flatMap((test) => [...test.biomarkerIds])),
];

const REPORT_TOOL = {
  name: "submit_organ_care_report",
  description: "Submit the complete structured Organ & Metabolic Care biomarker report.",
  input_schema: {
    type: "object",
    required: [
      "reportTitle",
      "overallRisk",
      "executiveSummary",
      "clinicalContext",
      "categoryScores",
      "biomarkerFindings",
      "riskPatterns",
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
      executiveSummary: { type: "string" },
      clinicalContext: { type: "string" },
      categoryScores: { type: "array", items: { type: "object" } },
      biomarkerFindings: { type: "array", items: { type: "object" } },
      riskPatterns: { type: "array", items: { type: "object" } },
      recommendations: { type: "array", items: { type: "object" } },
      questionsForCareTeam: { type: "array", items: { type: "string" } },
      retestingGuidance: { type: "string" },
      urgentActions: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
      analysisTimestamp: { type: "string" },
    },
  },
};

function generateBiomarkerHash(
  biomarkers: Array<{ biomarkerId: string; value: number; testedAt: Date | string }>
): string {
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

function parseRanges(
  biomarker: { femaleRanges?: unknown; maleRanges?: unknown },
  gender: "male" | "female"
) {
  try {
    const rangeField = gender === "female" ? biomarker.femaleRanges : biomarker.maleRanges;
    if (!rangeField) return {};
    return typeof rangeField === "string" ? JSON.parse(rangeField) : (rangeField as Record<string, number>);
  } catch {
    return {};
  }
}

function computeTrend(
  sortedValues: number[],
  ranges: { optimal_low?: number; optimal_high?: number }
): { trend: "improving" | "stable" | "worsening"; changePercent: number } {
  if (sortedValues.length < 2) {
    return { trend: "stable", changePercent: 0 };
  }

  const firstValue = sortedValues[0];
  const lastValue = sortedValues[sortedValues.length - 1];
  const changePercent =
    firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  if (ranges.optimal_low !== undefined && ranges.optimal_high !== undefined) {
    const optimalMid = (ranges.optimal_low + ranges.optimal_high) / 2;
    const firstDistance = Math.abs(firstValue - optimalMid);
    const lastDistance = Math.abs(lastValue - optimalMid);

    if (lastDistance < firstDistance * 0.9) return { trend: "improving", changePercent };
    if (lastDistance > firstDistance * 1.1) return { trend: "worsening", changePercent };
    return { trend: "stable", changePercent };
  }

  if (changePercent < -5) return { trend: "improving", changePercent };
  if (changePercent > 5) return { trend: "worsening", changePercent };
  return { trend: "stable", changePercent };
}

function categoryStatusFromScore(score: number, outOfRange: number): "optimal" | "watch" | "needs_attention" {
  if (score >= 75 && outOfRange === 0) return "optimal";
  if (score >= 55) return "watch";
  return "needs_attention";
}

function mapTrendToCategoryTrend(
  trend: "improving" | "stable" | "declining"
): "improving" | "stable" | "declining" {
  return trend;
}

type BiomarkerSummary = {
  biomarkerId: string;
  name: string;
  shortName: string;
  category: string;
  value: number;
  unit: string;
  status: string;
  testedAt: string;
  previousValue: number | null;
  previousTestedAt: string | null;
  trend: "improving" | "stable" | "worsening" | "unknown";
  changePercent: number | null;
};

/** Keep prompt size manageable, full history stays in DB; Claude gets compact deltas. */
function buildPromptBiomarkerPayload(summaries: BiomarkerSummary[]) {
  const needsAttention = summaries.filter(
    (s) =>
      s.status === "out_of_range" ||
      s.status === "critical" ||
      s.trend === "worsening" ||
      (s.changePercent != null && Math.abs(s.changePercent) >= 5)
  );
  const attentionIds = new Set(needsAttention.map((s) => s.biomarkerId));

  const contextByCategory = new Map<string, BiomarkerSummary[]>();
  for (const s of summaries) {
    if (attentionIds.has(s.biomarkerId)) continue;
    const list = contextByCategory.get(s.category) || [];
    if (list.length < 2) {
      list.push(s);
      contextByCategory.set(s.category, list);
    }
  }

  const selected = [
    ...needsAttention,
    ...Array.from(contextByCategory.values()).flat(),
  ];

  return selected.map((s) => ({
    id: s.biomarkerId,
    name: s.shortName || s.name,
    category: s.category,
    value: s.value,
    unit: s.unit,
    status: s.status,
    testedAt: s.testedAt.slice(0, 10),
    previousValue: s.previousValue,
    previousDate: s.previousTestedAt?.slice(0, 10) ?? null,
    trend: s.trend,
    changePercent: s.changePercent,
  }));
}

export async function loadOrganCareReportContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, gender: true, dateOfBirth: true },
  });

  if (!user) return null;

  const gender: "male" | "female" =
    user.gender?.toUpperCase() === "FEMALE" ? "female" : "male";

  const results = await prisma.biomarkerResult.findMany({
    where: {
      userId,
      biomarkerId: { in: ORGAN_CARE_BIOMARKER_IDS },
    },
    include: { biomarker: true },
    orderBy: { testedAt: "desc" },
  });

  const catalogResults = results.filter((r) => isCatalogBiomarker(r.biomarkerId));
  const grouped = new Map<string, typeof catalogResults>();

  for (const result of catalogResults) {
    const existing = grouped.get(result.biomarkerId) || [];
    existing.push(result);
    grouped.set(result.biomarkerId, existing);
  }

  const biomarkerSummaries = Array.from(grouped.entries()).map(([biomarkerId, bioResults]) => {
    const sorted = [...bioResults].sort(
      (a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime()
    );
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const ranges = latest.biomarker ? parseRanges(latest.biomarker, gender) : {};
    const trendData = computeTrend(
      sorted.map((r) => r.value),
      ranges
    );

    return {
      biomarkerId,
      name: latest.biomarker?.name || biomarkerId,
      shortName: latest.biomarker?.shortName || biomarkerId,
      category: latest.biomarker?.category || "unknown",
      value: latest.value,
      unit: latest.biomarker?.unit || "",
      status: latest.status?.toLowerCase() || "normal",
      testedAt: latest.testedAt.toISOString(),
      previousValue: previous?.value ?? null,
      previousTestedAt: previous?.testedAt.toISOString() ?? null,
      trend: sorted.length >= 2 ? trendData.trend : ("unknown" as const),
      changePercent: sorted.length >= 2 ? Math.round(trendData.changePercent * 10) / 10 : null,
    } satisfies BiomarkerSummary;
  });

  const latestResults = biomarkerSummaries.map((item) => ({
    biomarkerId: item.biomarkerId,
    value: item.value,
    testedAt: item.testedAt,
  }));

  const biomarkerHash = latestResults.length ? generateBiomarkerHash(latestResults) : null;
  const dataDate = getDataDate(latestResults.map((r) => r.testedAt));
  const resultsStale = isResultsStale(dataDate);

  const biomarkerInputs: BiomarkerResultInput[] = biomarkerSummaries.map((item) => ({
    id: item.biomarkerId,
    biomarkerId: item.biomarkerId,
    value: item.value,
    status: item.status,
    testedAt: item.testedAt,
  }));

  const healthScores = calculateAllHealthTestScores(gender, biomarkerInputs);

  const testDates = Array.from(
    new Set(catalogResults.map((r) => r.testedAt.toISOString().split("T")[0]))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return {
    user,
    age: calculateAge(user.dateOfBirth),
    gender,
    biomarkerSummaries,
    biomarkerHash,
    dataDate,
    resultsStale,
    healthScores,
    testDates,
    biomarkerCount: biomarkerSummaries.length,
  };
}

export function buildOrganCareReportPrompt(
  context: NonNullable<Awaited<ReturnType<typeof loadOrganCareReportContext>>>
) {
  const categoryPayload = context.healthScores.categories
    .filter((c) => c.hasData)
    .map((c) => ({
      category: c.id,
      label: c.name,
      score: c.score,
      optimal: c.optimal,
      normal: c.normal,
      outOfRange: c.outOfRange,
      trend: c.trend,
    }));

  const biomarkerPayload = buildPromptBiomarkerPayload(context.biomarkerSummaries);
  const totalTracked = context.biomarkerCount;

  return `You are an expert Australian clinical biochemist creating an Organ & Metabolic Care report.

Rules:
- Use ONLY the data below (${biomarkerPayload.length} key markers shown; ${totalTracked} total tracked).
- Identify multi-marker risk patterns (insulin resistance, CV risk, liver-metabolic overlap, kidney-cardiometabolic strain, thyroid-hormone-metabolic links).
- Comment on historical change when previousValue is present.
- Be concise: max 12 biomarkerFindings, 4 riskPatterns, 6 recommendations.
- Plain language for the member; educational only, not a diagnosis.
- Australian GP/specialist follow-up where appropriate.

PATIENT: ${context.user.firstName || "Member"}, ${context.user.gender}, age ${context.age ?? "unknown"}
OVERALL HEALTH SCORE: ${context.healthScores.overall}/100
LATEST TEST: ${context.dataDate?.slice(0, 10) ?? "unknown"} | STALE (>6mo): ${context.resultsStale}
TEST DATES: ${context.testDates.slice(0, 5).join(", ")}

CATEGORY SCORES:
${JSON.stringify(categoryPayload)}

KEY BIOMARKERS (with prior comparison when available):
${JSON.stringify(biomarkerPayload)}

Submit via submit_organ_care_report with:
- reportTitle, overallRisk (low|moderate|elevated|high), executiveSummary (3 sentences), clinicalContext (1 short paragraph)
- categoryScores: one per category with data, align scores/trends to CATEGORY SCORES above
- biomarkerFindings: priority markers only; include interpretation and priority
- riskPatterns: 2-4 combined-indicator patterns with monitoringAdvice
- recommendations, questionsForCareTeam (3-4), retestingGuidance, urgentActions (or []), limitations, analysisTimestamp (ISO)`;
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

export async function generateOrganCareClaudeReport(
  prompt: string,
  overallHealthScore: number
): Promise<OrganCareAIReport> {
  const anthropic = new Anthropic();

  const callClaude = () =>
    anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      tools: [REPORT_TOOL as any],
      tool_choice: { type: "tool", name: "submit_organ_care_report" } as any,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nUse the submit_organ_care_report tool only.`,
        },
      ],
    });

  let message;
  try {
    message = await withTimeout(callClaude(), CLAUDE_TIMEOUT_MS);
  } catch (firstError) {
    const isTimeout =
      firstError instanceof Error && firstError.message.includes("timed out");
    if (!isTimeout) throw firstError;
    console.warn("[organ-care/ai-report] First Claude attempt timed out, retrying once...");
    message = await withTimeout(callClaude(), CLAUDE_TIMEOUT_MS);
  }

  const toolUse = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_organ_care_report"
  );

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return the structured organ care report");
  }

  const report = toolUse.input as OrganCareAIReport;
  report.overallHealthScore = overallHealthScore;
  return report;
}

export function assertOrganCareReportUsable(report: OrganCareAIReport) {
  if (!report.executiveSummary || !report.clinicalContext) {
    throw new Error("Report missing core narrative sections");
  }
  if (!Array.isArray(report.biomarkerFindings) || report.biomarkerFindings.length === 0) {
    throw new Error("Report missing biomarker findings");
  }
  if (!Array.isArray(report.riskPatterns) || report.riskPatterns.length === 0) {
    throw new Error("Report missing combined risk patterns");
  }
  if (!Array.isArray(report.recommendations) || report.recommendations.length === 0) {
    throw new Error("Report missing recommendations");
  }
}

function overallRiskFromScore(score: number): OrganCareAIReport["overallRisk"] {
  if (score >= 75) return "low";
  if (score >= 60) return "moderate";
  if (score >= 45) return "elevated";
  return "high";
}

function summaryById(
  summaries: BiomarkerSummary[],
  ids: string[]
): BiomarkerSummary | undefined {
  return summaries.find((s) => ids.includes(s.biomarkerId));
}

function isAttentionMarker(summary: BiomarkerSummary) {
  return (
    summary.status === "out_of_range" ||
    summary.status === "critical" ||
    summary.trend === "worsening" ||
    (summary.changePercent != null && Math.abs(summary.changePercent) >= 8)
  );
}

function findingPriority(summary: BiomarkerSummary): "low" | "medium" | "high" {
  if (summary.status === "critical") return "high";
  if (summary.status === "out_of_range" || summary.trend === "worsening") return "high";
  if (summary.status === "normal" && summary.trend === "improving") return "low";
  return "medium";
}

function biomarkerInterpretation(summary: BiomarkerSummary): string {
  const name = summary.shortName || summary.name;
  if (summary.status === "out_of_range" || summary.status === "critical") {
    return `${name} is outside the optimal range at ${summary.value} ${summary.unit}. Discuss this result with your GP or specialist.`;
  }
  if (summary.trend === "worsening" && summary.previousValue != null) {
    return `${name} has moved further from optimal since your previous test (${summary.previousValue} ${summary.unit}). Worth monitoring on repeat labs.`;
  }
  if (summary.trend === "improving" && summary.previousValue != null) {
    return `${name} has improved compared with your previous test (${summary.previousValue} ${summary.unit}).`;
  }
  return `${name} is within expected range at ${summary.value} ${summary.unit}.`;
}

function detectOrganCareRiskPatterns(
  summaries: BiomarkerSummary[],
  healthScores: OrganCareReportContext["healthScores"]
): OrganCareAIReport["riskPatterns"] {
  const patterns: OrganCareAIReport["riskPatterns"] = [];
  const get = (...ids: string[]) => summaryById(summaries, ids);
  const flagged = (...ids: string[]) =>
    ids.map((id) => get(id)).filter((s): s is BiomarkerSummary => Boolean(s && isAttentionMarker(s)));

  const metabolic = flagged("glucose", "hba1c", "insulin", "triglycerides");
  if (metabolic.length >= 2) {
    patterns.push({
      title: "Metabolic / insulin resistance pattern",
      severity: metabolic.length >= 3 ? "high" : "medium",
      involvedBiomarkers: metabolic.map((s) => s.biomarkerId),
      explanation:
        "Several glucose and lipid markers are elevated or trending unfavourably together, which can reflect reduced insulin sensitivity.",
      monitoringAdvice:
        "Repeat fasting glucose, HbA1c, lipids and consider HOMA-IR or oral glucose tolerance testing with your GP.",
    });
  }

  const cardiovascular = flagged(
    "ldl_cholesterol",
    "total_cholesterol",
    "triglycerides",
    "crp",
    "homocysteine",
    "hdl_cholesterol"
  );
  if (cardiovascular.length >= 2) {
    patterns.push({
      title: "Cardiovascular risk pattern",
      severity: cardiovascular.length >= 3 ? "high" : "medium",
      involvedBiomarkers: cardiovascular.map((s) => s.biomarkerId),
      explanation:
        "Multiple heart-health markers are out of range or worsening, suggesting increased cardiometabolic strain.",
      monitoringAdvice:
        "Discuss lipid management, blood pressure and inflammatory markers with your GP; repeat lipids in 3–6 months.",
    });
  }

  const liver = flagged("alt", "ast", "ggt", "alp");
  if (liver.length >= 2) {
    patterns.push({
      title: "Liver stress pattern",
      severity: liver.length >= 3 ? "high" : "medium",
      involvedBiomarkers: liver.map((s) => s.biomarkerId),
      explanation:
        "Several liver enzymes are elevated together, which may reflect hepatic stress from metabolic, alcohol or medication-related causes.",
      monitoringAdvice:
        "Repeat liver function tests and review alcohol intake, medications and metabolic markers with your clinician.",
    });
  }

  const kidney = flagged("creatinine", "egfr", "bun", "uacr");
  if (kidney.length >= 2) {
    patterns.push({
      title: "Kidney-cardiometabolic strain",
      severity: kidney.some((s) => s.biomarkerId === "egfr" && s.status !== "normal") ? "high" : "medium",
      involvedBiomarkers: kidney.map((s) => s.biomarkerId),
      explanation:
        "Kidney markers are abnormal alongside other metabolic results, which can reflect early cardiorenal overlap.",
      monitoringAdvice:
        "Repeat eGFR, creatinine and urine albumin-creatinine ratio; optimise blood pressure and glucose with your GP.",
    });
  }

  const thyroid = flagged("tsh", "free_t4", "free_t3");
  if (thyroid.length >= 2) {
    patterns.push({
      title: "Thyroid-hormone-metabolic link",
      severity: "medium",
      involvedBiomarkers: thyroid.map((s) => s.biomarkerId),
      explanation:
        "Thyroid markers are discordant, which can influence energy, weight and metabolic lab results.",
      monitoringAdvice: "Repeat thyroid panel in 6–8 weeks and correlate with symptoms with your GP.",
    });
  }

  if (patterns.length === 0) {
    const weakest = [...healthScores.categories]
      .filter((c) => c.hasData)
      .sort((a, b) => a.score - b.score)[0];
    if (weakest) {
      patterns.push({
        title: `${weakest.name} needs the most attention`,
        severity: weakest.score < 55 ? "medium" : "low",
        involvedBiomarkers: summaries
          .filter((s) => isAttentionMarker(s))
          .slice(0, 4)
          .map((s) => s.biomarkerId),
        explanation: `${weakest.name} has the lowest category score (${weakest.score}/100) in your current panel.`,
        monitoringAdvice: `Focus follow-up on ${weakest.name.toLowerCase()} markers and repeat testing as advised by your care team.`,
      });
    }
  }

  return patterns.slice(0, 4);
}

export function buildDeterministicOrganCareReport(context: OrganCareReportContext): OrganCareAIReport {
  const overall = context.healthScores.overall;
  const overallRisk = overallRiskFromScore(overall);
  const attention = context.biomarkerSummaries.filter(isAttentionMarker);
  const findingSources =
    attention.length > 0 ? attention : context.biomarkerSummaries.slice(0, Math.min(8, context.biomarkerSummaries.length));

  const biomarkerFindings = findingSources.slice(0, 12).map((summary) => ({
    biomarkerId: summary.biomarkerId,
    name: summary.shortName || summary.name,
    category: summary.category,
    value: summary.value,
    unit: summary.unit,
    status: summary.status,
    testedAt: summary.testedAt,
    previousValue: summary.previousValue,
    previousTestedAt: summary.previousTestedAt,
    trend:
      summary.trend === "worsening"
        ? ("worsening" as const)
        : summary.trend === "improving"
          ? ("improving" as const)
          : summary.trend === "stable"
            ? ("stable" as const)
            : ("unknown" as const),
    changePercent: summary.changePercent,
    interpretation: biomarkerInterpretation(summary),
    priority: findingPriority(summary),
  }));

  const riskPatterns = detectOrganCareRiskPatterns(context.biomarkerSummaries, context.healthScores);
  const weakestCategories = [...context.healthScores.categories]
    .filter((c) => c.hasData)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const recommendations: OrganCareAIReport["recommendations"] = [
    {
      category: "follow_up",
      priority: overallRisk === "high" || overallRisk === "elevated" ? "high" : "medium",
      action: "Book a GP review of your organ and metabolic blood panel.",
      rationale: "Your latest results include markers that benefit from clinical interpretation in context of symptoms and history.",
    },
    {
      category: "testing",
      priority: "medium",
      action: context.resultsStale
        ? "Repeat blood testing: your latest results are more than 6 months old."
        : "Schedule repeat labs in 3–6 months for trending markers.",
      rationale: "Serial testing helps distinguish one-off fluctuations from meaningful change.",
    },
    {
      category: "lifestyle",
      priority: "medium",
      action: "Prioritise sleep, movement and Mediterranean-style nutrition.",
      rationale: "These foundations support liver, metabolic and cardiovascular markers between tests.",
    },
  ];

  if (weakestCategories[0]) {
    recommendations.push({
      category: "monitoring",
      priority: "medium",
      action: `Track progress in ${weakestCategories[0].name.toLowerCase()} at your next test.`,
      rationale: `${weakestCategories[0].name} currently scores ${weakestCategories[0].score}/100.`,
    });
  }

  const shell: OrganCareAIReport = {
    reportTitle: "Organ & Metabolic Care Report",
    overallHealthScore: overall,
    overallRisk,
    executiveSummary: `Your overall organ and metabolic health score is ${overall}/100 (${overallRisk} risk profile). This report summarises ${context.biomarkerCount} biomarkers across liver, kidney, heart, thyroid, hormone and metabolic systems using your latest available results${context.dataDate ? ` from ${context.dataDate.slice(0, 10)}` : ""}.`,
    clinicalContext:
      attention.length > 0
        ? `${attention.length} marker${attention.length === 1 ? "" : "s"} need closer attention based on current ranges or recent trends. Patterns below highlight where multiple systems may be interacting.`
        : "Most tracked markers are within expected ranges. Continue preventive monitoring and repeat testing as recommended by your care team.",
    categoryScores: [],
    biomarkerFindings,
    riskPatterns,
    recommendations,
    questionsForCareTeam: [
      "Which of my out-of-range markers should we retest first?",
      "Do any of these patterns suggest referral to a specialist?",
      "What lifestyle or medication changes are appropriate for my results?",
    ],
    retestingGuidance: context.resultsStale
      ? "Your latest panel is over 6 months old, repeat comprehensive bloods soon for an up-to-date assessment."
      : "Repeat key markers in 3–6 months, or sooner if your GP advises based on symptoms.",
    urgentActions: context.biomarkerSummaries.some((s) => s.status === "critical")
      ? ["Contact your GP promptly about critical-range results."]
      : [],
    limitations: [
      "This report is educational and based on available lab data only; it is not a diagnosis or treatment plan.",
    ],
    analysisTimestamp: new Date().toISOString(),
    aiProvider: "claude",
    aiModel: "deterministic-fallback",
  };

  return enrichOrganCareReport(shell, context);
}

export function normalizeOrganCareReport(
  report: Partial<OrganCareAIReport> | null | undefined,
  context?: OrganCareReportContext
): OrganCareAIReport | null {
  const sanitized = sanitizeOrganCareReport(report);
  if (!sanitized) return null;
  if (context) {
    return enrichOrganCareReport(sanitized, context);
  }
  return sanitized;
}

export async function generateOrganCareReport(context: OrganCareReportContext): Promise<{
  report: OrganCareAIReport;
  usedFallback: boolean;
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { report: buildDeterministicOrganCareReport(context), usedFallback: true };
  }

  try {
    const raw = await generateOrganCareClaudeReport(
      buildOrganCareReportPrompt(context),
      context.healthScores.overall
    );
    assertOrganCareReportUsable(raw);
    return { report: enrichOrganCareReport(raw, context), usedFallback: false };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[organ-care/ai-report] Claude failed, using deterministic fallback:", detail);
    return { report: buildDeterministicOrganCareReport(context), usedFallback: true };
  }
}

export function enrichOrganCareReport(
  report: OrganCareAIReport,
  context: OrganCareReportContext
): OrganCareAIReport {
  const scoreByCategory = new Map(
    context.healthScores.categories.map((c) => [c.id, c])
  );

  const categoryScores = healthTestsConfig
    .filter((test) => {
      const computed = scoreByCategory.get(test.id);
      return computed?.hasData;
    })
    .map((test) => {
      const computed = scoreByCategory.get(test.id)!;
      const aiCategory = report.categoryScores?.find((c) => c.category === test.id);
      return {
        category: test.id as OrganCareCategoryKey,
        label: test.name,
        score: computed.score,
        status: categoryStatusFromScore(computed.score, computed.outOfRange),
        trend: mapTrendToCategoryTrend(computed.trend),
        summary: aiCategory?.summary || `${computed.name} score ${computed.score}/100`,
        biomarkersTracked: computed.optimal + computed.normal + computed.outOfRange,
      };
    });

  return {
    ...report,
    overallHealthScore: context.healthScores.overall,
    categoryScores,
    aiProvider: report.aiProvider || "claude",
    aiModel: report.aiModel || CLAUDE_MODEL,
    analysisTimestamp: report.analysisTimestamp || new Date().toISOString(),
    biomarkerFindings: Array.isArray(report.biomarkerFindings) ? report.biomarkerFindings : [],
    riskPatterns: Array.isArray(report.riskPatterns) ? report.riskPatterns : [],
    recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    questionsForCareTeam: Array.isArray(report.questionsForCareTeam) ? report.questionsForCareTeam : [],
    urgentActions: Array.isArray(report.urgentActions) ? report.urgentActions : [],
    limitations: Array.isArray(report.limitations) ? report.limitations : [],
  };
}
