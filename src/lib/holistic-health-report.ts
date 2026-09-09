import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getActiveEntitlements } from "@/lib/membership/entitlement-service";
import {
  loadOrganCareReportContext,
} from "@/lib/organ-care-ai-report";
import { getGlycemicFlag,
  getCkdStageLabel,
  getHormoneStatusLabel,
  getThyroidStatusLabel,
  healthTestsConfig,
} from "@/lib/healthTestScoring";
import { markerMeaning, patientFacingMarkerName } from "@/lib/holistic-patient-language";
import {
  AU_REGULATORY_NOTICE,
  sanitizeHolisticHealthReport,
  type HolisticCrossPattern,
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticOrganSystem,
  type HolisticOrganSystemId,
  type HolisticPriorityBand,
  type HolisticProgramContribution,
} from "@/lib/holistic-health-report-types";

export const HOLISTIC_HEALTH_ANALYSIS_TYPE = "holistic_health_v1";
const CLAUDE_MODEL =
  process.env.HOLISTIC_HEALTH_AI_MODEL ||
  process.env.ORGAN_CARE_AI_MODEL ||
  process.env.ANTHROPIC_MODEL ||
  "claude-sonnet-4-6";
// Background Netlify functions allow up to ~15 minutes; Claude usually finishes in 1–2.
const CLAUDE_TIMEOUT_MS = Number(process.env.HOLISTIC_HEALTH_AI_TIMEOUT_MS || 180_000);
const CLAUDE_MAX_TOKENS = 5000;

export type HolisticGenerationPending = {
  status: "generating";
  startedAt: string;
  biomarkerHash: string;
};

export type HolisticGenerationError = {
  status: "error";
  message: string;
  failedAt: string;
  biomarkerHash: string;
};

export function isHolisticGenerationPending(data: unknown): data is HolisticGenerationPending {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as HolisticGenerationPending).status === "generating"
  );
}

export function isHolisticGenerationError(data: unknown): data is HolisticGenerationError {
  return Boolean(
    data && typeof data === "object" && (data as HolisticGenerationError).status === "error"
  );
}

/** Pending rows older than this are treated as dead (gateway timeout / failed enqueue). */
export const HOLISTIC_PENDING_STALE_MS = Number(
  process.env.HOLISTIC_PENDING_STALE_MS || 5 * 60 * 1000
);

export function isHolisticGenerationPendingStale(
  data: unknown,
  nowMs: number = Date.now()
): boolean {
  if (!isHolisticGenerationPending(data)) return false;
  const started = Date.parse(data.startedAt);
  if (!Number.isFinite(started)) return true;
  return nowMs - started > HOLISTIC_PENDING_STALE_MS;
}

type OrganCareContext = NonNullable<Awaited<ReturnType<typeof loadOrganCareReportContext>>>;

type HolisticContext = OrganCareContext & {
  programs: HolisticProgramContribution[];
  clinicalFlags: {
    glycemic: ReturnType<typeof getGlycemicFlag>;
    ckdStage: string;
    thyroidStatus: string;
    hormoneStatus: string;
  };
};

const PROGRAM_IMPACT: Record<
  string,
  Omit<HolisticProgramContribution, "key" | "kind">
