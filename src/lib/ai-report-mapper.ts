import type { AIInsight, PersonalizedReport } from "@/types";

type RawFinding = { type?: string; finding?: string; impact?: string };
type RawRecommendation = {
  priority?: string;
  category?: string;
  recommendation?: string;
  rationale?: string;
};
type RawRisk = { risk?: string; severity?: string; mitigation?: string };
type RawAchievement = { achievement?: string };

function toInsight(
  item: RawFinding | RawRecommendation | RawAchievement,
  type: AIInsight["type"],
  index: number,
  titleKey: "finding" | "recommendation" | "achievement" = "finding"
): AIInsight {
  const title =
    (item as RawFinding).finding ??
    (item as RawRecommendation).recommendation ??
    (item as RawAchievement).achievement ??
    "Insight";
  const description =
    (item as RawRecommendation).rationale ??
    (item as RawFinding).finding ??
    title;

  return {
    id: `${type}-${index}`,
    type,
    title,
    description,
    priority: ((item as RawFinding).impact ??
      (item as RawRecommendation).priority ??
      "medium") as AIInsight["priority"],
    relatedBiomarkers: [],
    actionItems: (item as RawRecommendation).recommendation
      ? [(item as RawRecommendation).recommendation!]
      : undefined,
  };
}

export function mapApiReportToPersonalizedReport(
  userId: string,
  report: {
    generatedAt?: Date | string;
    summary: string;
    keyFindings?: unknown;
    correlations?: unknown;
    recommendations?: unknown;
    achievements?: unknown;
    projectedImprovements?: unknown;
    nextSteps?: unknown;
    riskFactors?: unknown;
  }
): PersonalizedReport {
  const keyFindings = Array.isArray(report.keyFindings)
    ? (report.keyFindings as RawFinding[]).map((f, i) =>
        toInsight(f, f.type === "negative" ? "warning" : "trend", i)
      )
    : [];

  const recommendations = Array.isArray(report.recommendations)
    ? (report.recommendations as RawRecommendation[]).map((r, i) =>
        toInsight(r, "recommendation", i, "recommendation")
      )
    : [];

  const achievements = Array.isArray(report.achievements)
    ? (report.achievements as RawAchievement[]).map((a, i) =>
        toInsight(a, "achievement", i, "achievement")
      )
    : [];

  const correlations = Array.isArray(report.correlations)
    ? (report.correlations as RawFinding[]).map((c, i) =>
        toInsight(c, "correlation", i)
      )
    : [];

  const projectedImprovements = Array.isArray(report.projectedImprovements)
    ? (report.projectedImprovements as RawFinding[]).map((p, i) =>
        toInsight(p, "trend", i)
      )
    : [];

  const riskFactors = Array.isArray(report.riskFactors)
    ? (report.riskFactors as RawRisk[]).map((r) => ({
        factor: r.risk ?? "Risk factor",
        severity: (r.severity ?? "medium") as "low" | "medium" | "high",
        relatedBiomarkers: [] as string[],
        mitigation: r.mitigation ?? "",
      }))
    : [];

  const nextSteps = Array.isArray(report.nextSteps)
    ? (report.nextSteps as string[])
    : recommendations.slice(0, 3).map((r) => r.title);

  return {
    userId,
    generatedAt:
      typeof report.generatedAt === "string"
        ? report.generatedAt
        : report.generatedAt?.toISOString() ?? new Date().toISOString(),
    summary: report.summary,
    keyFindings,
    correlations,
    recommendations,
    achievements,
    projectedImprovements,
    nextSteps,
    riskFactors,
  };
}
