import { biomarkerDefinitions, getBiomarkerById } from "@/data/biomarkers";

export type OrganType = "liver" | "heart" | "kidney" | "thyroid" | "hormone";

export type RecommendationCategory =
  | "diet"
  | "exercise"
  | "supplement"
  | "lifestyle"
  | "medical"
  | "nutrition"
  | "testing"
  | "general";

export interface NormalizedRecommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: "high" | "medium" | "low";
  actionItems: string[];
  relatedBiomarkers: string[];
  timeframe?: string;
  impact?: string;
}

export interface NormalizedBiomarkerGoal {
  id: string;
  biomarkerId: string;
  biomarkerName: string;
  reason: string;
  suggestedTarget: number;
  currentValue: number;
  unit: string;
  priority: "high" | "medium" | "low";
}

export interface NormalizedOrganAnalysis {
  summary?: string;
  insights: string[];
  recommendations: NormalizedRecommendation[];
  biomarkerGoals: NormalizedBiomarkerGoal[];
}

export const ORGAN_CONFIG: Record<
  OrganType,
  {
    label: string;
    biomarkerCategory: string;
    apiPath: string;
    method: "GET" | "POST";
    defaultBiomarkerId: string;
  }
> = {
  liver: {
    label: "Liver",
    biomarkerCategory: "LIVER",
    apiPath: "/api/liver-analysis",
    method: "GET",
    defaultBiomarkerId: "alt",
  },
  heart: {
    label: "Heart",
    biomarkerCategory: "HEART",
    apiPath: "/api/heart-analysis",
    method: "GET",
    defaultBiomarkerId: "ldl_cholesterol",
  },
  kidney: {
    label: "Kidney",
    biomarkerCategory: "KIDNEY",
    apiPath: "/api/kidney-analysis",
    method: "GET",
    defaultBiomarkerId: "egfr",
  },
  thyroid: {
    label: "Thyroid",
    biomarkerCategory: "THYROID",
    apiPath: "/api/thyroid-analysis",
    method: "GET",
    defaultBiomarkerId: "tsh",
  },
  hormone: {
    label: "Hormone",
    biomarkerCategory: "HORMONES",
    apiPath: "/api/hormone-analysis",
    method: "POST",
    defaultBiomarkerId: "testosterone_total",
  },
};

function inferCategory(text: string): RecommendationCategory {
  const lower = text.toLowerCase();
  if (/diet|eat|food|nutrition|carb|protein|meal|fasting/.test(lower)) return "diet";
  if (/exercise|walk|train|cardio|strength|activity|steps/.test(lower)) return "exercise";
  if (/supplement|vitamin|mineral|omega|nac|milk thistle/.test(lower)) return "supplement";
  if (/test|retest|monitor|screen|follow.?up/.test(lower)) return "testing";
  if (/doctor|physician|medical|medication|refer/.test(lower)) return "medical";
  if (/sleep|stress|alcohol|smok|lifestyle|hydrat/.test(lower)) return "lifestyle";
  return "general";
}

function titleFromText(text: string, fallback: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 72) return trimmed;
  const sentence = trimmed.split(/[.!?]/)[0]?.trim();
  if (sentence && sentence.length <= 72) return sentence;
  return fallback;
}

function resolveBiomarkerId(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  const exact = biomarkerDefinitions.find(
    b =>
      b.id === normalized ||
      b.name.toLowerCase() === normalized ||
      b.shortName.toLowerCase() === normalized
  );
  if (exact) return exact.id;

  const fuzzy = biomarkerDefinitions.find(
    b =>
      normalized.includes(b.name.toLowerCase()) ||
      b.name.toLowerCase().includes(normalized)
  );
  return fuzzy?.id ?? null;
}

