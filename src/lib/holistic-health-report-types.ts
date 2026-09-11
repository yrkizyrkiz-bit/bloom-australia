export type HolisticPriorityBand = "good" | "look_out" | "needs_attention" | "immediate";

export type HolisticOrganSystemId =
  | "liver"
  | "kidney"
  | "heart"
  | "thyroid"
  | "hormones"
  | "metabolic"
  | "blood";

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

/** Prebaked George Ask chip — generated with the main Claude report. */
export type HolisticAskItem = {
  id: string;
  question: string;
  intro: string;
  bullets: Array<{ title: string; body: string }>;
  insight?: string;
  closing?: string;
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
  /** Clinician handoff summary (shown in Actions). */
  careTeamHandoffSummary?: string;
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
  /** Suggested questions for the care team (shown in Actions). */
  questionsForCareTeam?: string[];
  retestingGuidance: string;
  urgentActions: string[];
  limitations: string[];
  /** Prebaked Ask Q&A from the main Claude job (instant chip answers). */
  askItems?: HolisticAskItem[];
  analysisTimestamp: string;
};

export const AU_REGULATORY_NOTICE =
  "Report is a draft pending Sanative health practitioner review.";

function overallRiskFromScore(score: number): HolisticHealthReport["overallRisk"] {
  if (score >= 75) return "low";
  if (score >= 60) return "moderate";
  if (score >= 45) return "elevated";
  return "high";
}

function splitSummarySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeSummarySentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarySpecificity(s: string): number {
  const numbers = s.match(/\d+(?:\.\d+)?/g)?.length || 0;
  return numbers * 20 + Math.min(s.length, 220);
}

function sentencesOverlap(a: string, b: string): boolean {
  const n = normalizeSummarySentence(a);
  const e = normalizeSummarySentence(b);
  if (!n || !e) return false;
  if (n === e) return true;
  if (n.includes(e) || e.includes(n)) return true;

  // Same clinical topic (e.g. both about CRP / kidneys) counts as repetition.
  const topics = [
    "crp",
    "inflammation",
    "kidney",
    "egfr",
    "creatinine",
    "cholesterol",
    "blood sugar",
    "hba1c",
    "liver",
    "alp",
    "thyroid",
    "hormone",
    "heart",
    "emergenc",
    "not a diagnosis",
  ];
  if (topics.some((t) => n.includes(t) && e.includes(t))) return true;

  const nWords = n.split(" ").filter((w) => w.length > 4);
  const eWords = e.split(" ").filter((w) => w.length > 4);
  if (eWords.length === 0 || nWords.length === 0) return false;
  const overlap = eWords.filter((w) => nWords.includes(w)).length;
  return overlap >= Math.min(4, Math.ceil(Math.min(eWords.length, nWords.length) * 0.45));
}

/**
 * One short member-facing summary: merges legacy executiveSummary + clinicalContext
 * without repeating the same points (older Claude reports wrote both).
 * When two sentences cover the same idea, keeps the more specific one (numbers win).
 */
export function coalesceMemberFacingSummary(
  executiveSummary?: string | null,
  clinicalContext?: string | null,
  maxSentences = 5
): string {
  const exec = (executiveSummary || "").trim();
  const clinical = (clinicalContext || "").trim();
  if (!clinical) return exec || "Report summary unavailable.";
  if (!exec) return clinical;

  const kept: string[] = [];
  for (const sentence of [...splitSummarySentences(exec), ...splitSummarySentences(clinical)]) {
    const idx = kept.findIndex((existing) => sentencesOverlap(sentence, existing));
    if (idx >= 0) {
      if (summarySpecificity(sentence) > summarySpecificity(kept[idx])) {
        kept[idx] = sentence;
      }
      continue;
    }
    kept.push(sentence);
  }

  // Prefer score/lead + numeric findings; drop soft duplicates past the cap.
  const ranked = kept
    .map((sentence, order) => ({ sentence, order, score: summarySpecificity(sentence) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, maxSentences)
    .sort((a, b) => a.order - b.order)
    .map((x) => x.sentence);

  return ranked.join(" ") || exec;
}

export function sanitizeHolisticHealthReport(
  report: Partial<HolisticHealthReport> | null | undefined
): HolisticHealthReport | null {
  if (!report || typeof report !== "object") return null;
  const score = Number(report.overallHealthScore) || 0;
  const executiveSummary = coalesceMemberFacingSummary(
    report.executiveSummary,
    report.clinicalContext
  );

  return {
    aiProvider: report.aiProvider,
    aiModel: report.aiModel,
    reportTitle: report.reportTitle || "Holistic Health Report",
    overallHealthScore: score,
    overallRisk: report.overallRisk || overallRiskFromScore(score),
    executiveSummary,
    // Member narrative lives only in executiveSummary — avoid a second repeated block.
    clinicalContext: "",
    regulatoryNotice: AU_REGULATORY_NOTICE,
    careTeamHandoffSummary:
      typeof report.careTeamHandoffSummary === "string"
        ? report.careTeamHandoffSummary
        : "",
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
    askItems: sanitizeAskItems(report.askItems),
    analysisTimestamp: report.analysisTimestamp || new Date().toISOString(),
  };
}

function sanitizeAskItems(raw: unknown): HolisticAskItem[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const question = typeof row.question === "string" ? row.question.trim() : "";
      const intro = typeof row.intro === "string" ? row.intro.trim() : "";
      const insight = typeof row.insight === "string" ? row.insight.trim() : undefined;
      const closing = typeof row.closing === "string" ? row.closing.trim() : undefined;
      let bulletsRaw: unknown = row.bullets;
      if (typeof bulletsRaw === "string") {
        try {
          bulletsRaw = JSON.parse(bulletsRaw);
        } catch {
          bulletsRaw = [];
        }
      }
      const bullets = Array.isArray(bulletsRaw)
        ? bulletsRaw
            .filter(
              (b): b is { title: string; body: string } =>
                Boolean(b) &&
                typeof b === "object" &&
                typeof (b as { title?: unknown }).title === "string" &&
                typeof (b as { body?: unknown }).body === "string"
            )
            .map((b) => ({ title: b.title.trim(), body: b.body.trim() }))
            .filter((b) => b.title && b.body)
            .slice(0, 2)
        : [];
      if (!question || !intro || bullets.length === 0) return null;
      return {
        id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `ask-${index}`,
        question,
        intro,
        bullets,
        insight: insight || undefined,
        closing: closing || undefined,
      } satisfies HolisticAskItem;
    })
    .filter((item): item is HolisticAskItem => Boolean(item))
    .slice(0, 6);
}
