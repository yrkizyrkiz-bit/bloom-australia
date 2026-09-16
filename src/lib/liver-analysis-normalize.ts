export interface NormalizedRiskFactor {
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

export interface NormalizedHealthPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

export interface NormalizedLiverAnalysis {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  riskFactors: NormalizedRiskFactor[];
  predictions: NormalizedHealthPrediction[];
  personalizedInsights: string[];
  urgentActions: string[];
  lifestyleRecommendations: string[];
  analyzedAt?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function slugId(text: string, fallback: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function severityToRisk(severity: unknown): number {
  if (typeof severity === "number" && Number.isFinite(severity)) return Math.max(0, Math.min(100, severity));
  const s = String(severity || "").toLowerCase();
  if (s === "low" || s === "mild") return 18;
  if (s === "moderate" || s === "medium") return 38;
  if (s === "elevated") return 55;
  if (s === "high" || s === "severe" || s === "critical") return 72;
  return 0;
}

function normalizeRiskFactor(raw: unknown, index: number): NormalizedRiskFactor {
  const row = asRecord(raw);
  const name = String(row.name || row.factor || `Risk factor ${index + 1}`);
  const currentRisk = Number.isFinite(Number(row.currentRisk))
    ? Number(row.currentRisk)
    : severityToRisk(row.severity);
  const contributing = Array.isArray(row.contributingBiomarkers)
    ? row.contributingBiomarkers.map((item) => {
        const bio = asRecord(item);
        return {
          name: String(bio.name || ""),
          value: Number(bio.value) || 0,
          unit: String(bio.unit || ""),
          status: (bio.status as NormalizedRiskFactor["contributingBiomarkers"][number]["status"]) || "optimal",
          impact: Number(bio.impact) || 0,
        };
      })
    : [];

  const category = row.category;
  const validCategory =
    category === "metabolic" ||
    category === "cardiovascular" ||
    category === "inflammation" ||
    category === "liver"
      ? category
      : "liver";

  const trend = row.trend;
  const validTrend =
    trend === "improving" || trend === "worsening" || trend === "stable" ? trend : "stable";

  return {
    id: String(row.id || slugId(name, `factor-${index}`)),
    name,
    category: validCategory,
    currentRisk,
    previousRisk: Number.isFinite(Number(row.previousRisk)) ? Number(row.previousRisk) : currentRisk,
    trend: validTrend,
    contributingBiomarkers: contributing,
    timeToRisk: typeof row.timeToRisk === "string" ? row.timeToRisk : undefined,
    preventionPotential: Number(row.preventionPotential) || 0,
    explanation: String(row.explanation || row.detail || ""),
  };
}

function normalizePrediction(raw: unknown, index: number): NormalizedHealthPrediction {
  const row = asRecord(raw);
  const keyFactors = Array.isArray(row.keyFactors)
    ? asStringArray(row.keyFactors)
    : typeof row.detail === "string" && row.detail.trim()
      ? [row.detail.trim()]
      : [];

  return {
    condition: String(row.condition || row.prediction || `Prediction ${index + 1}`),
    probability: Number.isFinite(Number(row.probability)) ? Number(row.probability) : 0,
    timeframe: String(row.timeframe || ""),
    preventable: Boolean(row.preventable),
    keyFactors,
    recommendations: asStringArray(row.recommendations),
  };
}

/** Map cached/AI liver reports onto the Risk Assessment UI shape. */
export function normalizeLiverAnalysis(raw: unknown): NormalizedLiverAnalysis {
  const row = asRecord(raw);
  const overallRiskScore = Number(row.overallRiskScore);
  if (!Number.isFinite(overallRiskScore)) {
    throw new Error("Missing overallRiskScore in response");
  }

  return {
    overallRiskScore,
    previousOverallRisk: Number.isFinite(Number(row.previousOverallRisk))
      ? Number(row.previousOverallRisk)
      : overallRiskScore,
    summary: String(row.summary || ""),
    riskFactors: Array.isArray(row.riskFactors)
      ? row.riskFactors.map((item, index) => normalizeRiskFactor(item, index))
      : [],
    predictions: Array.isArray(row.predictions)
      ? row.predictions.map((item, index) => normalizePrediction(item, index))
      : [],
    personalizedInsights: asStringArray(row.personalizedInsights),
    urgentActions: asStringArray(row.urgentActions),
    lifestyleRecommendations: asStringArray(row.lifestyleRecommendations),
    analyzedAt: typeof row.analyzedAt === "string" ? row.analyzedAt : undefined,
  };
}