function suggestedTargetForBiomarker(
  biomarkerId: string,
  currentValue: number,
  gender: "male" | "female" = "male"
): number {
  const biomarker = getBiomarkerById(biomarkerId);
  if (!biomarker) return currentValue;

  const range = biomarker.ranges[gender];
  if (currentValue > range.optimal_high) {
    return range.optimal_high;
  }
  if (currentValue < range.optimal_low) {
    return range.optimal_low;
  }
  return range.optimal_high > 0 ? range.optimal_high : range.optimal_low;
}

function mapHormoneCategory(
  category: string
): RecommendationCategory {
  switch (category) {
    case "nutrition":
      return "nutrition";
    case "lifestyle":
      return "lifestyle";
    case "supplement":
      return "supplement";
    case "medical":
      return "medical";
    case "testing":
      return "testing";
    default:
      return "general";
  }
}

function normalizeStandardAnalysis(
  data: Record<string, unknown>,
  organ: OrganType
): NormalizedOrganAnalysis {
  const recommendations: NormalizedRecommendation[] = [];
  const biomarkerGoals: NormalizedBiomarkerGoal[] = [];
  const seenGoalIds = new Set<string>();

  const urgentActions = (data.urgentActions as string[] | undefined) ?? [];
  urgentActions.forEach((text, index) => {
    recommendations.push({
      id: `${organ}-urgent-${index}`,
      title: titleFromText(text, "Urgent action required"),
      description: text,
      category: "medical",
      priority: "high",
      actionItems: [text],
      relatedBiomarkers: [],
    });
  });

  const lifestyleRecommendations =
    (data.lifestyleRecommendations as string[] | undefined) ?? [];
  lifestyleRecommendations.forEach((text, index) => {
    recommendations.push({
      id: `${organ}-lifestyle-${index}`,
      title: titleFromText(text, "Personalized recommendation"),
      description: text,
      category: inferCategory(text),
      priority: "medium",
      actionItems: [text],
      relatedBiomarkers: [],
      timeframe: "4–12 weeks",
    });
  });

  const predictions = (data.predictions as Array<{
    condition?: string;
    probability?: number;
    timeframe?: string;
    recommendations?: string[];
    keyFactors?: string[];
  }> | undefined) ?? [];

  predictions.forEach((prediction, pIndex) => {
    (prediction.recommendations ?? []).forEach((text, rIndex) => {
      recommendations.push({
        id: `${organ}-prediction-${pIndex}-${rIndex}`,
        title: prediction.condition || "Prevention focus",
        description: text,
        category: inferCategory(text),
        priority: (prediction.probability ?? 0) >= 50 ? "high" : "medium",
        actionItems: [text],
        relatedBiomarkers: (prediction.keyFactors ?? [])
          .map(resolveBiomarkerId)
          .filter((id): id is string => !!id),
        timeframe: prediction.timeframe,
        impact: prediction.condition,
      });
    });
  });

  const riskFactors = (data.riskFactors as Array<{
    name?: string;
    currentRisk?: number;
    contributingBiomarkers?: Array<{
      name: string;
      value: number;
      unit: string;
      status: string;
    }>;
  }> | undefined) ?? [];

  riskFactors.forEach((factor, fIndex) => {
    (factor.contributingBiomarkers ?? []).forEach((bio, bIndex) => {
      if (!["borderline", "elevated", "critical"].includes(bio.status)) return;

      const biomarkerId = resolveBiomarkerId(bio.name);
      if (!biomarkerId || seenGoalIds.has(biomarkerId)) return;

      const definition = getBiomarkerById(biomarkerId);
      seenGoalIds.add(biomarkerId);

      biomarkerGoals.push({
        id: `${organ}-bio-${fIndex}-${bIndex}`,
        biomarkerId,
        biomarkerName: definition?.name ?? bio.name,
        reason: `${bio.name} is ${bio.status.replace("_", " ")} (${bio.value} ${bio.unit}) — ${factor.name ?? "risk factor"}`,
        suggestedTarget: suggestedTargetForBiomarker(biomarkerId, bio.value),
        currentValue: bio.value,
        unit: bio.unit || definition?.ranges.male.unit || "",
        priority: bio.status === "critical" ? "high" : bio.status === "elevated" ? "high" : "medium",
      });
    });
  });

  const insights = (data.personalizedInsights as string[] | undefined) ?? [];

  return {
    summary: data.summary as string | undefined,
    insights,
    recommendations,
    biomarkerGoals,
  };
}

