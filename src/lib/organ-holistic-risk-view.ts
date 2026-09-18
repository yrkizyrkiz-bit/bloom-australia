import type {
  HolisticHealthReport,
  HolisticMarkerItem,
  HolisticOrganSystem,
  HolisticPriorityBand,
} from "@/lib/holistic-health-report-types";
import {
  combinedTrendStatusLabel,
  combinedTrendStatusTone,
  isGpHandoffCopy,
  rangeWordFromStatus,
  stripGpHandoffLanguage,
  type CombinedTrendInput,
  type CombinedTrendTone,
} from "@/lib/holistic-patient-language";
import { normalizeHolisticGoalKey } from "@/lib/holistic-health-report-types";

export type OrganPanelId = "liver" | "heart" | "kidney";

export const ORGAN_BIOMARKER_IDS: Record<OrganPanelId, readonly string[]> = {
  liver: ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin", "platelets"],
  kidney: [
    "creatinine",
    "egfr",
    "bun",
    "uacr",
    "potassium",
    "sodium",
    "calcium",
    "phosphorus",
    "bicarbonate",
    "pth",
  ],
  heart: [
    "total_cholesterol",
    "ldl_cholesterol",
    "hdl_cholesterol",
    "triglycerides",
    "crp",
    "homocysteine",
    "glucose",
    "hba1c",
  ],
};

function biomarkerIdsForOrgan(organ: OrganPanelId): Set<string> {
  return new Set(ORGAN_BIOMARKER_IDS[organ]);
}

export type OrganRiskFactorView = {
  id: string;
  name: string;
  currentRisk: number;
  trend: "improving" | "stable" | "worsening";
  trendLabel: string;
  trendTone: CombinedTrendTone;
  explanation: string;
  contributingBiomarkers: Array<{
    name: string;
    value: string;
    unit: string;
    status: string;
    trendLabel: string;
  }>;
};

export type OrganRiskAssessmentView = {
  healthScore: number;
  riskScore: number;
  riskLabel: "Low" | "Moderate" | "Elevated" | "High";
  trend: HolisticOrganSystem["trend"];
  trendLabel: string;
  trendTone: CombinedTrendTone;
  status: HolisticOrganSystem["status"];
  summary: string;
  riskFactorLead: string;
  riskFactors: OrganRiskFactorView[];
  insights: string[];
  urgentActions: string[];
  watchItems: Array<{ title: string; explanation: string; advice: string }>;
  analyzedAt: string;
  biomarkersTracked: number;
};

const ORGAN_KEYWORDS: Record<OrganPanelId, string[]> = {
  liver: ["liver", "alt", "ast", "ggt", "alp", "bilirubin", "albumin", "hepatic", "bile"],
  heart: [
    "heart",
    "cardio",
    "cholesterol",
    "ldl",
    "hdl",
    "triglyceride",
    "crp",
    "inflammation",
    "blood pressure",
    "ascvd",
  ],
  kidney: [
    "kidney",
    "egfr",
    "creatinine",
    "urea",
    "bun",
    "albumin",
    "electrolyte",
    "ckd",
    "filter",
  ],
};

function textMentionsOrgan(text: string, organ: OrganPanelId): boolean {
  const lower = text.toLowerCase();
  return ORGAN_KEYWORDS[organ].some((keyword) => lower.includes(keyword));
}

function allMarkers(report: HolisticHealthReport): HolisticMarkerItem[] {
  return [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
    ...report.priorityBands.good,
  ];
}

function markerForOrgan(
  marker: HolisticMarkerItem,
  organ: OrganPanelId,
  ids: Set<string>
): boolean {
  if (ids.has(marker.biomarkerId)) return true;
  const category = (marker.category || "").toLowerCase();
  return category === organ || category.includes(organ);
}

function riskPercentFromBand(band: HolisticPriorityBand): number {
  switch (band) {
    case "immediate":
      return 82;
    case "needs_attention":
      return 58;
    case "look_out":
      return 36;
    default:
      return 14;
  }
}

function riskPercentFromStatus(status: HolisticOrganSystem["status"]): number {
  if (status === "needs_attention") return 62;
  if (status === "watch") return 38;
  return 16;
}

