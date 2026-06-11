import {
  calculateStatusBasedScore,
  calculateTestScore,
  healthTestsConfig,
  type BiomarkerResultInput,
  type HealthTestId,
} from "@/lib/healthTestScoring";

export const ORGAN_TREND_ILLUSTRATION_MESSAGE =
  "This data is for illustration and will be updated once you complete your blood tests.";

export type OrganTrendId = Extract<
  HealthTestId,
  "liver" | "kidney" | "heart" | "thyroid" | "hormones"
>;

export interface OrganTrendCategory {
  key: string;
  name: string;
  biomarkerIds: readonly string[];
}

export interface OrganTrendPoint {
  date: string;
  fullDate: string;
  dateKey: string;
  overall: number;
  categories: Record<string, number>;
}

interface OrganTrendConfig {
  biomarkerIds: readonly string[];
  categories: OrganTrendCategory[];
  primaryColor: string;
  mockData: OrganTrendPoint[];
}

const MOCK_DATES = [
  { dateKey: "2023-06-01", date: "Jun '23", fullDate: "June 2023" },
  { dateKey: "2023-09-01", date: "Sep '23", fullDate: "September 2023" },
  { dateKey: "2023-12-01", date: "Dec '23", fullDate: "December 2023" },
  { dateKey: "2024-03-01", date: "Mar '24", fullDate: "March 2024" },
];

function mockPoint(
  index: number,
  overall: number,
  categories: Record<string, number>
): OrganTrendPoint {
  const d = MOCK_DATES[index];
  return { ...d, overall, categories };
}

export const ORGAN_TREND_CONFIGS: Record<OrganTrendId, OrganTrendConfig> = {
  liver: {
    biomarkerIds: [
      "alt",
      "ast",
      "ggt",
      "alp",
      "bilirubin_total",
      "albumin",
      "platelets",
      "glucose",
      "crp",
    ],
    categories: [
      { key: "liverEnzymes", name: "Liver Enzymes", biomarkerIds: ["alt", "ast", "ggt", "alp"] },
      { key: "bilirubin", name: "Bilirubin", biomarkerIds: ["bilirubin_total"] },
      { key: "proteins", name: "Liver Proteins", biomarkerIds: ["albumin"] },
      { key: "metabolic", name: "Metabolic Markers", biomarkerIds: ["glucose", "crp", "platelets"] },
    ],
    primaryColor: "#16a34a",
    mockData: [
      mockPoint(0, 62, { liverEnzymes: 68, bilirubin: 70, proteins: 72, metabolic: 55 }),
      mockPoint(1, 71, { liverEnzymes: 78, bilirubin: 75, proteins: 80, metabolic: 62 }),
      mockPoint(2, 78, { liverEnzymes: 85, bilirubin: 82, proteins: 84, metabolic: 70 }),
      mockPoint(3, 85, { liverEnzymes: 100, bilirubin: 88, proteins: 90, metabolic: 72 }),
    ],
  },
  heart: {
    biomarkerIds: [
      "total_cholesterol",
      "ldl_cholesterol",
      "hdl_cholesterol",
      "triglycerides",
      "crp",
      "homocysteine",
      "glucose",
      "hba1c",
    ],
    categories: [
      {
        key: "lipidPanel",
        name: "Lipid Panel",
        biomarkerIds: ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides"],
      },
      { key: "inflammation", name: "Inflammation", biomarkerIds: ["crp", "homocysteine"] },
      { key: "metabolic", name: "Metabolic", biomarkerIds: ["glucose", "hba1c"] },
    ],
    primaryColor: "#ef4444",
    mockData: [
      mockPoint(0, 72, { lipidPanel: 65, inflammation: 70, metabolic: 80 }),
      mockPoint(1, 78, { lipidPanel: 72, inflammation: 78, metabolic: 85 }),
      mockPoint(2, 83, { lipidPanel: 80, inflammation: 82, metabolic: 88 }),
      mockPoint(3, 87, { lipidPanel: 85, inflammation: 88, metabolic: 90 }),
    ],
  },
  kidney: {
    biomarkerIds: [
      "creatinine",
      "egfr",
      "bun",
      "cystatin_c",
      "uacr",
      "potassium",
      "sodium",
      "bicarbonate",
      "calcium",
      "phosphorus",
      "pth",
    ],
    categories: [
      {
        key: "kidneyFunction",
        name: "Kidney Function",
        biomarkerIds: ["creatinine", "egfr", "bun", "cystatin_c"],
      },
      { key: "urineMarkers", name: "Urine Markers", biomarkerIds: ["uacr"] },
      { key: "electrolytes", name: "Electrolytes", biomarkerIds: ["potassium", "sodium", "bicarbonate"] },
      { key: "boneMineral", name: "Bone & Mineral", biomarkerIds: ["calcium", "phosphorus", "pth"] },
    ],
    primaryColor: "#0ea5e9",
    mockData: [
      mockPoint(0, 78, { kidneyFunction: 72, urineMarkers: 65, electrolytes: 85, boneMineral: 80 }),
      mockPoint(1, 84, { kidneyFunction: 80, urineMarkers: 78, electrolytes: 88, boneMineral: 85 }),
      mockPoint(2, 89, { kidneyFunction: 88, urineMarkers: 85, electrolytes: 92, boneMineral: 90 }),
      mockPoint(3, 93, { kidneyFunction: 94, urineMarkers: 92, electrolytes: 95, boneMineral: 92 }),
    ],
  },
  thyroid: {
    biomarkerIds: ["tsh", "free_t4", "free_t3"],
    categories: [
      { key: "thyroidFunction", name: "Thyroid Function", biomarkerIds: ["tsh", "free_t4", "free_t3"] },
    ],
    primaryColor: "#3b82f6",
    mockData: [
      mockPoint(0, 74, { thyroidFunction: 74 }),
      mockPoint(1, 79, { thyroidFunction: 79 }),
      mockPoint(2, 84, { thyroidFunction: 84 }),
      mockPoint(3, 88, { thyroidFunction: 88 }),
    ],
  },
  hormones: {
    biomarkerIds: [
      "testosterone_total",
      "estradiol",
      "progesterone",
      "cortisol",
      "dhea_s",
      "fsh",
      "lh",
      "shbg",
      "free_testosterone",
    ],
    categories: [
      {
        key: "sexHormones",
        name: "Sex Hormones",
        biomarkerIds: ["testosterone_total", "estradiol", "progesterone"],
      },
      { key: "fertilityHormones", name: "Fertility Hormones", biomarkerIds: ["fsh", "lh"] },
      { key: "stressHormones", name: "Stress & Adrenal", biomarkerIds: ["cortisol", "dhea_s"] },
      {
        key: "bindingProteins",
        name: "Binding Proteins",
        biomarkerIds: ["shbg", "free_testosterone"],
      },
    ],
    primaryColor: "#a855f7",
    mockData: [
      mockPoint(0, 70, { sexHormones: 68, fertilityHormones: 72, stressHormones: 65, bindingProteins: 74 }),
      mockPoint(1, 76, { sexHormones: 75, fertilityHormones: 78, stressHormones: 72, bindingProteins: 80 }),
      mockPoint(2, 82, { sexHormones: 82, fertilityHormones: 84, stressHormones: 78, bindingProteins: 86 }),
      mockPoint(3, 86, { sexHormones: 88, fertilityHormones: 87, stressHormones: 82, bindingProteins: 89 }),
    ],
  },
};

