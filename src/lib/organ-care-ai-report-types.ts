export type OrganCareCategoryKey =
  | "liver"
  | "kidney"
  | "heart"
  | "thyroid"
  | "hormones"
  | "metabolic";

export type OrganCareAIReport = {
  aiProvider?: "claude";
  aiModel?: string;
  reportTitle: string;
  overallHealthScore: number;
  overallRisk: "low" | "moderate" | "elevated" | "high";
  executiveSummary: string;
  clinicalContext: string;
  categoryScores: Array<{
    category: OrganCareCategoryKey;
    label: string;
    score: number;
    status: "optimal" | "watch" | "needs_attention";
    trend: "improving" | "stable" | "declining" | "unknown";
    summary: string;
    biomarkersTracked: number;
  }>;
  biomarkerFindings: Array<{
    biomarkerId: string;
    name: string;
    category: string;
    value: number;
    unit: string;
    status: string;
    testedAt: string;
    previousValue?: number | null;
    previousTestedAt?: string | null;
    trend?: "improving" | "stable" | "worsening" | "unknown";
    changePercent?: number | null;
    interpretation: string;
    priority: "low" | "medium" | "high";
  }>;
  riskPatterns: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    involvedBiomarkers: string[];
    explanation: string;
    monitoringAdvice: string;
  }>;
  recommendations: Array<{
    category: "medical" | "testing" | "lifestyle" | "nutrition" | "monitoring" | "follow_up";
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

function overallRiskFromScore(score: number): OrganCareAIReport["overallRisk"] {
  if (score >= 75) return "low";
  if (score >= 60) return "moderate";
  if (score >= 45) return "elevated";
  return "high";
}

/** Client-safe sanitizer, ensures arrays/fields exist before rendering. */
export function sanitizeOrganCareReport(
  report: Partial<OrganCareAIReport> | null | undefined
): OrganCareAIReport | null {
  if (!report || typeof report !== "object") return null;

  const score = Number(report.overallHealthScore) || 0;

  return {
    reportTitle: report.reportTitle || "Organ & Metabolic Care Report",
    overallHealthScore: score,
    overallRisk: report.overallRisk || overallRiskFromScore(score),
    executiveSummary: report.executiveSummary || "Report summary unavailable.",
    clinicalContext: report.clinicalContext || "",
    categoryScores: Array.isArray(report.categoryScores) ? report.categoryScores : [],
    biomarkerFindings: Array.isArray(report.biomarkerFindings) ? report.biomarkerFindings : [],
    riskPatterns: Array.isArray(report.riskPatterns) ? report.riskPatterns : [],
    recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    questionsForCareTeam: Array.isArray(report.questionsForCareTeam)
      ? report.questionsForCareTeam
      : [],
    retestingGuidance: report.retestingGuidance || "Repeat testing as advised by your GP.",
    urgentActions: Array.isArray(report.urgentActions) ? report.urgentActions : [],
    limitations: Array.isArray(report.limitations) ? report.limitations : [],
    analysisTimestamp: report.analysisTimestamp || new Date().toISOString(),
    aiProvider: report.aiProvider,
    aiModel: report.aiModel,
  };
}