function trendFromMarker(trend?: HolisticMarkerItem["trend"]): OrganRiskFactorView["trend"] {
  if (trend === "improving") return "improving";
  if (trend === "worsening" || trend === "declining") return "worsening";
  return "stable";
}

function trendCopy(input: CombinedTrendInput): { trendLabel: string; trendTone: CombinedTrendTone } {
  return {
    trendLabel: combinedTrendStatusLabel(input),
    trendTone: combinedTrendStatusTone(input),
  };
}

function contributingFromMarker(marker: HolisticMarkerItem) {
  const status = marker.status || marker.band.replaceAll("_", " ");
  return {
    name: marker.name,
    value: String(marker.value),
    unit: marker.unit || "",
    status,
    trendLabel: combinedTrendStatusLabel({
      trend: marker.trend,
      status,
      band: marker.band,
      value: marker.value,
      previousValue: marker.previousValue,
    }),
  };
}

function markerInRange(marker: Pick<HolisticMarkerItem, "status" | "band">): boolean {
  const range = rangeWordFromStatus(marker.status, marker.band);
  return range === "optimal" || range === "normal";
}

function titleFromNarrative(text: string, fallback: string): string {
  const beforeColon = text.split(":")[0]?.trim() ?? "";
  if (beforeColon && beforeColon.length <= 48 && beforeColon !== text.trim()) return beforeColon;
  const sentence = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
  if (sentence && sentence.length <= 72) return sentence.replace(/\.$/, "");
  return fallback;
}

function sameMemberAction(a?: string | null, b?: string | null): boolean {
  const left = normalizeHolisticGoalKey(a || "");
  const right = normalizeHolisticGoalKey(b || "");
  if (!left || !right) return false;
  if (left === right) return true;
  return left.length > 16 && right.length > 16 && (left.includes(right) || right.includes(left));
}

function patientFacingAdvice(text?: string | null): string {
  return stripGpHandoffLanguage((text || "").trim());
}

function matchesIdentifiedGoal(text: string, goals: string[]): boolean {
  return goals.some((goal) => sameMemberAction(text, goal));
}