interface RawBiomarkerResult {
  id: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: string;
}

function toInput(result: RawBiomarkerResult): BiomarkerResultInput {
  return {
    id: result.id,
    biomarkerId: result.biomarkerId,
    value: result.value,
    status: result.status?.toLowerCase() ?? "",
    testedAt: result.testedAt,
  };
}

function formatTrendDate(dateKey: string): { date: string; fullDate: string } {
  const d = new Date(`${dateKey}T12:00:00`);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.toLocaleDateString("en-US", { year: "2-digit" });
  const fullDate = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { date: `${month} '${year}`, fullDate };
}

export function getOrganMockTrend(organId: OrganTrendId): OrganTrendPoint[] {
  return ORGAN_TREND_CONFIGS[organId].mockData;
}

export function buildOrganTrendFromResults(
  organId: OrganTrendId,
  gender: "male" | "female",
  rawResults: RawBiomarkerResult[]
): { data: OrganTrendPoint[]; isIllustration: boolean } {
  const config = ORGAN_TREND_CONFIGS[organId];
  const organIds = new Set(config.biomarkerIds);
  const relevant = rawResults.filter((r) => organIds.has(r.biomarkerId));

  if (relevant.length === 0) {
    return { data: config.mockData, isIllustration: true };
  }

  const byDate = new Map<string, RawBiomarkerResult[]>();
  for (const result of relevant) {
    const dateKey = result.testedAt.split("T")[0];
    const bucket = byDate.get(dateKey) ?? [];
    bucket.push(result);
    byDate.set(dateKey, bucket);
  }

  const testDef = healthTestsConfig.find((t) => t.id === organId);
  if (!testDef) {
    return { data: config.mockData, isIllustration: true };
  }

  const points: OrganTrendPoint[] = [];

  for (const dateKey of Array.from(byDate.keys()).sort()) {
    const dayResults = byDate.get(dateKey)!;
    const snapshotMap = new Map<string, RawBiomarkerResult>();

    for (const result of dayResults) {
      const existing = snapshotMap.get(result.biomarkerId);
      if (!existing || new Date(result.testedAt) > new Date(existing.testedAt)) {
        snapshotMap.set(result.biomarkerId, result);
      }
    }

    const snapshot = Array.from(snapshotMap.values()).map(toInput);
    const overallResult = calculateTestScore(organId, testDef.biomarkerIds, gender, snapshot);

    if (!overallResult.hasData) continue;

    const categories: Record<string, number> = {};
    for (const category of config.categories) {
      const categoryScore = calculateStatusBasedScore(category.biomarkerIds, gender, snapshot);
      if (categoryScore.hasData) {
        categories[category.key] = categoryScore.score;
      }
    }

    const { date, fullDate } = formatTrendDate(dateKey);
    points.push({
      date,
      fullDate,
      dateKey,
      overall: overallResult.score,
      categories,
    });
  }

  if (points.length < 2) {
    return { data: config.mockData, isIllustration: true };
  }

  return { data: points, isIllustration: false };
}

