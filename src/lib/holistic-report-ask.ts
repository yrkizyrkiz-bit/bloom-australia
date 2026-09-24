import {
  type HolisticAskItem,
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticPriorityBand,
} from "@/lib/holistic-health-report-types";
import { patientFacingMarkerName, stripAskEducationalGpClosing } from "@/lib/holistic-patient-language";

export type ReportAskBullet = {
  title: string;
  body: string;
};

export type ReportAskItem = HolisticAskItem;

function markerLabel(item: HolisticMarkerItem) {
  return patientFacingMarkerName(item.biomarkerId, item.name);
}

function bandPhrase(band: HolisticPriorityBand, status: string) {
  if (band === "immediate") return "needs prompt attention";
  if (band === "needs_attention") return "needs attention";
  if (band === "look_out") return "is worth watching";
  if (status === "optimal") return "is in a healthy range";
  return "is in range";
}

/**
 * Educational clinical context for common markers (AU patient-friendly).
 * Always framed as possibilities — never a diagnosis.
 */
function clinicalInsightForMarker(item: HolisticMarkerItem): string | null {
  const id = item.biomarkerId;
  const high =
    item.band === "immediate" ||
    item.band === "needs_attention" ||
    item.band === "look_out" ||
    /\b(high|elevat|risen|jump|out of range|above)\b/i.test(item.plainEnglish);
  const low = /\b(low|below|borderline low|dipped|fallen)\b/i.test(item.plainEnglish);
  const sharpRise =
    item.previousValue != null &&
    item.value > item.previousValue * 1.5 &&
    (item.trend === "worsening" || item.trend === "declining" || high);

  if (id === "crp" || id === "hs_crp") {
    if (sharpRise || high) {
      return "A sharp CRP rise is often temporary after a cold, flu, infection, dental issue, or injury — and usually settles once you recover.";
    }
    return "CRP reflects inflammation. Short spikes often follow infection or injury; mild ongoing elevation is read with heart and metabolic markers.";
  }

  if (id === "egfr" || id === "creatinine" || id === "bun") {
    return "Kidney markers can look worse with dehydration, fever, hard training, or NSAID pain medicines. Mild changes are often rechecked rather than treated as sudden kidney failure.";
  }

  if (id === "glucose") {
    if (low) {
      return "A lower fasting sugar can reflect a long fast, meal timing, or overnight metabolism — read it with HbA1c and any symptoms.";
    }
    return "Fasting sugar can rise with illness, poor sleep, steroids, or insulin resistance. HbA1c shows the longer-term pattern.";
  }

  if (id === "hba1c") {
    return "HbA1c reflects average sugar over ~2–3 months. A clear rise usually means food, activity, and clinician follow-up matter more than one fasting reading.";
  }

  if (id === "hdl_cholesterol") {
    return "HDL can dip with less activity, weight gain, or metabolic strain — and often improves again with regular movement and sleep.";
  }

  if (id === "ldl_cholesterol" || id === "total_cholesterol" || id === "non_hdl_cholesterol") {
    return "Cholesterol moves with diet, weight, thyroid status, and genetics. Your clinician reads it with overall heart risk, not as a single verdict.";
  }

  if (id === "triglycerides") {
    return "Triglycerides rise easily with carbs, alcohol, illness, or insulin resistance — and often respond well to meal pattern and activity.";
  }

  if (id === "alt" || id === "ast" || id === "ggt" || id === "alp") {
    return "Liver enzymes can rise after a viral illness, heavier drinking, some medicines, fatty liver, or a hard workout. A one-off rise is often rechecked once you are well.";
  }

  if (id === "tsh" || id === "free_t4" || id === "free_t3") {
    return "Thyroid signals shift with illness, stress, and some medicines. Mild changes are often repeated before any treatment decision.";
  }

  if (id === "vitamin_d") {
    return "Low vitamin D is common with less sun or indoor lifestyles and is usually straightforward to correct with clinician guidance.";
  }

  if (id === "ferritin" || id === "iron" || id === "haemoglobin" || id === "hemoglobin" || id === "transferrin_saturation" || id === "mcv" || id === "mch") {
    return "Iron markers change with diet, blood loss, absorption, and inflammation — ferritin can also rise when you are infected.";
  }

  if (id === "uric_acid") {
    return "Uric acid can rise with dehydration, rich meals, alcohol, or kidney changes. Your GP interprets it with any joint symptoms.";
  }

  if (id === "testosterone_total" || id === "free_testosterone" || id === "estradiol") {
    return "Hormone levels vary with sleep, stress, illness, and draw timing — one panel is a starting conversation, not a fixed label.";
  }

  if (high || low || item.band !== "good") {
    return "Markers move with illness, medicines, hydration, sleep, and meal timing. Your GP looks at the pattern and how you feel, not one number alone.";
  }

  return null;
}

