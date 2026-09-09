export type HolisticPriorityBand = "good" | "look_out" | "needs_attention" | "immediate";

export type HolisticOrganSystemId =
  | "liver"
  | "kidney"
  | "heart"
  | "thyroid"
  | "hormones"
  | "metabolic";

export type HolisticMarkerItem = {
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
  plainEnglish: string;
  band: HolisticPriorityBand;
};

export type HolisticOrganSystem = {
  id: HolisticOrganSystemId;
  label: string;
  score: number;
  status: "optimal" | "watch" | "needs_attention";
  trend: "improving" | "stable" | "declining" | "unknown";
  summary: string;
  biomarkersTracked: number;
  highlights: string[];
};

export type HolisticCrossPattern = {
  title: string;
  severity: "low" | "medium" | "high";
  involvedSystems: HolisticOrganSystemId[];
  involvedBiomarkers: string[];
  explanation: string;
  monitoringAdvice: string;
};

export type HolisticProgramContribution = {
  key: string;
  label: string;
  kind: "program" | "scope";
  howItHelpsFutureResults: string;
  markersLikelyToImprove: string[];
  monitoringFocus: string;
};

export type HolisticHealthReport = {
  aiProvider?: "claude" | "deterministic";
  aiModel?: string;
  reportTitle: string;
  overallHealthScore: number;
  overallRisk: "low" | "moderate" | "elevated" | "high";
  executiveSummary: string;
  clinicalContext: string;
  regulatoryNotice: string;
  careTeamHandoffSummary: string;
  priorityBands: {
    good: HolisticMarkerItem[];
    lookOut: HolisticMarkerItem[];
    needsAttention: HolisticMarkerItem[];
    immediate: HolisticMarkerItem[];
  };
  organSystems: HolisticOrganSystem[];
  crossSystemPatterns: HolisticCrossPattern[];
  programContributions: HolisticProgramContribution[];
  recommendations: Array<{
    category: "medical" | "testing" | "lifestyle" | "nutrition" | "monitoring" | "program" | "follow_up";
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

export const AU_REGULATORY_NOTICE =
  "Educational information only. This report does not diagnose, treat, or replace advice from an AHPRA-registered clinician. Urgent or unexplained symptoms need prompt medical care (GP, specialist, or emergency services). Laboratory reference intervals can vary by lab; results are interpreted in an Australian clinical context.";

function overallRiskFromScore(score: number): HolisticHealthReport["overallRisk"] {
  if (score >= 75) return "low";
  if (score >= 60) return "moderate";
  if (score >= 45) return "elevated";
  return "high";
}

export function sanitizeHolisticHealthReport(
  report: Partial<HolisticHealthReport> | null | undefined
): HolisticHealthReport | null {
  if (!report || typeof report !== "object") return null;
  const score = Number(report.overallHealthScore) || 0;

  return {
    aiProvider: report.aiProvider,
    aiModel: report.aiModel,
    reportTitle: report.reportTitle || "Holistic Health Report",
    overallHealthScore: score,
    overallRisk: report.overallRisk || overallRiskFromScore(score),
    executiveSummary: report.executiveSummary || "Report summary unavailable.",
    clinicalContext: report.clinicalContext || "",
    regulatoryNotice: report.regulatoryNotice || AU_REGULATORY_NOTICE,
    careTeamHandoffSummary: report.careTeamHandoffSummary || "",
    priorityBands: {
      good: Array.isArray(report.priorityBands?.good) ? report.priorityBands!.good : [],
      lookOut: Array.isArray(report.priorityBands?.lookOut) ? report.priorityBands!.lookOut : [],
      needsAttention: Array.isArray(report.priorityBands?.needsAttention)
        ? report.priorityBands!.needsAttention
        : [],
      immediate: Array.isArray(report.priorityBands?.immediate)
        ? report.priorityBands!.immediate
        : [],
    },
    organSystems: Array.isArray(report.organSystems) ? report.organSystems : [],
    crossSystemPatterns: Array.isArray(report.crossSystemPatterns)
      ? report.crossSystemPatterns
      : [],
    programContributions: Array.isArray(report.programContributions)
      ? report.programContributions
      : [],
    recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    questionsForCareTeam: Array.isArray(report.questionsForCareTeam)
      ? report.questionsForCareTeam
      : [],
    retestingGuidance: report.retestingGuidance || "",
    urgentActions: Array.isArray(report.urgentActions) ? report.urgentActions : [],
    limitations: Array.isArray(report.limitations) ? report.limitations : [],
    analysisTimestamp: report.analysisTimestamp || new Date().toISOString(),
  };
}