export interface OrganTrendMilestones {
  currentScore: number;
  currentDate: string;
  startingScore: number;
  startingDate: string;
  improvement: number;
  targetScore: number;
  targetDateLabel: string;
  ptsToTarget: number;
  categoryImprovements: Array<{ key: string; label: string; delta: number }>;
}

export interface OrganTrendSummaryDefaults {
  targetScore: number;
  targetDateLabel: string;
  categoryImprovements: Array<{ label: string; delta: number }>;
}

export const ORGAN_TREND_SUMMARY_DEFAULTS: Partial<
  Record<OrganTrendId, OrganTrendSummaryDefaults>
> = {
  liver: {
    targetScore: 90,
    targetDateLabel: "By September 2024",
    categoryImprovements: [
      { label: "Liver Enzymes", delta: 32 },
      { label: "Inflammation", delta: 34 },
      { label: "Metabolic Panel", delta: 18 },
      { label: "Lipid Profile", delta: 17 },
    ],
  },
  kidney: {
    targetScore: 95,
    targetDateLabel: "By September 2024",
    categoryImprovements: [
      { label: "eGFR (Filtration)", delta: 10 },
      { label: "UACR (Protein)", delta: 17 },
      { label: "Cystatin C", delta: 16 },
      { label: "Electrolytes", delta: 8 },
    ],
  },
};

function defaultTargetScore(organId: OrganTrendId, currentScore: number): number {
  const floor = organId === "kidney" ? 95 : 90;
  return Math.min(100, Math.max(floor, currentScore + (organId === "kidney" ? 2 : 5)));
}

export function computeOrganTrendMilestones(
  data: OrganTrendPoint[],
  categories: OrganTrendCategory[],
  organId: OrganTrendId,
  isIllustration: boolean
): OrganTrendMilestones | null {
  if (data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const illustrationDefaults = ORGAN_TREND_SUMMARY_DEFAULTS[organId];

  const computedImprovements = categories
    .map((category) => ({
      key: category.key,
      label: category.name,
      delta: (last.categories[category.key] ?? 0) - (first.categories[category.key] ?? 0),
    }))
    .filter(
      (item) => first.categories[item.key] !== undefined || last.categories[item.key] !== undefined
    )
    .sort((a, b) => b.delta - a.delta);

  const categoryImprovements =
    isIllustration && illustrationDefaults
      ? illustrationDefaults.categoryImprovements.map((item, index) => ({
          key: `illustration-${index}`,
          label: item.label,
          delta: item.delta,
        }))
      : computedImprovements;

  const targetScore =
    isIllustration && illustrationDefaults
      ? illustrationDefaults.targetScore
      : defaultTargetScore(organId, last.overall);

  const targetDateLabel =
    isIllustration && illustrationDefaults
      ? illustrationDefaults.targetDateLabel
      : "Next review";

  return {
    currentScore: last.overall,
    currentDate: last.fullDate,
    startingScore: first.overall,
    startingDate: first.fullDate,
    improvement: last.overall - first.overall,
    targetScore,
    targetDateLabel,
    ptsToTarget: Math.max(0, targetScore - last.overall),
    categoryImprovements,
  };
}