function markerBullet(item: HolisticMarkerItem): ReportAskBullet {
  const name = markerLabel(item);
  let body = item.plainEnglish.trim();

  // plainEnglish already starts with "Name: …" and repeats the value — strip that for Ask.
  if (body.toLowerCase().startsWith(name.toLowerCase() + ":")) {
    body = body.slice(name.length + 1).trim();
  }
  body = body
    .replace(/Your result is [\d.]+ ?[^\s.]+\.\s*/i, "")
    .replace(/Last time it was [\d.]+ ?[^\s.]+\.\s*/i, "")
    .replace(
      /It has moved in a less helpful direction since your last test \([^)]+\)\.\s*/i,
      ""
    )
    .replace(/This looks favourable and has improved from [\d.]+\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const change =
    item.previousValue != null
      ? ` Changed from ${item.previousValue} ${item.unit}.`
      : "";

  return {
    title: `${name}: ${item.value} ${item.unit}`,
    body: `${body}${change}`.trim(),
  };
}

/**
 * Marker label for use mid-sentence: lower-case the leading word unless it is
 * an acronym, and leave the rest (e.g. "(HbA1c)", "(MCV)") untouched.
 */
function inSentence(name: string): string {
  const trimmed = name.trim();
  const firstWord = trimmed.split(/\s+/)[0] ?? "";
  const isAcronym = /^[A-Z0-9][A-Z0-9-]*$/.test(firstWord) && firstWord.length <= 6;
  if (isAcronym || !trimmed) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function questionForMarker(item: HolisticMarkerItem): string {
  const name = inSentence(markerLabel(item));
  if (item.band === "good") return `Is my ${name} looking okay?`;
  if (item.trend === "worsening" || item.trend === "declining") {
    return `Why has my ${name} changed since my last test?`;
  }
  if (/\b(low|below|borderline low)\b/i.test(item.plainEnglish)) {
    return `Is my ${name} too low?`;
  }
  if (item.band === "immediate") return `Why does my ${name} need prompt attention?`;
  if (item.band === "needs_attention") return `Why does my ${name} need attention?`;
  if (item.band === "look_out") return `Why is my ${name} worth keeping an eye on?`;
  return `What does my ${name} result mean?`;
}

function answerForMarker(report: HolisticHealthReport, item: HolisticMarkerItem): ReportAskItem {
  const name = inSentence(markerLabel(item));
  const insight = clinicalInsightForMarker(item);
  const sharpRise = item.previousValue != null && item.value > item.previousValue * 1.5;

  return {
    id: `marker-${item.biomarkerId}`,
    question: questionForMarker(item),
    intro: sharpRise
      ? `Great question — your ${name} has changed enough to look at closely.`
      : `Great question — here’s a quick read on your ${name}.`,
    bullets: [markerBullet(item)],
    insight: insight || undefined,
    closing: undefined,
  };
}

function answerForPattern(
  report: HolisticHealthReport,
  pattern: HolisticHealthReport["crossSystemPatterns"][number],
  index: number
): ReportAskItem {
  const markerIds = new Set(pattern.involvedBiomarkers);
  const markers = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
  ].filter((m) => markerIds.has(m.biomarkerId));

  const focus = markers[0];
  const bullets = focus
    ? [markerBullet(focus)]
    : [{ title: pattern.title, body: pattern.explanation }];

  return {
    id: `pattern-${index}`,
    question: `What does “${pattern.title}” mean for me?`,
    intro: `Great question — this pattern links a few results rather than one marker alone.`,
    bullets,
    insight:
      clinicalInsightForMarker(focus) ||
      "Everyday factors like recent illness, medicines, sleep, and hydration can amplify this kind of pattern.",
    closing: undefined,
  };
}

