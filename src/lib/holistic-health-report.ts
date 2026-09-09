import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getActiveEntitlements } from "@/lib/membership/entitlement-service";
import {
  loadOrganCareReportContext,
} from "@/lib/organ-care-ai-report";
import {
  healthTestsConfig,
  getGlycemicFlag,
  getCkdStageLabel,
  getHormoneStatusLabel,
  getThyroidStatusLabel,
} from "@/lib/healthTestScoring";
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
// Keep well under typical Netlify function limits so mobile clients get a
// deterministic report instead of a blank "Generation failed" gateway timeout.
const CLAUDE_TIMEOUT_MS = Number(process.env.HOLISTIC_HEALTH_AI_TIMEOUT_MS || 18_000);
const CLAUDE_MAX_TOKENS = 4000;

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
      "Sustained weight loss and metabolic care commonly improve fasting glucose, HbA1c, triglycerides, liver enzymes (ALT/GGT), and inflammatory markers over 3–6 months when nutrition, activity, and treatment plans are followed.",
    markersLikelyToImprove: ["glucose", "hba1c", "triglycerides", "alt", "ggt", "crp"],
    monitoringFocus:
      "Re-check metabolic panel, lipids, and liver enzymes after meaningful weight change or dose adjustments.",
  },
  HAIR_LOSS: {
    label: "Hair",
    howItHelpsFutureResults:
      "Hair programs mainly target scalp and hormone pathways; they rarely change organ scores directly, but related hormone or iron workups can still matter for overall wellbeing.",
    markersLikelyToImprove: ["ferritin", "iron", "tsh"],
    monitoringFocus: "Track iron studies and thyroid markers if fatigue or shedding persists.",
  },
  MENS_HEALTH_VITALITY: {
    label: "Men’s Vitality",
    howItHelpsFutureResults:
      "Vitality care can support energy, body composition, and hormone balance, which may indirectly improve metabolic and inflammatory markers over time.",
    markersLikelyToImprove: ["testosterone_total", "free_testosterone", "shbg", "hba1c"],
    monitoringFocus: "Repeat hormone panel and metabolic markers with clinical review.",
  },
  MENS_HEALTH_SEXUAL: {
    label: "Men’s Sexual Health",
    howItHelpsFutureResults:
      "Sexual health care focuses on symptoms and vascular/hormonal contributors; cardiometabolic optimisation often supports better long-term outcomes.",
    markersLikelyToImprove: ["total_cholesterol", "ldl_cholesterol", "glucose", "hba1c"],
    monitoringFocus: "Keep heart and metabolic markers in view alongside symptom response.",
  },
  WOMENS_HEALTH_VITALITY: {
    label: "Women’s Vitality",
    howItHelpsFutureResults:
      "Hormone-balanced vitality care can support sleep, stress, and metabolic resilience, which may improve cortisol patterns, thyroid follow-up needs, and metabolic markers.",
    markersLikelyToImprove: ["cortisol", "tsh", "free_t4", "glucose"],
    monitoringFocus: "Align hormone timing with cycle/context and re-check metabolic labs as advised.",
  },
  WOMENS_HEALTH_SEXUAL: {
    label: "Women’s Sexual Health",
    howItHelpsFutureResults:
      "Sexual health support is primarily symptom-focused; whole-body metabolic and hormone optimisation can still improve related wellbeing markers.",
    markersLikelyToImprove: ["estradiol", "testosterone_total", "tsh"],
    monitoringFocus: "Review hormones in clinical context and track overlapping metabolic risk.",
  },
  ORGAN_CARE: {
    label: "Organ & Metabolic Care",
    howItHelpsFutureResults:
      "Organ Care membership supports structured monitoring of liver, heart, kidney, thyroid, hormones, and metabolic markers—so future reports can show clearer trends and earlier course-correction.",
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
      executiveSummary: { type: "string" },
      clinicalContext: { type: "string" },
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
  const name = summary.shortName || summary.name;
  const prior =
    summary.previousValue != null
      ? ` Previous result was ${summary.previousValue} ${summary.unit}.`
      : "";

  if (band === "immediate") {
    return `${name} is ${summary.value} ${summary.unit} and needs prompt clinical review.${prior}`;
  }
  if (band === "needs_attention") {
    return `${name} is outside the preferred range at ${summary.value} ${summary.unit}.${prior} Plan follow-up with your GP or Sanative care team.`;
  }
  if (band === "look_out") {
    if (summary.trend === "worsening" && summary.previousValue != null) {
      return `${name} has moved in a less favourable direction since your last test (${summary.previousValue} → ${summary.value} ${summary.unit}). Worth watching.`;
    }
    return `${name} is ${summary.value} ${summary.unit} and worth monitoring even if not urgent.`;
  }
  if (summary.trend === "improving" && summary.previousValue != null) {
    return `${name} looks favourable at ${summary.value} ${summary.unit} and has improved from ${summary.previousValue}.`;
  }
  return `${name} looks favourable at ${summary.value} ${summary.unit}.`;
}