> = {
  WEIGHT_MANAGEMENT: {
    label: "Weight Management",
    howItHelpsFutureResults:
      "Steady weight loss and metabolic care often improve blood sugar, average blood sugar (HbA1c), blood fats, liver enzymes, and inflammation over 3–6 months when food, movement, and your care plan stay on track.",
    markersLikelyToImprove: ["glucose", "hba1c", "triglycerides", "alt", "ggt", "crp"],
    monitoringFocus:
      "Re-check blood sugar, cholesterol/fats, and liver enzymes after meaningful weight change or dose adjustments.",
  },
  HAIR_LOSS: {
    label: "Hair",
    howItHelpsFutureResults:
      "Hair programs mainly support scalp and hormone pathways. They rarely change organ scores directly, but iron and thyroid checks can still matter for how you feel overall.",
    markersLikelyToImprove: ["ferritin", "iron", "tsh"],
    monitoringFocus: "Track iron stores and thyroid markers if fatigue or shedding continues.",
  },
  MENS_HEALTH_VITALITY: {
    label: "Men’s Vitality",
    howItHelpsFutureResults:
      "Vitality care can support energy, body composition, and hormone balance, which may indirectly improve blood-sugar and inflammation markers over time.",
    markersLikelyToImprove: ["testosterone_total", "free_testosterone", "shbg", "hba1c"],
    monitoringFocus: "Repeat hormone and metabolic markers with your clinical review.",
  },
  MENS_HEALTH_SEXUAL: {
    label: "Men’s Sexual Health",
    howItHelpsFutureResults:
      "Sexual health care focuses on symptoms and blood-flow/hormone contributors. Looking after heart and metabolic health often supports better long-term outcomes.",
    markersLikelyToImprove: ["total_cholesterol", "ldl_cholesterol", "glucose", "hba1c"],
    monitoringFocus: "Keep cholesterol, blood sugar, and heart markers in view alongside how symptoms respond.",
  },
  WOMENS_HEALTH_VITALITY: {
    label: "Women’s Vitality",
    howItHelpsFutureResults:
      "Hormone-balanced vitality care can support sleep, stress, and metabolic resilience, which may improve thyroid follow-up needs and blood-sugar markers.",
    markersLikelyToImprove: ["cortisol", "tsh", "free_t4", "glucose"],
    monitoringFocus: "Align hormone timing with cycle/context and re-check metabolic labs as advised.",
  },
  WOMENS_HEALTH_SEXUAL: {
    label: "Women’s Sexual Health",
    howItHelpsFutureResults:
      "Sexual health support is mainly symptom-focused. Whole-body metabolic and hormone optimisation can still improve related wellbeing markers.",
    markersLikelyToImprove: ["estradiol", "testosterone_total", "tsh"],
    monitoringFocus: "Review hormones in clinical context and keep an eye on overlapping metabolic risk.",
  },
  ORGAN_CARE: {
    label: "Organ & Metabolic Care",
    howItHelpsFutureResults:
      "Organ Care membership supports structured monitoring of liver, heart, kidney, thyroid, hormones, and metabolic markers — so future reports can show clearer trends and earlier course-correction.",
    markersLikelyToImprove: ["alt", "egfr", "ldl_cholesterol", "hba1c", "tsh"],
    monitoringFocus: "Use scheduled retesting windows to confirm improvement or escalate earlier.",
  },
  BIOLOGICAL_CLOCK: {
    label: "Biological Clock / Biomarkers",
    howItHelpsFutureResults:
      "Broader biomarker tracking strengthens trend detection across systems, helping separate temporary noise from meaningful change.",
    markersLikelyToImprove: [],
    monitoringFocus: "Keep test dates consistent and complete missing priority markers.",
  },
  COMPLETE_HEALTH: {
    label: "Complete Health",
    howItHelpsFutureResults:
      "A fuller panel and care stack improves cross-system interpretation and makes program effects on labs easier to measure over time.",
    markersLikelyToImprove: ["hba1c", "ldl_cholesterol", "alt", "egfr"],
    monitoringFocus: "Prioritise repeating out-of-range and trending markers first.",
  },
};

const REPORT_TOOL = {
  name: "submit_holistic_health_report",
  description: "Submit the complete structured holistic member health report.",
  input_schema: {
    type: "object",
    required: [
      "reportTitle",
      "overallRisk",
      "executiveSummary",
      "clinicalContext",
      "careTeamHandoffSummary",
      "organSystems",
      "crossSystemPatterns",
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
      executiveSummary: {
        type: "string",
        description:
          "ONE short member-facing summary only (max ~5–6 sentences). Combine score, top concerns with key numbers once, and next-step tone. No second overview paragraph.",
      },
      clinicalContext: {
        type: "string",
        description:
          "Must be an empty string. Do not write a second member summary here — put clinician detail in careTeamHandoffSummary.",
      },
      careTeamHandoffSummary: { type: "string" },
      organSystems: { type: "array", items: { type: "object" } },
      crossSystemPatterns: { type: "array", items: { type: "object" } },
      recommendations: { type: "array", items: { type: "object" } },
      questionsForCareTeam: { type: "array", items: { type: "string" } },
      retestingGuidance: { type: "string" },
      urgentActions: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
      analysisTimestamp: { type: "string" },
    },
  },
};