function overallActionsAnswer(report: HolisticHealthReport): ReportAskItem {
  const focus = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
  ][0];

  const bullets: ReportAskBullet[] = focus
    ? [markerBullet(focus)]
    : report.recommendations.slice(0, 1).map((rec) => ({
        title: rec.action,
        body: rec.rationale,
      }));

  return {
    id: "overall-actions",
    question: "What should I do about my results?",
    intro: "Great question — start with the highest-impact finding first.",
    bullets,
    insight:
      clinicalInsightForMarker(focus) ||
      "Some flagged markers have ordinary explanations, like a recent bug — match the numbers to how you have felt lately.",
    closing: report.retestingGuidance || undefined,
  };
}

/** Compact report snapshot for Claude Ask prompts. */
export function buildAskReportContext(report: HolisticHealthReport): string {
  const bands = [
    ...report.priorityBands.immediate.map((m) => ({ ...m, bandLabel: "immediate" })),
    ...report.priorityBands.needsAttention.map((m) => ({ ...m, bandLabel: "needs_attention" })),
    ...report.priorityBands.lookOut.map((m) => ({ ...m, bandLabel: "look_out" })),
  ].slice(0, 12);

  const markers = bands.map((m) => ({
    id: m.biomarkerId,
    name: markerLabel(m),
    value: m.value,
    unit: m.unit,
    band: m.bandLabel,
    previous: m.previousValue ?? null,
    trend: m.trend ?? null,
    note: m.plainEnglish,
  }));

  return JSON.stringify(
    {
      title: report.reportTitle,
      score: report.overallHealthScore,
      risk: report.overallRisk,
      summary: report.executiveSummary,
      markers,
      patterns: report.crossSystemPatterns.slice(0, 4).map((p) => ({
        title: p.title,
        explanation: p.explanation,
        advice: p.monitoringAdvice,
        biomarkers: p.involvedBiomarkers,
      })),
      urgentActions: report.urgentActions.slice(0, 3),
      recommendations: report.recommendations.slice(0, 4).map((r) => r.action),
      retesting: report.retestingGuidance,
    },
    null,
    0
  );
}

/** Build 4–6 patient-facing Ask question seeds grounded in this report. */
export function buildReportAskItems(report: HolisticHealthReport): ReportAskItem[] {
  const items: ReportAskItem[] = [];
  const seenQuestions = new Set<string>();

  const push = (item: ReportAskItem) => {
    const key = item.question.toLowerCase();
    if (seenQuestions.has(key)) return;
    seenQuestions.add(key);
    items.push(item);
  };

  const ironFirst = (a: HolisticMarkerItem, b: HolisticMarkerItem) => {
    const rank = (id: string) =>
      /^(ferritin|iron|transferrin_saturation|hemoglobin|mcv|mch)$/.test(id) ? 0 : 1;
    return rank(a.biomarkerId) - rank(b.biomarkerId);
  };

  const priorityMarkers = [
    ...[...report.priorityBands.immediate].sort(ironFirst),
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
  ];

  for (const marker of priorityMarkers) {
    if (items.length >= 4) break;
    push(answerForMarker(report, marker));
  }

  for (let i = 0; i < report.crossSystemPatterns.length && items.length < 5; i++) {
    push(answerForPattern(report, report.crossSystemPatterns[i], i));
  }

  push(overallActionsAnswer(report));

  if (items.length < 4) {
    for (const marker of report.priorityBands.good.slice(0, 2)) {
      if (items.length >= 5) break;
      push(answerForMarker(report, marker));
    }
  }

  return items.slice(0, 6);
}

/**
 * Cached reports carry question text frozen at generation time. Re-derive the
 * wording from the current templates (matched by id) while keeping the stored
 * answer content, so older reports pick up copy fixes without regeneration.
 */