function buildMarkerItems(context: OrganCareContext): HolisticMarkerItem[] {
  return context.biomarkerSummaries.map((summary) => {
    const band = bandForMarker(summary);
    return {
      biomarkerId: summary.biomarkerId,
      name: summary.shortName || summary.name,
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
      title: "Metabolic pattern across sugar and lipids",
      severity: context.clinicalFlags.glycemic === "diabetic" ? "high" : "medium",
      involvedSystems: ["metabolic", "heart", "liver"],
      involvedBiomarkers: metabolic.map((m) => m.biomarkerId),
      explanation:
        "Glucose regulation and related lipids/liver markers often move together. Looking at them as a set gives a clearer whole-body picture than any single number.",
      monitoringAdvice:
        "Discuss fasting glucose, HbA1c, lipids and liver enzymes with your GP; repeat in a clinically appropriate window.",
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
        "Several cardiovascular markers are outside preferred ranges or trending less favourably, which can compound metabolic risk.",
      monitoringAdvice:
        "Review lipids, blood pressure, and lifestyle measures with your clinician; consider earlier repeat lipids if treatment changes.",
    });
  }

  const liver = flagged(["alt", "ast", "ggt", "alp", "bilirubin_total"]);
  if (liver.length >= 2) {
    patterns.push({
      title: "Liver stress with metabolic overlap",
      severity: liver.length >= 3 ? "high" : "medium",
      involvedSystems: ["liver", "metabolic"],
      involvedBiomarkers: liver.map((m) => m.biomarkerId),
      explanation:
        "Liver enzymes rising together often track metabolic load, medications, alcohol intake, or fatty liver risk—not a single isolated finding.",
      monitoringAdvice: "Repeat LFTs and correlate with metabolic markers and medication/alcohol history.",
    });
  }

  const kidney = flagged(["creatinine", "egfr", "bun", "uacr"]);
  if (kidney.length >= 1 && !context.clinicalFlags.ckdStage.startsWith("Normal")) {
    patterns.push({
      title: "Kidney filtration context",
      severity: context.clinicalFlags.ckdStage.startsWith("Severe") || context.clinicalFlags.ckdStage.startsWith("Kidney")
        ? "high"
        : "medium",
      involvedSystems: ["kidney", "heart", "metabolic"],
      involvedBiomarkers: kidney.map((m) => m.biomarkerId),
      explanation: `Kidney markers currently map to ${context.clinicalFlags.ckdStage}. Kidney, heart, and metabolic health influence each other over time.`,
      monitoringAdvice: "Confirm eGFR/creatinine trend and urine albumin with your GP; optimise blood pressure and glucose.",
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
    `Your holistic score is ${context.healthScores.overall}/100 across liver, heart, kidney, thyroid, hormones, and metabolic markers.`,
    immediateNames.length
      ? `Priority review: ${immediateNames.join(", ")}.`
      : attentionNames.length
        ? `Main areas to discuss: ${attentionNames.join(", ")}.`
        : "No immediate laboratory red flags were detected from available markers.",
    context.programs.length
      ? `Your enrolled programs (${context.programs.map((p) => p.label).join(", ")}) are included for how they may support future results.`
      : "Enrolling in a Sanative program can help target the markers most likely to improve next.",
  ].join(" ");

  const urgentActions = priorityBands.immediate.map(
    (m) => `Arrange prompt clinical review of ${m.name} (${m.value} ${m.unit}).`
  );

  const recommendations: HolisticHealthReport["recommendations"] = [
    ...urgentActions.slice(0, 3).map((action) => ({
      category: "follow_up" as const,
      priority: "high" as const,
      action,
      rationale: "Educational escalation based on laboratory thresholds used in Australian practice.",
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
      action: "Repeat priority out-of-range and trending markers on your next blood panel.",
      rationale: "Trend clarity needs comparable follow-up labs, not a one-off snapshot.",
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
    clinicalContext: `Glycaemic flag: ${context.clinicalFlags.glycemic}. Kidney stage label: ${context.clinicalFlags.ckdStage}. Thyroid: ${context.clinicalFlags.thyroidStatus}. Hormones: ${context.clinicalFlags.hormoneStatus}. Latest panel date: ${context.dataDate?.slice(0, 10) ?? "unknown"}.`,
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
        ? "Arrange clinician review promptly, then retest flagged markers as advised (often sooner than a routine annual panel)."
        : "Plan a repeat panel in 3–6 months, or sooner if treatment/lifestyle changes or symptoms change.",
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
  return `You are an expert Australian clinical biochemist and preventive-care educator writing a Holistic Health Report for a Sanative member.

Hard rules (AU-aligned):
- Educational only. Do NOT diagnose, prescribe, or claim disease certainty.
- Use ONLY provided data. No open-web facts.
- Prefer RACGP/Australian pathology framing (mmol/L glucose, HbA1c %, eGFR stages).
- Push insight quality: connect liver + heart + kidney + metabolic patterns; compare with previous values when present.
- Plain English for the member; keep a crisp care-team handoff summary for clinicians.
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
- reportTitle, overallRisk, executiveSummary (4 short sentences), clinicalContext (1 paragraph)
- careTeamHandoffSummary (clinician-facing, 4-6 sentences max)
- organSystems: refine summaries/highlights for liver, heart, kidney and any other systems with data (keep scores aligned to seed)
- crossSystemPatterns: 2-5 patterns spanning systems
- recommendations (max 8), questionsForCareTeam (3-5), retestingGuidance, urgentActions, limitations, analysisTimestamp (ISO)`;
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
        summary: fromAi?.summary || seedOrgan.summary,
        highlights: fromAi?.highlights?.length ? fromAi.highlights : seedOrgan.highlights,
      };
    }),
  };
}

export async function generateHolisticHealthReport(context: HolisticContext): Promise<{
  report: HolisticHealthReport;
  usedFallback: boolean;
}> {
  const seed = buildDeterministicHolisticReport(context);

  // Prefer a reliable report on serverless. Set HOLISTIC_HEALTH_AI_ENABLED=1 to opt into Claude.
  const aiEnabled =
    process.env.HOLISTIC_HEALTH_AI_ENABLED === "1" ||
    process.env.HOLISTIC_HEALTH_AI_ENABLED === "true";

  if (!aiEnabled || !process.env.ANTHROPIC_API_KEY) {
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
    console.warn("[holistic-health-report] Claude failed, deterministic fallback:", detail);
    return { report: seed, usedFallback: true };
  }
}

export function normalizeHolisticHealthReport(
  report: Partial<HolisticHealthReport> | null | undefined,
  context?: HolisticContext
): HolisticHealthReport | null {
  const sanitized = sanitizeHolisticHealthReport(report);
  if (!sanitized) return null;
  if (context) return enrichHolisticHealthReport(sanitized, context);
  return sanitized;
}