function normalizeHormoneAnalysis(data: Record<string, unknown>): NormalizedOrganAnalysis {
  const recommendations: NormalizedRecommendation[] = [];
  const biomarkerGoals: NormalizedBiomarkerGoal[] = [];
  const seenGoalIds = new Set<string>();

  const urgentActions = (data.urgentActions as string[] | undefined) ?? [];
  urgentActions.forEach((text, index) => {
    recommendations.push({
      id: `hormone-urgent-${index}`,
      title: titleFromText(text, "Urgent action required"),
      description: text,
      category: "medical",
      priority: "high",
      actionItems: [text],
      relatedBiomarkers: [],
    });
  });

  const hormoneRecs = (data.recommendations as Array<{
    category?: string;
    priority?: string;
    action?: string;
    rationale?: string;
  }> | undefined) ?? [];

  hormoneRecs.forEach((rec, index) => {
    recommendations.push({
      id: `hormone-rec-${index}`,
      title: rec.action || "Hormone recommendation",
      description: rec.rationale || rec.action || "",
      category: mapHormoneCategory(rec.category || "general"),
      priority: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
      actionItems: [rec.action].filter(Boolean) as string[],
      relatedBiomarkers: [],
    });
  });

  const riskFactors = (data.riskFactors as Array<{
    factor?: string;
    severity?: string;
    explanation?: string;
    biomarkers?: string[];
  }> | undefined) ?? [];

  riskFactors.forEach((factor, fIndex) => {
    (factor.biomarkers ?? []).forEach((biomarkerId, bIndex) => {
      if (seenGoalIds.has(biomarkerId)) return;
      const definition = getBiomarkerById(biomarkerId);
      if (!definition) return;

      seenGoalIds.add(biomarkerId);
      biomarkerGoals.push({
        id: `hormone-bio-${fIndex}-${bIndex}`,
        biomarkerId,
        biomarkerName: definition.name,
        reason: factor.explanation || factor.factor || "AI-identified hormone imbalance",
        suggestedTarget: suggestedTargetForBiomarker(biomarkerId, 0),
        currentValue: 0,
        unit: definition.ranges.male.unit,
        priority: factor.severity === "high" ? "high" : factor.severity === "moderate" ? "medium" : "low",
      });
    });
  });

  const insights = (data.insights as string[] | undefined) ?? [];

  return {
    summary: data.summary as string | undefined,
    insights,
    recommendations,
    biomarkerGoals,
  };
}

export function normalizeOrganAnalysis(
  organ: OrganType,
  raw: unknown
): NormalizedOrganAnalysis | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  if (organ === "hormone") {
    const analysis = (data.analysis as Record<string, unknown> | undefined) ?? data;
    return normalizeHormoneAnalysis(analysis);
  }

  return normalizeStandardAnalysis(data, organ);
}

export function recommendationToGoalPayload(
  recommendation: NormalizedRecommendation,
  organ: OrganType,
  currentResults: Array<{ biomarkerId: string; value: number }>,
  gender: "male" | "female" = "male"
): {
  biomarkerId: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  notes: string;
} | null {
  const config = ORGAN_CONFIG[organ];
  const biomarkerId =
    recommendation.relatedBiomarkers[0] ||
    currentResults[0]?.biomarkerId ||
    config.defaultBiomarkerId;

  const current = currentResults.find(r => r.biomarkerId === biomarkerId);
  if (!current) return null;

  const targetValue = suggestedTargetForBiomarker(biomarkerId, current.value, gender);

  return {
    biomarkerId,
    targetValue,
    currentValue: current.value,
    startValue: current.value,
    notes: `[AI:${recommendation.id}] ${recommendation.title}: ${recommendation.description}`,
  };
}