export function refreshAskQuestions(
  report: HolisticHealthReport,
  items: ReportAskItem[]
): ReportAskItem[] {
  // Only marker ids (marker-<biomarkerId>) are stable across regenerations;
  // pattern ids are positional, so their stored wording is left alone.
  const fresh = new Map(
    buildReportAskItems(report)
      .filter((item) => item.id.startsWith("marker-"))
      .map((item) => [item.id, item.question])
  );
  const seen = new Set<string>();
  const refreshed: ReportAskItem[] = [];
  for (const item of items) {
    const question = fresh.get(item.id) ?? item.question;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    refreshed.push(question === item.question ? item : { ...item, question });
  }
  return refreshed;
}

function withoutGpEducationalClosing(item: ReportAskItem): ReportAskItem {
  return { ...item, closing: stripAskEducationalGpClosing(item.closing) };
}

/** Match free-text to a prepared ask item, or synthesise from report markers. */
export function answerReportAskQuestion(
  report: HolisticHealthReport,
  question: string,
  catalog: ReportAskItem[]
): ReportAskItem {
  const q = question.trim().toLowerCase();
  if (!q) return withoutGpEducationalClosing(overallActionsAnswer(report));

  const exact = catalog.find((item) => item.question.toLowerCase() === q);
  if (exact) return withoutGpEducationalClosing(exact);

  const scored = catalog
    .map((item) => {
      const words = item.question
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3 && !ASK_STOP_WORDS.has(w));
      const hits = words.filter((w) => q.includes(w)).length;
      return { item, hits };
    })
    .sort((a, b) => b.hits - a.hits);

  if (scored[0] && scored[0].hits >= 2) return withoutGpEducationalClosing(scored[0].item);

  const all = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
    ...report.priorityBands.good,
  ];
  const matched = all.filter((m) => {
    const label = markerLabel(m).toLowerCase();
    return (
      q.includes(m.biomarkerId.replace(/_/g, " ")) ||
      q.includes(label) ||
      label.split(/[^a-z0-9]+/).some((w) => w.length > 3 && q.includes(w))
    );
  });
  if (matched[0]) return withoutGpEducationalClosing(answerForMarker(report, matched[0]));

  const topical = TOPIC_SYNONYMS.find(({ pattern }) => pattern.test(q));
  if (topical) {
    const topicalAnswer = answerForTopic(report, question.trim(), topical, all);
    if (topicalAnswer) return withoutGpEducationalClosing(topicalAnswer);
  }

  if (/\b(what should i do|next steps?|priorit|most important|where do i start|overall|summary)\b/.test(q)) {
    return withoutGpEducationalClosing(overallActionsAnswer(report));
  }

  return noMatchAnswer(report, question.trim());
}

const ASK_STOP_WORDS = new Set([
  "about",
  "changed",
  "does",
  "from",
  "have",
  "just",
  "keep",
  "keeping",
  "last",
  "looking",
  "mean",
  "need",
  "needs",
  "okay",
  "prompt",
  "results",
  "should",
  "since",
  "test",
  "that",
  "this",
  "together",
  "what",
  "with",
  "worth",
]);

type TopicSynonym = {
  id: string;
  label: string;
  diagnosis?: string;
  pattern: RegExp;
  markers: string[];
};