function bandForMarker(summary: OrganCareContext["biomarkerSummaries"][number]): HolisticPriorityBand {
  const id = summary.biomarkerId;
  const value = summary.value;

  // Immediate educational red flags (AU clinical thresholds) — not a diagnosis.
  if (id === "egfr" && value < 30) return "immediate";
  if (id === "glucose" && value >= 7.0) return "immediate";
  if (id === "hba1c" && value >= 6.5) return "immediate";
  if (id === "potassium" && (value < 2.8 || value > 6.0)) return "immediate";
  if (summary.status === "critical") return "immediate";

  if (summary.status === "out_of_range") return "needs_attention";
  if (
    summary.trend === "worsening" ||
    (id === "glucose" && value >= 5.6) ||
    (id === "hba1c" && value >= 5.7)
  ) {
    return "look_out";
  }
  if (summary.status === "optimal" || summary.status === "normal") return "good";
  return "look_out";
}

function plainEnglishForMarker(
  summary: OrganCareContext["biomarkerSummaries"][number],
  band: HolisticPriorityBand
): string {
  const label = patientFacingMarkerName(summary.biomarkerId, summary.name);
  const meaning = markerMeaning(summary.biomarkerId);
  const result = `Your result is ${summary.value} ${summary.unit}.`;
  const prior =
    summary.previousValue != null
      ? ` Last time it was ${summary.previousValue} ${summary.unit}.`
      : "";

  if (band === "immediate") {
    return `${label}: ${meaning} ${result}${prior} This sits outside a safer range and should be reviewed with your GP or Sanative care team soon.`;
  }
  if (band === "needs_attention") {
    return `${label}: ${meaning} ${result}${prior} It is outside the preferred range — worth discussing at your next care review.`;
  }
  if (band === "look_out") {
    if (summary.trend === "worsening" && summary.previousValue != null) {
      return `${label}: ${meaning} ${result} It has moved in a less helpful direction since your last test (${summary.previousValue} → ${summary.value}). Not an emergency, but worth watching.`;
    }
    return `${label}: ${meaning} ${result} Not urgent, but useful to keep an eye on.`;
  }
  if (summary.trend === "improving" && summary.previousValue != null) {
    return `${label}: ${meaning} ${result} This looks favourable and has improved from ${summary.previousValue}.`;
  }
  return `${label}: ${meaning} ${result} This looks favourable.`;
}

function buildMarkerItems(context: OrganCareContext): HolisticMarkerItem[] {
  return context.biomarkerSummaries.map((summary) => {
    const band = bandForMarker(summary);
    return {
      biomarkerId: summary.biomarkerId,
      name: patientFacingMarkerName(summary.biomarkerId, summary.name),
      category: summary.category,
      value: summary.value,
      unit: summary.unit,
      status: summary.status,
      testedAt: summary.testedAt,
      previousValue: summary.previousValue,
      previousTestedAt: summary.previousTestedAt,
      trend: summary.trend,
      changePercent: summary.changePercent,
      plainEnglish: plainEnglishForMarker(summary, band),
      band,
    };
  });
}

function splitPriorityBands(markers: HolisticMarkerItem[]) {
  const good = markers.filter((m) => m.band === "good");
  const lookOut = markers.filter((m) => m.band === "look_out");
  const needsAttention = markers.filter((m) => m.band === "needs_attention");
  const immediate = markers.filter((m) => m.band === "immediate");
  return { good, lookOut, needsAttention, immediate };
}

function organStatusFromScore(score: number): HolisticOrganSystem["status"] {
  if (score >= 80) return "optimal";
  if (score >= 65) return "watch";
  return "needs_attention";
}