function uniqueLines(lines: Array<string | undefined | null>, already: string[] = []): string[] {
  const seen = new Set(
    already.map((line) => line.toLowerCase().replace(/\s+/g, " ").trim()).filter(Boolean)
  );
  const out: string[] = [];
  for (const line of lines) {
    const text = (line || "").trim();
    if (!text) continue;
    const key = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export function riskLevelFromScore(riskScore: number): {
  label: OrganRiskAssessmentView["riskLabel"];
  color: string;
  bgColor: string;
  lightBg: string;
} {
  if (riskScore < 20) {
    return { label: "Low", color: "text-emerald-600", bgColor: "bg-emerald-500", lightBg: "bg-emerald-50" };
  }
  if (riskScore < 40) {
    return { label: "Moderate", color: "text-amber-600", bgColor: "bg-amber-500", lightBg: "bg-amber-50" };
  }
  if (riskScore < 60) {
    return { label: "Elevated", color: "text-orange-600", bgColor: "bg-orange-500", lightBg: "bg-orange-50" };
  }
  return { label: "High", color: "text-red-600", bgColor: "bg-red-500", lightBg: "bg-red-50" };
}

export function buildOrganRiskAssessmentView(
  report: HolisticHealthReport,
  organ: HolisticOrganSystem,
  organId: OrganPanelId
): OrganRiskAssessmentView {
  const ids = biomarkerIdsForOrgan(organId);
  const organMarkers = allMarkers(report).filter((marker) =>
    markerForOrgan(marker, organId, ids)
  );
  const flagged = organMarkers.filter((marker) => marker.band !== "good");
  const inRangeMoved = organMarkers.filter(
    (marker) =>
      markerInRange(marker) &&
      (marker.trend === "worsening" || marker.trend === "improving")
  );
  const healthScore = Math.max(0, Math.min(100, Math.round(organ.score)));
  const riskScore = Math.max(0, Math.min(100, 100 - healthScore));
  const organTrend = trendCopy({ trend: organ.trend, status: organ.status });
  const identifiedGoals = report.organSystems
    .map((system) => system.goal?.trim() || "")
    .filter(Boolean);

  const factors: OrganRiskFactorView[] = [];

  if (organ.riskFactor?.trim()) {
    const related = [...flagged, ...inRangeMoved]
      .filter(
        (marker, index, list) => list.findIndex((row) => row.biomarkerId === marker.biomarkerId) === index
      )
      .slice(0, 4);
    const primaryTrend: OrganRiskFactorView["trend"] =
      organ.trend === "improving"
        ? "improving"
        : organ.trend === "declining"
          ? "worsening"
          : "stable";
    factors.push({
      id: "primary",
      name: titleFromNarrative(organ.riskFactor, `${organ.label} risk factor`),
      currentRisk: riskPercentFromStatus(organ.status),
      trend: primaryTrend,
      ...organTrend,
      explanation: organ.riskFactor.trim(),
      contributingBiomarkers: related.map(contributingFromMarker),
    });
  }

  const markerFactors = [...flagged, ...inRangeMoved].filter(
    (marker, index, list) => list.findIndex((row) => row.biomarkerId === marker.biomarkerId) === index
  );

  for (const marker of markerFactors) {
    const alreadyCovered = factors.some(
      (factor) =>
        factor.id === marker.biomarkerId ||
        factor.name.toLowerCase().includes(marker.name.toLowerCase()) ||
        factor.explanation.toLowerCase().includes(marker.name.toLowerCase())
    );
    if (alreadyCovered) continue;
    const status = marker.status || marker.band.replaceAll("_", " ");
    const copy = trendCopy({
      trend: marker.trend,
      status,
      band: marker.band,
      value: marker.value,
      previousValue: marker.previousValue,
    });
    factors.push({
      id: marker.biomarkerId,
      name: marker.name,
      currentRisk: markerInRange(marker)
        ? Math.min(22, riskPercentFromBand(marker.band))
        : riskPercentFromBand(marker.band),
      trend: trendFromMarker(marker.trend),
      ...copy,
      explanation: marker.plainEnglish,
      contributingBiomarkers: [contributingFromMarker(marker)],
    });
  }

  const gaps = uniqueLines(organ.gaps || [], [
    organ.riskFactor || "",
    ...factors.map((factor) => factor.explanation),
  ]);
  gaps.forEach((gap, index) => {
    const copy = trendCopy({ trend: "stable", status: organ.status });
    factors.push({
      id: `gap-${index}`,
      name: titleFromNarrative(gap, `${organ.label} gap`),
      currentRisk: Math.min(70, riskPercentFromStatus(organ.status) + 8),
      trend: "stable",
      ...copy,
      explanation: gap,
      contributingBiomarkers: [],
    });
  });

  const insights = uniqueLines([...(organ.highlights || []), ...gaps], [
    organ.riskFactor || "",
    organ.summary || "",
  ]).slice(0, 3);

  const urgentFromReport = (report.urgentActions || [])
    .filter((action) => textMentionsOrgan(action, organId) && !isGpHandoffCopy(action))
    .map(patientFacingAdvice)
    .filter((action) => action && !matchesIdentifiedGoal(action, identifiedGoals));
  const urgentActions = uniqueLines(urgentFromReport).slice(0, 4);

  const watchItems = report.crossSystemPatterns
    .filter((pattern) => pattern.involvedSystems.includes(organId))
    .slice(0, 4)
    .map((pattern) => ({
      title: pattern.title,
      explanation: patientFacingAdvice(pattern.explanation),
      advice:
        isGpHandoffCopy(pattern.monitoringAdvice) ||
        matchesIdentifiedGoal(pattern.monitoringAdvice, identifiedGoals)
          ? ""
          : patientFacingAdvice(pattern.monitoringAdvice),
    }))
    .filter((item) => item.explanation || item.advice);

  return {
    healthScore,
    riskScore,
    riskLabel: riskLevelFromScore(riskScore).label,
    trend: organ.trend,
    trendLabel: organTrend.trendLabel,
    trendTone: organTrend.trendTone,
    status: organ.status,
    summary: organ.summary?.trim() || "",
    riskFactorLead: organ.riskFactor?.trim() || "",
    riskFactors: factors.slice(0, 8),
    insights,
    urgentActions,
    watchItems,
    analyzedAt: report.analysisTimestamp,
    biomarkersTracked: organ.biomarkersTracked || organMarkers.length,
  };
}