const TOPIC_SYNONYMS: TopicSynonym[] = [
  {
    id: "diabetes",
    label: "blood-sugar",
    diagnosis: "diabetes",
    pattern: /\b(diabet|pre-?diabet|blood sugar|sugar|glucose|insulin|a1c|hba1c)/,
    markers: ["hba1c", "glucose", "insulin"],
  },
  {
    id: "cholesterol",
    label: "cholesterol and blood-fat",
    diagnosis: "heart disease",
    pattern: /\b(cholesterol|lipids?|blood fats?|heart|cardio|artery|arteries|plaque)/,
    markers: ["ldl_cholesterol", "total_cholesterol", "hdl_cholesterol", "triglycerides", "apolipoprotein_b", "lipoprotein_a"],
  },
  {
    id: "anaemia",
    label: "iron and red-cell",
    diagnosis: "anaemia",
    pattern: /\b(an(a)?emi|iron|tired|fatigue|energy|pale)/,
    markers: ["ferritin", "hemoglobin", "transferrin_saturation", "iron", "hematocrit", "mcv"],
  },
  {
    id: "inflammation",
    label: "inflammation",
    pattern: /\b(inflam|infection|immune|crp)/,
    markers: ["crp", "hs_crp", "wbc"],
  },
  {
    id: "kidney",
    label: "kidney",
    pattern: /\b(kidney|renal|egfr|creatinine|dehydrat)/,
    markers: ["egfr", "creatinine", "bun", "urea", "uric_acid"],
  },
  {
    id: "liver",
    label: "liver",
    pattern: /\b(liver|hepat|alcohol|fatty)/,
    markers: ["alt", "ast", "ggt", "alp", "bilirubin"],
  },
  {
    id: "thyroid",
    label: "thyroid",
    pattern: /\b(thyroid|tsh|metabolism|weight gain)/,
    markers: ["tsh", "free_t4", "free_t3"],
  },
  {
    id: "vitamin-d",
    label: "vitamin D",
    pattern: /\b(vitamin d|vit d|bone|sunlight)/,
    markers: ["vitamin_d"],
  },
  {
    id: "b12",
    label: "B12 and folate",
    pattern: /\b(b ?12|folate|nerve|tingling)/,
    markers: ["vitamin_b12", "folate"],
  },
  {
    id: "hormones",
    label: "hormone",
    pattern: /\b(testosterone|libido|hormone|oestrogen|estrogen|menopause)/,
    markers: ["testosterone", "free_testosterone", "estradiol", "fsh", "lh", "shbg"],
  },
  {
    id: "hair",
    label: "hair-related",
    pattern: /\b(hair|hair loss|thinning)/,
    markers: ["ferritin", "tsh", "vitamin_d", "testosterone", "dht"],
  },
];

function askingForDiagnosis(question: string): boolean {
  return /\b(am i|do i have|have i got|is this|diagnos|could i have)\b/i.test(question);
}

function answerForTopic(
  _report: HolisticHealthReport,
  question: string,
  topic: TopicSynonym,
  all: HolisticMarkerItem[]
): ReportAskItem | null {
  const found = topic.markers
    .map((id) => all.find((m) => m.biomarkerId === id))
    .filter((m): m is HolisticMarkerItem => Boolean(m));
  if (!found[0]) return null;

  const diagnosisAsked = Boolean(topic.diagnosis) && askingForDiagnosis(question);
  const intro = diagnosisAsked
    ? `This report cannot diagnose ${topic.diagnosis} — that is a decision only a doctor can make. What it can show is how your ${topic.label} markers look.`
    : `Here’s what this report shows about your ${topic.label} markers.`;

  const flagged = found.filter((m) => m.band !== "good");
  const insightFocus = flagged[0] || found[0];
  const names = found.slice(0, 2).map((m) => inSentence(markerLabel(m)));
  const watchNote =
    found.some((m) => m.band === "look_out")
      ? ` ${names.join(" and ")} ${found.length > 1 ? "are" : "is"} in a watch zone on this report, which is why they appear here.`
      : found.every((m) => m.band === "good")
        ? ` On this report, ${names.join(" and ")} ${found.length > 1 ? "look" : "looks"} within a preferred range.`
        : "";

  return {
    id: `topic-${topic.id}`,
    question,
    intro,
    bullets: found.slice(0, 2).map(markerBullet),
    insight: `${clinicalInsightForMarker(insightFocus) || "Markers move with illness, medicines, sleep, and meal timing."}${watchNote}`.trim(),
    closing: undefined,
  };
}

function noMatchAnswer(report: HolisticHealthReport, question: string): ReportAskItem {
  const covered = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
  ]
    .slice(0, 3)
    .map((m) => inSentence(markerLabel(m)));

  const examples = covered.length
    ? ` Try asking about ${covered.join(", ")}, or "what should I do about my results?".`
    : ' Try asking about one of your markers, or "what should I do about my results?".';

  return {
    id: "no-match",
    question,
    intro: "I can only speak to what is in this report, and I couldn’t find a result that answers that directly.",
    bullets: [],
    insight: `Your report covers your blood-test markers and the patterns between them.${examples}`,
    closing: undefined,
  };
}