function buildOrganSystems(context: OrganCareContext, markers: HolisticMarkerItem[]): HolisticOrganSystem[] {
  const byCategory = new Map(markers.map((m) => [m.biomarkerId, m]));
  const systems: HolisticOrganSystem[] = [];

  for (const test of healthTestsConfig) {
    const scoreRow = context.healthScores.categories.find((c) => c.id === test.id);
    if (!scoreRow?.hasData) continue;

    const highlights = test.biomarkerIds
      .map((id) => byCategory.get(id))
      .filter((m): m is HolisticMarkerItem => Boolean(m && m.band !== "good"))
      .slice(0, 3)
      .map((m) => m.plainEnglish);

    const label =
      test.id === "liver"
        ? "Liver"
        : test.id === "kidney"
          ? "Kidney"
          : test.id === "heart"
            ? "Heart"
            : test.name;

    systems.push({
      id: test.id as HolisticOrganSystemId,
      label,
      score: scoreRow.score,
      status: organStatusFromScore(scoreRow.score),
      trend: scoreRow.trend,
      summary:
        highlights[0] ||
        `${label} score is ${scoreRow.score}/100 based on your latest markers.`,
      biomarkersTracked: scoreRow.optimal + scoreRow.normal + scoreRow.outOfRange,
      highlights,
    });
  }

  return systems;
}

function buildCrossPatterns(
  context: HolisticContext,
  markers: HolisticMarkerItem[]
): HolisticCrossPattern[] {
  const patterns: HolisticCrossPattern[] = [];
  const flagged = (ids: string[]) =>
    markers.filter((m) => ids.includes(m.biomarkerId) && m.band !== "good");

  const metabolic = flagged(["glucose", "hba1c", "insulin", "triglycerides"]);
  if (metabolic.length >= 2 || context.clinicalFlags.glycemic !== "normal") {
    patterns.push({
      title: "Blood sugar and blood fats moving together",
      severity: context.clinicalFlags.glycemic === "diabetic" ? "high" : "medium",
      involvedSystems: ["metabolic", "heart", "liver"],
      involvedBiomarkers: metabolic.map((m) => m.biomarkerId),
      explanation:
        "Your blood sugar and related fat markers often rise or fall as a set. Looking at them together tells a clearer story about energy and heart risk than any single number.",
      monitoringAdvice:
        "Talk with your GP about blood sugar, average sugar (HbA1c), cholesterol/fats, and liver enzymes, and when to retest.",
    });
  }

  const heart = flagged([
    "ldl_cholesterol",
    "total_cholesterol",
    "triglycerides",
    "hdl_cholesterol",
    "crp",
    "homocysteine",
  ]);
  if (heart.length >= 2) {
    patterns.push({
      title: "Heart and inflammation pattern",
      severity: heart.length >= 3 ? "high" : "medium",
      involvedSystems: ["heart", "metabolic"],
      involvedBiomarkers: heart.map((m) => m.biomarkerId),
      explanation:
        "Several heart-related markers (cholesterol, blood fats, or inflammation) are outside preferred ranges or trending less helpfully. Together they can raise long-term heart risk.",
      monitoringAdvice:
        "Review cholesterol, blood pressure, food, movement, and sleep with your clinician. Ask when to repeat the cholesterol panel if anything changes.",
    });
  }

  const liver = flagged(["alt", "ast", "ggt", "alp", "bilirubin_total"]);
  if (liver.length >= 2) {
    patterns.push({
      title: "Liver strain with metabolic overlap",
      severity: liver.length >= 3 ? "high" : "medium",
      involvedSystems: ["liver", "metabolic"],
      involvedBiomarkers: liver.map((m) => m.biomarkerId),
      explanation:
        "More than one liver enzyme is raised. That can track with metabolic load, medicines, alcohol, or fatty liver risk — it is usually a pattern, not one isolated blip.",
      monitoringAdvice:
        "Repeat liver bloods and discuss sugar, weight, medicines, and alcohol history with your GP.",
    });
  }

  const kidney = flagged(["creatinine", "egfr", "bun", "uacr"]);
  if (kidney.length >= 1 && !context.clinicalFlags.ckdStage.startsWith("Normal")) {
    patterns.push({
      title: "Kidney filter function context",
      severity: context.clinicalFlags.ckdStage.startsWith("Severe") || context.clinicalFlags.ckdStage.startsWith("Kidney")
        ? "high"
        : "medium",
      involvedSystems: ["kidney", "heart", "metabolic"],
      involvedBiomarkers: kidney.map((m) => m.biomarkerId),
      explanation: `Your kidney markers currently map to “${context.clinicalFlags.ckdStage}”. Kidneys, heart, and blood-sugar health influence each other over time.`,
      monitoringAdvice:
        "Confirm kidney filter rate and urine protein with your GP, and keep blood pressure and blood sugar on track.",
    });
  }

  return patterns.slice(0, 5);
}

