import type {
  HolisticHealthReport,
  HolisticMarkerItem,
  HolisticOrganSystem,
  HolisticOrganSystemId,
} from "@/lib/holistic-health-report-types";
import {
  isGpHandoffCopy,
  patientFacingMarkerName,
  stripGpHandoffLanguage,
} from "@/lib/holistic-patient-language";

export type HolisticActionPlanItem = {
  organId: HolisticOrganSystemId;
  label: string;
  status: HolisticOrganSystem["status"];
  outcome: string;
  why: string;
  steps: string[];
  focusMarkers: Array<{
    biomarkerId: string;
    name: string;
    value: number;
    unit: string;
    band: HolisticMarkerItem["band"];
  }>;
};

export type HolisticActionPlan = {
  items: HolisticActionPlanItem[];
  leftoverRecommendations: Array<{ action: string; rationale: string }>;
  leftoverUrgent: string[];
};

const ORGAN_MARKER_IDS: Record<HolisticOrganSystemId, string[]> = {
  liver: ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin"],
  kidney: ["creatinine", "egfr", "bun", "uacr", "potassium", "sodium", "calcium", "phosphorus", "bicarbonate"],
  heart: [
    "total_cholesterol",
    "ldl_cholesterol",
    "hdl_cholesterol",
    "triglycerides",
    "crp",
    "hs_crp",
    "homocysteine",
  ],
  thyroid: ["tsh", "free_t4", "free_t3"],
  hormones: [
    "testosterone_total",
    "testosterone",
    "free_testosterone",
    "estradiol",
    "progesterone",
    "cortisol",
    "dhea_s",
    "fsh",
    "lh",
    "shbg",
  ],
  metabolic: ["glucose", "hba1c", "insulin", "homa_ir"],
  blood: [
    "ferritin",
    "iron",
    "transferrin_saturation",
    "tibc",
    "hemoglobin",
    "haemoglobin",
    "hematocrit",
    "mcv",
    "mch",
    "mchc",
    "rdw",
    "rbc",
  ],
};

const ORGAN_REC_HINTS: Record<HolisticOrganSystemId, RegExp> = {
  liver: /\b(liver|alt|ast|ggt|alp|alcohol|bilirubin)\b/i,
  kidney:
    /\b(kidney|creatinine|egfr|hydrat|hydrated|fluids?|urea|bun|nsaid|ibuprofen|urine protein|albumin\/creatinine|protein meals?)\b/i,
  heart: /\b(heart|crp|inflam|cholesterol|ldl|hdl|triglyceride|homocysteine)\b/i,
  thyroid: /\b(thyroid|tsh|free t4|free t3)\b/i,
  hormones: /\b(hormone|testosterone|oestrogen|estrogen|cortisol|progesterone)\b/i,
  metabolic:
    /\b(blood sugar|fasting|glucose|hba1c|carbohydrate|refined|movement|insulin|walk|sugary)\b/i,
  blood: /\b(iron|ferritin|mcv|haemoglobin|hemoglobin|anaemi|anemi|red-cell|red cell)\b/i,
};

function allMarkers(report: HolisticHealthReport): HolisticMarkerItem[] {
  const bands = report.priorityBands;
  const seen = new Set<string>();
  const out: HolisticMarkerItem[] = [];
  for (const item of [
    ...(bands?.immediate || []),
    ...(bands?.needsAttention || []),
    ...(bands?.lookOut || []),
    ...(bands?.good || []),
  ]) {
    if (seen.has(item.biomarkerId)) continue;
    seen.add(item.biomarkerId);
    out.push(item);
  }
  return out;
}

function bandRank(band: HolisticMarkerItem["band"]): number {
  if (band === "immediate") return 0;
  if (band === "needs_attention") return 1;
  if (band === "look_out") return 2;
  return 3;
}

function isFlagged(marker: HolisticMarkerItem): boolean {
  return marker.band !== "good";
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.05
    ? String(Math.round(value))
    : value.toFixed(1);
}

