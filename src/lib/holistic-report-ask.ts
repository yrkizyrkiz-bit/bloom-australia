import {
  type HolisticAskItem,
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticPriorityBand,
} from "@/lib/holistic-health-report-types";
import { patientFacingMarkerName } from "@/lib/holistic-patient-language";

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
      return "A sharp CRP rise is often temporary after a cold, flu, infection, dental issue, or injury — and usually settles once you recover. Mention any recent illness to your GP; they may simply retest.";
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

function questionForMarker(item: HolisticMarkerItem): string {
  const name = markerLabel(item);
  const lower = name.toLowerCase();
  if (item.band === "good") return `Is my ${lower} looking okay?`;
  if (item.trend === "worsening" || item.trend === "declining") {
    return `Why has my ${lower} changed?`;
  }
  if (/\b(low|below|borderline low)\b/i.test(item.plainEnglish)) {
    return `Is my ${lower} too low?`;
  }
  return `Why is my ${lower} ${bandPhrase(item.band, item.status)}?`;
}

function answerForMarker(report: HolisticHealthReport, item: HolisticMarkerItem): ReportAskItem {
  const name = markerLabel(item);
  const insight = clinicalInsightForMarker(item);
  const sharpRise = item.previousValue != null && item.value > item.previousValue * 1.5;

  return {
    id: `marker-${item.biomarkerId}`,
    question: questionForMarker(item),
    intro: sharpRise
      ? `Great question — ${name} has changed enough to look at closely.`
      : `Great question — here’s a quick read on your ${name}.`,
    bullets: [markerBullet(item)],
    insight: insight || undefined,
    closing: "Educational only — check next steps with your GP or Sanative care team.",
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

/** Match free-text to a prepared ask item, or synthesise from report markers. */
export function answerReportAskQuestion(
  report: HolisticHealthReport,
  question: string,
  catalog: ReportAskItem[]
): ReportAskItem {
  const q = question.trim().toLowerCase();
  if (!q) return overallActionsAnswer(report);

  const exact = catalog.find((item) => item.question.toLowerCase() === q);
  if (exact) return exact;

  const scored = catalog
    .map((item) => {
      const words = item.question
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3);
      const hits = words.filter((w) => q.includes(w)).length;
      return { item, hits };
    })
    .sort((a, b) => b.hits - a.hits);

  if (scored[0] && scored[0].hits >= 2) return scored[0].item;

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

  if (matched[0]) return answerForMarker(report, matched[0]);
  return overallActionsAnswer(report);
}