async function loadProgramContributions(userId: string): Promise<HolisticProgramContribution[]> {
  const entitlements = await getActiveEntitlements(userId);
  const contributions: HolisticProgramContribution[] = [];
  const seen = new Set<string>();

  for (const row of entitlements) {
    const key = row.key;
    if (seen.has(key)) continue;
    const pack = PROGRAM_IMPACT[key];
    if (!pack) continue;
    seen.add(key);
    contributions.push({
      key,
      kind: row.type === "PROGRAM" ? "program" : "scope",
      ...pack,
    });
  }

  return contributions;
}

export async function loadHolisticHealthReportContext(userId: string): Promise<HolisticContext | null> {
  const base = await loadOrganCareReportContext(userId);
  if (!base) return null;

  const programs = await loadProgramContributions(userId);
  const biomarkerInputs = base.biomarkerSummaries.map((item) => ({
    id: item.biomarkerId,
    biomarkerId: item.biomarkerId,
    value: item.value,
    status: item.status,
    testedAt: item.testedAt,
  }));

  return {
    ...base,
    programs,
    clinicalFlags: {
      glycemic: getGlycemicFlag(biomarkerInputs),
      ckdStage: getCkdStageLabel(biomarkerInputs),
      thyroidStatus: getThyroidStatusLabel(biomarkerInputs),
      hormoneStatus: getHormoneStatusLabel(biomarkerInputs),
    },
  };
}

function buildDeterministicHolisticReport(context: HolisticContext): HolisticHealthReport {
  const markers = buildMarkerItems(context);
  const priorityBands = splitPriorityBands(markers);
  const organSystems = buildOrganSystems(context, markers);
  const crossSystemPatterns = buildCrossPatterns(context, markers);

  const immediateNames = priorityBands.immediate.map((m) => m.name).slice(0, 4);
  const attentionNames = priorityBands.needsAttention.map((m) => m.name).slice(0, 5);

  const executiveSummary = [
    `Your overall health score is ${context.healthScores.overall}/100 across liver, heart, kidney, thyroid, hormones, and metabolic markers from your latest blood test.`,
    immediateNames.length
      ? `Please prioritise a chat with your GP about: ${immediateNames.join(", ")}.`
      : attentionNames.length
        ? `Main areas to discuss with your care team: ${attentionNames.join(", ")}.`
        : "Nothing in this panel jumped out as an immediate laboratory red flag.",
    context.programs.length
      ? `Your Sanative programs (${context.programs.map((p) => p.label).join(", ")}) can support the markers most likely to improve next.`
      : "A Sanative program can help target the markers most likely to improve on your next blood test.",
  ].join(" ");

  const urgentActions = priorityBands.immediate.map(
    (m) => `Book a prompt review of ${m.name} (result ${m.value} ${m.unit}) with your GP or Sanative care team.`
  );

  const recommendations: HolisticHealthReport["recommendations"] = [
    ...urgentActions.slice(0, 3).map((action) => ({
      category: "follow_up" as const,
      priority: "high" as const,
      action,
      rationale: "Based on blood-test thresholds commonly used in Australian practice — educational only, not a diagnosis.",
    })),
    ...context.programs.slice(0, 3).map((program) => ({
      category: "program" as const,
      priority: "medium" as const,
      action: `Stay consistent with ${program.label}: ${program.monitoringFocus}`,
      rationale: program.howItHelpsFutureResults,
    })),
    {
      category: "testing",
      priority: priorityBands.needsAttention.length ? "high" : "medium",
      action: "On your next blood panel, retest the markers that are out of range or trending the wrong way.",
      rationale: "Trends are clearer when you compare like-for-like follow-up results, not a one-off snapshot.",
    },
  ];

  return {
    aiProvider: "deterministic",
    reportTitle: "Holistic Health Report",
    overallHealthScore: context.healthScores.overall,
    overallRisk:
      context.healthScores.overall >= 75
        ? "low"
        : context.healthScores.overall >= 60
          ? "moderate"
          : context.healthScores.overall >= 45
            ? "elevated"
            : "high",
    executiveSummary,
    clinicalContext: "",
    regulatoryNotice: AU_REGULATORY_NOTICE,
    careTeamHandoffSummary: `Member ${context.user.firstName || ""} score ${context.healthScores.overall}/100. Immediate markers: ${
      immediateNames.join(", ") || "none"
    }. Attention markers: ${attentionNames.join(", ") || "none"}. Programs: ${
      context.programs.map((p) => p.label).join(", ") || "none"
    }.`,
    priorityBands: {
      good: priorityBands.good.slice(0, 12),
      lookOut: priorityBands.lookOut.slice(0, 12),
      needsAttention: priorityBands.needsAttention.slice(0, 12),
      immediate: priorityBands.immediate.slice(0, 12),
    },
    organSystems,
    crossSystemPatterns,
    programContributions: context.programs,
    recommendations: recommendations.slice(0, 8),
    questionsForCareTeam: [
      "Which of my current markers should we retest first?",
      "Do any combinations across liver, heart, and kidney change my follow-up plan?",
      "How should my Sanative program goals map to the next blood test?",
    ],
    retestingGuidance:
      priorityBands.immediate.length > 0
        ? "Arrange a clinician review promptly, then retest flagged markers as they advise (often sooner than a routine annual panel)."
        : "Plan a repeat panel in 3–6 months, or sooner if treatment, lifestyle, or symptoms change.",
    urgentActions,
    limitations: [
      "This report is educational and not a diagnosis.",
      "Missing markers limit certainty for some organ systems.",
      "Reference intervals and clinical decisions remain with your treating clinician.",
    ],
    analysisTimestamp: new Date().toISOString(),
  };
}