function cleanCopy(text?: string | null): string {
  const value = stripGpHandoffLanguage(text || "");
  return value.trim();
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const SAME_LEVER = [
  /alcohol/,
  /refined carbohydrate|sugary drink/,
  /iron-rich foods|iron rich foods/,
  /tea or coffee/,
  /ibuprofen|nsaid/,
  /walk after meals|daily movement|30 minutes of moderate/,
  /hydrat|drink steadily/,
];

function similarText(a: string, b: string): boolean {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  if (SAME_LEVER.some((pattern) => pattern.test(a) && pattern.test(b))) return true;
  const wordsA = na.split(" ").filter((word) => word.length > 3);
  const wordsB = nb.split(" ").filter((word) => word.length > 3);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((word) => setB.has(word)).length;
  const denom = Math.min(new Set(wordsA).size, setB.size);
  return denom > 0 && overlap / denom >= 0.62;
}

function isBookingCopy(text: string): boolean {
  return (
    /\bbook\b/i.test(text) &&
    /\b(gp|doctor|appointment|consult|review)\b/i.test(text)
  );
}

function isGenericRetestCopy(text: string): boolean {
  return (
    /\b(retest|repeat panel|next blood|8–12|8-12|8 to 12)\b/i.test(text) &&
    !/\b(alt|ast|ggt|alp|creatinine|egfr|crp|tsh|glucose|hba1c|ferritin|mcv|iron)\b/i.test(
      text
    )
  );
}

function isStatusOnlyUrgent(text: string): boolean {
  return /\bsits outside\b/i.test(text) || /\boutside a safer range\b/i.test(text);
}

const LIVER_FOCUS_ORDER = ["alt", "ast", "ggt", "alp", "bilirubin_total", "albumin"];

function ownedMarkers(
  organId: HolisticOrganSystemId,
  markers: HolisticMarkerItem[]
): HolisticMarkerItem[] {
  const ids = new Set(ORGAN_MARKER_IDS[organId]);
  return markers
    .filter((marker) => ids.has(marker.biomarkerId))
    .sort((a, b) => {
      if (organId === "liver") {
        const aEnzyme = a.biomarkerId !== "albumin";
        const bEnzyme = b.biomarkerId !== "albumin";
        if (aEnzyme !== bEnzyme) {
          if (a.band === "immediate" && !bEnzyme) return -1;
          if (b.band === "immediate" && !aEnzyme) return 1;
          if (aEnzyme) return -1;
          if (bEnzyme) return 1;
        }
        const order =
          LIVER_FOCUS_ORDER.indexOf(a.biomarkerId) - LIVER_FOCUS_ORDER.indexOf(b.biomarkerId);
        if (order !== 0) return order;
      }
      return bandRank(a.band) - bandRank(b.band);
    });
}

function rewriteGoalAsOutcome(
  goal: string,
  organ: HolisticOrganSystem,
  focus: HolisticMarkerItem[]
): string {
  const raw = goal.trim();
  const stripped = cleanCopy(raw) || raw;
  const top = focus[0];
  const markerName = top
    ? patientFacingMarkerName(top.biomarkerId, top.name)
    : "";
  const handoffOrBooking =
    isBookingCopy(raw) ||
    isGpHandoffCopy(raw) ||
    /^see your (?:gp|doctor)/i.test(raw) ||
    /^ask your (?:gp|doctor)/i.test(raw);

  if (handoffOrBooking) {
    if (top && (top.biomarkerId === "crp" || top.biomarkerId === "hs_crp")) {
      return `Find the cause of the rise in ${markerName} rather than treating a one-off spike as ongoing heart risk`;
    }
    if (top && ORGAN_MARKER_IDS.blood.includes(top.biomarkerId)) {
      return `Find the cause of low ${markerName} and bring blood and iron markers into a healthier range by your next test`;
    }
    if (organ.id === "heart" && /cholesterol|blood fats|ldl/i.test(raw)) {
      return "Bring cholesterol and blood fats into a healthier heart range by your next test";
    }
    if (organ.id === "thyroid" && /free t3|free t4|t3 and t4/i.test(raw)) {
      return "Include Free T3 and Free T4 on your next thyroid panel for a more complete picture";
    }
    return markerName
      ? `Find the cause of the change in ${markerName} by your next consult`
      : `Find the cause of the ${organ.label.toLowerCase()} change on this blood test`;
  }

  const hba1cTarget = stripped.match(/hba1c.{0,40}?below\s+([0-9.]+)\s*%/i);
  if (hba1cTarget) {
    return `Bring average blood sugar (HbA1c) back below ${hba1cTarget[1]}% by your next test`;
  }

  const sugarTarget = stripped.match(
    /(?:bring|keep|get|nudge)\s+.{0,40}?(?:blood sugar|glucose).{0,40}?below\s+([0-9.]+)\s*mmol/i
  );
  if (
    /refined carbohydrate|daily movement|increase daily movement|regular movement/i.test(stripped) &&
    /blood sugar|glucose|hba1c/i.test(stripped)
  ) {
    const target = sugarTarget?.[1] || "5.5";
    return `Bring fasting blood sugar back below ${target} mmol/L by your next test`;
  }

  if (organ.id === "thyroid" && /keep your thyroid monitoring on schedule/i.test(stripped)) {
    return stripped.replace(/^keep your thyroid monitoring on schedule by /i, "Keep ");
  }

  if (organ.id === "thyroid" && /adding free t3|add free t3|free t3 and t4/i.test(stripped)) {
    return "Include Free T3 and Free T4 on your next thyroid panel for a more complete picture";
  }

  return stripped;
}

function fallbackOutcome(
  organ: HolisticOrganSystem,
  focus: HolisticMarkerItem[]
): string {
  const top = focus[0];
  if (!top) return `Keep ${organ.label.toLowerCase()} on track at your next blood test`;
  const name = patientFacingMarkerName(top.biomarkerId, top.name);
  if (top.biomarkerId === "crp" || top.biomarkerId === "hs_crp") {
    return `Find the cause of the rise in ${name} rather than treating a one-off spike as ongoing heart risk`;
  }
  if (top.biomarkerId === "glucose") {
    return "Bring fasting blood sugar back below 5.5 mmol/L by your next test";
  }
  if (top.biomarkerId === "hba1c") {
    return "Bring average blood sugar (HbA1c) back below 6.0% by your next test";
  }
  if (organ.id === "liver" && top.biomarkerId === "albumin") {
    const enzyme = `${organ.riskFactor || ""} ${organ.goal || ""}`.match(/\b(ALP|ALT|AST|GGT)\b/i);
    if (enzyme) {
      return `Bring liver enzyme (${enzyme[1].toUpperCase()}) into a healthier liver range by your next blood test`;
    }
  }
  if (organ.id === "kidney" && focus.some((m) => m.biomarkerId === "egfr") && focus.some((m) => m.biomarkerId === "creatinine")) {
    return "Improve kidney filter rate (eGFR) and waste marker (creatinine) by your next blood test";
  }
  if (organ.id === "thyroid" && !isFlagged(top)) {
    return "Keep TSH on your next annual blood panel";
  }
  if (!isFlagged(top)) {
    return `Keep ${name} in range on your next blood test`;
  }
  return `Bring ${name} into a healthier ${organ.label.toLowerCase()} range by your next blood test`;
}

function whyForOrgan(organ: HolisticOrganSystem, focus: HolisticMarkerItem[]): string {
  const top = focus[0];
  const risk = cleanCopy(organ.riskFactor);
  if (!top) return risk;

  const name = patientFacingMarkerName(top.biomarkerId, top.name);
  const valueBit = `${name} is ${formatValue(top.value)} ${top.unit}`.trim();
  const bandNote =
    top.band === "immediate"
      ? "This result needs prompt attention."
      : top.band === "needs_attention"
        ? "This result is outside the preferred range."
        : top.band === "look_out"
          ? "This result is worth watching."
          : "This result is currently in range.";

  if (risk && !risk.includes(String(top.value))) {
    return `${valueBit}. ${risk}`;
  }
  if (risk) return risk;
  return `${valueBit}. ${bandNote}`;
}

function stepsForMarkers(
  organId: HolisticOrganSystemId,
  focus: HolisticMarkerItem[],
  organ?: HolisticOrganSystem
): string[] {
  const ids = new Set(focus.map((marker) => marker.biomarkerId));
  const flagged = focus.filter(isFlagged);
  const risk = `${organ?.riskFactor || ""} ${organ?.goal || ""}`;
  const thyroidSettled =
    organId === "thyroid" &&
    (flagged.length === 0 || /healthy range|no significant|in range|no major/i.test(risk));
  const steps: string[] = [];

  const add = (step: string) => {
    if (!step) return;
    if (steps.some((existing) => similarText(existing, step))) return;
    steps.push(step);
  };

  if (organId === "liver") {
    if (/ultra-processed|processed foods/i.test(risk)) {
      add("Keep ultra-processed foods and sugary drinks low to support liver enzymes.");
    }
    if (ids.has("alt") || ids.has("ast") || ids.has("ggt")) {
      add(
        "Keep alcohol low — even modest regular drinking can hold liver enzymes up."
      );
      add(
        "Cut back sugary drinks and ultra-processed foods; liver enzymes often track with metabolic load."
      );
      add(
        "List regular medicines and supplements (including paracetamol and herbals) for your next consult — some affect liver enzymes."
      );
    }
    if (ids.has("alp") && !ids.has("alt") && !ids.has("ast")) {
      add(
        "ALP can come from liver or bone. Repeat ALP with the other liver enzymes so the source is clearer."
      );
      add("Keep alcohol modest while the next panel sorts whether this is a liver or bone signal.");
    }
    add("Repeat the same liver enzymes on your next panel so you can see if the change is holding.");
  }

  if (organId === "kidney") {
    add("Drink steadily through the day unless you have been told to restrict fluids.");
    add(
      "Avoid extra over-the-counter anti-inflammatories (ibuprofen, naproxen) unless they have been cleared for you — they can stress the kidneys."
    );
    if (ids.has("creatinine") || ids.has("egfr")) {
      add(
        "Recheck creatinine and kidney filter rate (eGFR). A urine protein test (albumin/creatinine) completes the picture if it was not on this panel."
      );
    }
    if (ids.has("uacr")) {
      add("Repeat the urine albumin/creatinine ratio with the next kidney bloods.");
    }
  }

  if (organId === "heart") {
    if (ids.has("crp") || ids.has("hs_crp")) {
      add(
        "Note any recent infection, dental work, injury, or illness around the time of the test — a sharp CRP rise is often temporary."
      );
      add(
        "Repeat CRP once you are well. A single spike is not the same as ongoing heart inflammation."
      );
      add(
        "Keep the rest of the heart picture in view (cholesterol, blood pressure, daily movement) while the cause of the CRP rise is being sorted."
      );
    }
    if (
      ids.has("ldl_cholesterol") ||
      ids.has("total_cholesterol") ||
      ids.has("triglycerides")
    ) {
      add(
        "Keep saturated fat modest (fatty meat, butter, processed snacks) and favour olive oil, nuts, and fish."
      );
      add("Daily movement and not smoking support the cholesterol numbers alongside food changes.");
    }
  }

  if (organId === "thyroid") {
    if (thyroidSettled) {
      add("Include TSH on your next annual blood panel so monitoring stays on schedule.");
      add(
        "No extra thyroid change is suggested from a result already in range unless new symptoms appear."
      );
    } else {
      add("Repeat TSH (and Free T4 if it was done before) on the next panel.");
      add(
        "Note energy, weight, cold/heat tolerance, and heart-rate changes — they help interpret a thyroid number that is drifting."
      );
    }
  }

  if (organId === "metabolic") {
    if (ids.has("glucose") || ids.has("hba1c") || ids.has("insulin")) {
      add(
        "Cut back refined carbohydrates and sugary drinks — they are the fastest everyday lever on fasting blood sugar."
      );
      add(
        "Add daily movement, especially a walk after meals. Even 10–15 minutes helps glucose."
      );
      add(
        "Recheck fasting glucose (aim below 5.5 mmol/L) and HbA1c on the next panel."
      );
    }
  }

  if (organId === "blood") {
    if (
      ids.has("ferritin") ||
      ids.has("iron") ||
      ids.has("mcv") ||
      ids.has("hemoglobin") ||
      ids.has("haemoglobin")
    ) {
      const urgentIron = focus.some(
        (marker) =>
          (marker.biomarkerId === "ferritin" ||
            marker.biomarkerId === "hemoglobin" ||
            marker.biomarkerId === "haemoglobin") &&
          marker.band === "immediate"
      );
      if (urgentIron) {
        add(
          "Have iron stores, iron saturation, and haemoglobin reviewed within 1–2 weeks so the cause can be found and treatment started."
        );
      }
      add(
        "Include iron-rich foods (red meat, legumes, leafy greens) and pair them with vitamin C (citrus or tomato)."
      );
      add("Leave a gap between tea or coffee and iron-rich meals — they reduce absorption.");
      if (ids.has("mcv")) {
        add(
          "Red-cell size (MCV) usually follows iron stores, so the iron plan is the main way MCV moves."
        );
      }
      add(
        "The reason iron is low (diet, periods, gut absorption, or blood loss) needs to be established — do not stay on iron long-term without a cause."
      );
    }
  }

  if (organId === "hormones") {
    if (flagged.length === 0) {
      add("Keep the same hormone markers on your next scheduled panel.");
    } else {
      add("Repeat the flagged hormone markers on the next panel at a similar time of day.");
      add("Protect sleep and keep alcohol modest — both shift several hormone readings.");
    }
  }

  if (steps.length === 0) {
    add(
      flagged.length > 0
        ? `Repeat the flagged ${organId} markers on your next blood test so the trend is clear.`
        : `Keep the same ${organId} markers on your next blood test.`
    );
  }

  return steps.slice(0, 4);
}

function recommendationText(action: string, rationale: string): string {
  const cleanAction = cleanCopy(action);
  const cleanRationale = cleanCopy(rationale);
  if (!cleanAction) return cleanRationale;
  if (!cleanRationale || similarText(cleanAction, cleanRationale)) return cleanAction;
  if (cleanAction.length > 90) return cleanAction;
  return `${cleanAction} ${cleanRationale}`;
}

function recMatchesOrgan(
  rec: HolisticHealthReport["recommendations"][number],
  organId: HolisticOrganSystemId,
  focus: HolisticMarkerItem[]
): number {
  const recOrganId = (rec as { organId?: string }).organId;
  if (recOrganId === organId) return 8;
  if (recOrganId && recOrganId !== organId) return 0;

  const haystack = `${rec.action} ${rec.rationale}`.toLowerCase();
  let score = 0;
  if (ORGAN_REC_HINTS[organId].test(haystack)) score += 3;
  for (const marker of focus) {
    const name = patientFacingMarkerName(marker.biomarkerId, marker.name).toLowerCase();
    if (haystack.includes(marker.biomarkerId.replace(/_/g, " ")) || haystack.includes(name)) {
      score += 2;
    }
    if (marker.biomarkerId === "mcv" && /\bmcv|red-cell|red cell size\b/i.test(haystack)) {
      score += 2;
    }
  }
  return score;
}

function pickBestOrgan(
  rec: HolisticHealthReport["recommendations"][number],
  items: HolisticActionPlanItem[],
  focusByOrgan: Map<HolisticOrganSystemId, HolisticMarkerItem[]>
): HolisticOrganSystemId | null {
  let best: HolisticOrganSystemId | null = null;
  let bestScore = 0;
  for (const item of items) {
    const score = recMatchesOrgan(rec, item.organId, focusByOrgan.get(item.organId) || []);
    if (score > bestScore) {
      bestScore = score;
      best = item.organId;
    }
  }
  return bestScore >= 2 ? best : null;
}

/**
 * Join organ goals with marker-specific how-to steps and attach matching recommendations.
 * Works on cached reports that stored goals and recommendations as two separate lists.
 */
export function buildHolisticActionPlan(report: HolisticHealthReport): HolisticActionPlan {
  const markers = allMarkers(report);
  const focusByOrgan = new Map<HolisticOrganSystemId, HolisticMarkerItem[]>();

  const items: HolisticActionPlanItem[] = [];
  for (const organ of report.organSystems || []) {
    const goal = (organ.goal || "").trim();
    const owned = ownedMarkers(organ.id, markers);
    let focus = owned.filter(isFlagged);
    if (organ.id === "liver") {
      const enzymes = owned.filter((marker) => marker.biomarkerId !== "albumin");
      const flaggedEnzymes = enzymes.filter(isFlagged);
      if (flaggedEnzymes.length > 0) focus = flaggedEnzymes;
      else if (enzymes.length > 0 && /alp|alt|ast|ggt/i.test(`${organ.riskFactor || ""} ${goal}`)) {
        focus = enzymes;
      }
    }
    if (!goal && focus.length === 0) continue;

    const usedFocus = focus.length > 0 ? focus : owned.slice(0, 1);
    focusByOrgan.set(organ.id, usedFocus);
    const outcome = goal
      ? rewriteGoalAsOutcome(goal, organ, usedFocus)
      : fallbackOutcome(organ, usedFocus);
    if (!outcome) continue;

    items.push({
      organId: organ.id,
      label: organ.label,
      status: organ.status,
      outcome,
      why: whyForOrgan(organ, usedFocus),
      steps: stepsForMarkers(organ.id, usedFocus, organ),
      focusMarkers: usedFocus.slice(0, 3).map((marker) => ({
        biomarkerId: marker.biomarkerId,
        name: patientFacingMarkerName(marker.biomarkerId, marker.name),
        value: marker.value,
        unit: marker.unit,
        band: marker.band,
      })),
    });
  }

  const leftoverRecommendations: Array<{ action: string; rationale: string }> = [];
  for (const rec of report.recommendations) {
    const action = cleanCopy(rec.action);
    const rationale = cleanCopy(rec.rationale);
    if (!action && !rationale) continue;
    if (isGpHandoffCopy(rec.action) || isBookingCopy(rec.action)) continue;
    if (isGenericRetestCopy(action)) continue;

    const target = pickBestOrgan(rec, items, focusByOrgan);
    const text = recommendationText(rec.action, rec.rationale);
    if (!text) continue;
    if (target) {
      const item = items.find((row) => row.organId === target);
      if (item && !item.steps.some((step) => similarText(step, text))) {
        if (item.steps.length < 5) item.steps.push(text);
      }
      continue;
    }
    leftoverRecommendations.push({ action: action || text, rationale });
  }

  const leftoverUrgent: string[] = [];
  for (const action of report.urgentActions) {
    const text = cleanCopy(action);
    if (!text || isBookingCopy(action) || isStatusOnlyUrgent(text) || isGpHandoffCopy(action)) {
      continue;
    }
    if (text.length < 36 || /^[a-z]/.test(text) || /^\W/.test(text)) continue;
    const target = items.find(
      (item) =>
        recMatchesOrgan(
          { category: "follow_up", priority: "high", action: text, rationale: "" },
          item.organId,
          focusByOrgan.get(item.organId) || []
        ) >= 2
    );
    if (target && !target.steps.some((step) => similarText(step, text))) {
      if (target.steps.length < 5) {
        if (/\b(1–2|1-2)\s+weeks\b/i.test(text)) target.steps.unshift(text);
        else target.steps.push(text);
      }
      continue;
    }
    leftoverUrgent.push(text);
  }

  return { items, leftoverRecommendations, leftoverUrgent };
}