function buildHolisticPrompt(context: HolisticContext, seed: HolisticHealthReport) {
  return `You are writing a Holistic Health Report for a Sanative member who is NOT a clinician.

Audience (critical):
- Write for a smart adult with no medical training.
- Member-facing fields must use everyday language first.
- Never lead with lab abbreviations alone (LDL, HDL, ALT, AST, GGT, eGFR, HbA1c, TSH, CRP, LFT).
- Always explain markers the way a patient understands them, with the lab name in brackets once.
  Examples: "bad cholesterol (LDL)", "good cholesterol (HDL)", "blood sugar", "average blood sugar (HbA1c)",
  "kidney filter rate (eGFR)", "liver enzyme (ALT)", "blood fats (triglycerides)", "inflammation marker (CRP)".
- First say what the marker means for the body, then what their number suggests in plain words.
- Avoid unexplained jargon: lipids, glycaemic, filtration, enzyme elevation, pathology, cardiovascular risk stratification.
- careTeamHandoffSummary is the ONLY place that may use concise clinical shorthand for doctors.

Hard rules (AU-aligned):
- Educational only. Do NOT diagnose, prescribe, or claim disease certainty.
- Use ONLY provided data. No open-web facts.
- Prefer Australian units/framing (mmol/L glucose, HbA1c %, eGFR stages) but explain them in plain English.
- Connect liver + heart + kidney + metabolic patterns; compare with previous values when present.
- Keep urgentActions limited to genuine laboratory red flags from the data.

PATIENT: ${context.user.firstName || "Member"}, ${context.user.gender}, age ${context.age ?? "unknown"}
OVERALL SCORE: ${context.healthScores.overall}/100
FLAGS: glycemic=${context.clinicalFlags.glycemic}; ckd=${context.clinicalFlags.ckdStage}; thyroid=${context.clinicalFlags.thyroidStatus}; hormones=${context.clinicalFlags.hormoneStatus}
PROGRAMS: ${JSON.stringify(context.programs)}
ORGAN SYSTEMS SEED: ${JSON.stringify(seed.organSystems)}
PRIORITY COUNTS: good=${seed.priorityBands.good.length}, lookOut=${seed.priorityBands.lookOut.length}, needsAttention=${seed.priorityBands.needsAttention.length}, immediate=${seed.priorityBands.immediate.length}
IMMEDIATE MARKERS: ${JSON.stringify(seed.priorityBands.immediate.slice(0, 8))}
ATTENTION MARKERS: ${JSON.stringify(seed.priorityBands.needsAttention.slice(0, 10))}
LOOK OUT: ${JSON.stringify(seed.priorityBands.lookOut.slice(0, 8))}
CROSS PATTERNS SEED: ${JSON.stringify(seed.crossSystemPatterns)}

Submit via submit_holistic_health_report:
- reportTitle, overallRisk
- executiveSummary: ONE short patient-facing summary only (max 5–6 sentences). Fold score, key concerns, and the most important numbers into this single block. Do NOT repeat the same points twice. Do NOT write a separate "clinical overview" for the member.
- clinicalContext: MUST be "" (empty). Never duplicate the member summary here.
- careTeamHandoffSummary (clinician-facing, 4-6 sentences max — put age/sex and clinical detail here, not in member fields)
- organSystems: refine summaries/highlights in patient language for liver, heart, kidney and any other systems with data (keep scores aligned to seed)
- crossSystemPatterns: 2-5 patterns spanning systems, titles and explanations in plain English
- recommendations (max 8, patient actions in plain English), questionsForCareTeam (3-5), retestingGuidance, urgentActions, limitations, analysisTimestamp (ISO)`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Claude holistic report timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function generateHolisticClaudeReport(
  prompt: string,
  seed: HolisticHealthReport
): Promise<HolisticHealthReport> {
  const anthropic = new Anthropic();
  const callClaude = () =>
    anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      tools: [REPORT_TOOL as any],
      tool_choice: { type: "tool", name: "submit_holistic_health_report" } as any,
      messages: [{ role: "user", content: `${prompt}\n\nUse submit_holistic_health_report only.` }],
    });

  let message;
  try {
    message = await withTimeout(callClaude(), CLAUDE_TIMEOUT_MS);
  } catch (firstError) {
    // Do not retry on serverless — a second attempt usually exceeds the platform timeout.
    throw firstError;
  }

  const toolUse = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_holistic_health_report"
  );
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return the holistic report tool payload");
  }

  const raw = toolUse.input as Partial<HolisticHealthReport>;
  return {
    ...seed,
    ...raw,
    aiProvider: "claude",
    aiModel: CLAUDE_MODEL,
    overallHealthScore: seed.overallHealthScore,
    regulatoryNotice: AU_REGULATORY_NOTICE,
    priorityBands: seed.priorityBands,
    programContributions: seed.programContributions,
    organSystems: Array.isArray(raw.organSystems) && raw.organSystems.length
      ? (raw.organSystems as HolisticOrganSystem[])
      : seed.organSystems,
    crossSystemPatterns: Array.isArray(raw.crossSystemPatterns) && raw.crossSystemPatterns.length
      ? (raw.crossSystemPatterns as HolisticCrossPattern[])
      : seed.crossSystemPatterns,
  };
}

export function enrichHolisticHealthReport(
  report: HolisticHealthReport,
  context: HolisticContext
): HolisticHealthReport {
  const seed = buildDeterministicHolisticReport(context);
  return {
    ...sanitizeHolisticHealthReport(report)!,
    aiProvider: report.aiProvider || seed.aiProvider,
    aiModel: report.aiModel || seed.aiModel,
    overallHealthScore: context.healthScores.overall,
    regulatoryNotice: AU_REGULATORY_NOTICE,
    priorityBands: seed.priorityBands,
    programContributions: context.programs.length
      ? context.programs
      : report.programContributions,
    organSystems: seed.organSystems.map((seedOrgan) => {
      const fromAi = report.organSystems.find((o) => o.id === seedOrgan.id);
      return {
        ...seedOrgan,
        // Keep AI narrative when present, but always use patient-facing seed highlights.
        summary: fromAi?.summary || seedOrgan.summary,
        highlights: seedOrgan.highlights,
      };
    }),
  };
}

export async function generateHolisticHealthReport(
  context: HolisticContext,
  options?: { requireClaude?: boolean }
): Promise<{
  report: HolisticHealthReport;
  usedFallback: boolean;
}> {
  const seed = buildDeterministicHolisticReport(context);
  // Default: Claude only. Opt into clinical seed with HOLISTIC_HEALTH_ALLOW_FALLBACK=1.
  const allowFallback =
    options?.requireClaude === false ||
    process.env.HOLISTIC_HEALTH_ALLOW_FALLBACK === "1" ||
    process.env.HOLISTIC_HEALTH_ALLOW_FALLBACK === "true";
  const requireClaude = !allowFallback;

  if (!process.env.ANTHROPIC_API_KEY) {
    if (requireClaude) {
      throw new Error("ANTHROPIC_API_KEY is not configured on the server");
    }
    return { report: seed, usedFallback: true };
  }

  try {
    const raw = await generateHolisticClaudeReport(buildHolisticPrompt(context, seed), seed);
    const enriched = enrichHolisticHealthReport(raw, context);
    if (!enriched.executiveSummary || enriched.organSystems.length === 0) {
      throw new Error("Holistic report missing required sections");
    }
    return { report: enriched, usedFallback: false };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[holistic-health-report] Claude failed:", detail);
    if (requireClaude) throw error instanceof Error ? error : new Error(detail);
    return { report: seed, usedFallback: true };
  }
}

export async function persistHolisticHealthReport(input: {
  userId: string;
  biomarkerHash: string;
  biomarkerCount: number;
  report: HolisticHealthReport;
}) {
  const analysisData = JSON.parse(JSON.stringify(input.report));
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);

  await prisma.aIAnalysisCache.upsert({
    where: {
      userId_analysisType: {
        userId: input.userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      },
    },
    update: {
      analysisData,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId: input.userId,
      analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      analysisData,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
    },
  });

  const riskLevel =
    input.report.overallRisk === "high"
      ? "high"
      : input.report.overallRisk === "elevated"
        ? "elevated"
        : input.report.overallRisk === "moderate"
          ? "moderate"
          : "low";

  await prisma.aIAnalysisHistory.create({
    data: {
      userId: input.userId,
      analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      analysisData,
      overallScore: input.report.overallHealthScore,
      riskLevel,
      biomarkerCount: input.biomarkerCount,
    },
  });
}

export async function markHolisticHealthReportPending(input: {
  userId: string;
  biomarkerHash: string;
}) {
  const pending: HolisticGenerationPending = {
    status: "generating",
    startedAt: new Date().toISOString(),
    biomarkerHash: input.biomarkerHash,
  };
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);

  await prisma.aIAnalysisCache.upsert({
    where: {
      userId_analysisType: {
        userId: input.userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      },
    },
    update: {
      analysisData: pending,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId: input.userId,
      analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      analysisData: pending,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
    },
  });
}

export async function markHolisticHealthReportError(input: {
  userId: string;
  biomarkerHash: string;
  message: string;
}) {
  const payload: HolisticGenerationError = {
    status: "error",
    message: input.message,
    failedAt: new Date().toISOString(),
    biomarkerHash: input.biomarkerHash,
  };
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);

  await prisma.aIAnalysisCache.upsert({
    where: {
      userId_analysisType: {
        userId: input.userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      },
    },
    update: {
      analysisData: payload,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId: input.userId,
      analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      analysisData: payload,
      biomarkerHash: input.biomarkerHash,
      expiresAt,
    },
  });
}

export async function runHolisticHealthReportJob(userId: string) {
  const context = await loadHolisticHealthReportContext(userId);
  if (!context?.biomarkerHash || context.biomarkerCount === 0) {
    throw new Error("No biomarker results found");
  }

  try {
    const { report } = await generateHolisticHealthReport(context, { requireClaude: true });
    await persistHolisticHealthReport({
      userId,
      biomarkerHash: context.biomarkerHash,
      biomarkerCount: context.biomarkerCount,
      report,
    });
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markHolisticHealthReportError({
      userId,
      biomarkerHash: context.biomarkerHash,
      message,
    });
    throw error;
  }
}

export function getHolisticJobSecret() {
  return process.env.HOLISTIC_REPORT_JOB_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function normalizeHolisticHealthReport(
  report: Partial<HolisticHealthReport> | null | undefined,
  context?: HolisticContext
): HolisticHealthReport | null {
  if (isHolisticGenerationPending(report) || isHolisticGenerationError(report)) {
    return null;
  }
  const sanitized = sanitizeHolisticHealthReport(report);
  if (!sanitized) return null;
  if (context) return enrichHolisticHealthReport(sanitized, context);
  return sanitized;
}
