import { getBiomarkerById } from "@/data/biomarkers";

/** Everyday labels patients recognise — lab codes go in brackets, not as the headline. */
const PATIENT_FACING_LABELS: Record<string, string> = {
  ldl_cholesterol: "Bad cholesterol (LDL)",
  hdl_cholesterol: "Good cholesterol (HDL)",
  total_cholesterol: "Total cholesterol",
  triglycerides: "Blood fats (triglycerides)",
  non_hdl_cholesterol: "Other cholesterol (non-HDL)",
  vldl_cholesterol: "Blood-fat cholesterol (VLDL)",
  glucose: "Blood sugar",
  hba1c: "Average blood sugar (HbA1c)",
  insulin: "Insulin (blood-sugar hormone)",
  homa_ir: "Insulin resistance score (HOMA-IR)",
  egfr: "Kidney filter rate (eGFR)",
  creatinine: "Kidney waste marker (creatinine)",
  bun: "Kidney waste marker (urea/BUN)",
  uacr: "Urine protein (albumin/creatinine)",
  alt: "Liver enzyme (ALT)",
  ast: "Liver enzyme (AST)",
  ggt: "Liver enzyme (GGT)",
  alp: "Liver enzyme (ALP)",
  bilirubin_total: "Bilirubin (liver pigment)",
  albumin: "Blood protein (albumin)",
  crp: "Inflammation marker (CRP)",
  hs_crp: "Inflammation marker (hs-CRP)",
  homocysteine: "Homocysteine (heart-risk marker)",
  tsh: "Thyroid signal (TSH)",
  free_t4: "Thyroid hormone (Free T4)",
  free_t3: "Thyroid hormone (Free T3)",
  testosterone: "Testosterone",
  testosterone_total: "Testosterone",
  free_testosterone: "Free testosterone",
  estradiol: "Oestrogen (estradiol)",
  progesterone: "Progesterone",
  shbg: "Hormone-binding protein (SHBG)",
  cortisol: "Cortisol (stress hormone)",
  vitamin_d: "Vitamin D",
  b12: "Vitamin B12",
  folate: "Folate (B9)",
  ferritin: "Iron stores (ferritin)",
  iron: "Iron",
  transferrin_saturation: "Iron saturation (transferrin)",
  tibc: "Iron-binding capacity (TIBC)",
  haemoglobin: "Haemoglobin (oxygen in blood)",
  hemoglobin: "Haemoglobin (oxygen in blood)",
  hematocrit: "Haematocrit (red-cell volume)",
  mcv: "Red-cell size (MCV)",
  mch: "Haemoglobin per cell (MCH)",
  mchc: "Haemoglobin concentration (MCHC)",
  rdw: "Red-cell size variation (RDW)",
  rbc: "Red blood cell count",
  platelets: "Platelets (clotting cells)",
  potassium: "Potassium",
  sodium: "Sodium",
  calcium: "Calcium",
  phosphorus: "Phosphorus",
  bicarbonate: "Bicarbonate",
  pth: "Parathyroid hormone (PTH)",
};

export function patientFacingMarkerName(biomarkerId: string, fallbackName?: string): string {
  if (PATIENT_FACING_LABELS[biomarkerId]) return PATIENT_FACING_LABELS[biomarkerId];
  const def = getBiomarkerById(biomarkerId);
  if (def?.name) return def.name;
  return fallbackName || biomarkerId.replace(/_/g, " ");
}

export function markerMeaning(biomarkerId: string): string {
  const def = getBiomarkerById(biomarkerId);
  if (def?.description) return def.description.replace(/\s+/g, " ").trim();
  return "This is one of the markers from your blood test.";
}

export type CombinedTrendInput = {
  trend?: string | null;
  status?: string | null;
  band?: string | null;
  value?: number | string | null;
  previousValue?: number | string | null;
};

export type CombinedTrendTone = "positive" | "watch" | "alert" | "neutral";

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Current band in everyday words — not a trend. */
export function rangeWordFromStatus(
  status?: string | null,
  band?: string | null
): "optimal" | "normal" | "out of range" {
  const statusKey = String(status || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  const bandKey = String(band || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  if (
    statusKey === "optimal" ||
    statusKey === "good" ||
    statusKey.includes("optimal")
  ) {
    return "optimal";
  }
  if (
    statusKey === "normal" ||
    statusKey === "in range" ||
    statusKey === "borderline" ||
    statusKey === "watch" ||
    statusKey === "look out"
  ) {
    return "normal";
  }
  if (
    statusKey.includes("out of range") ||
    statusKey === "critical" ||
    statusKey === "high" ||
    statusKey === "low" ||
    statusKey === "elevated" ||
    statusKey === "needs attention" ||
    bandKey === "needs attention" ||
    bandKey === "immediate"
  ) {
    return "out of range";
  }
  if (bandKey === "good") return "optimal";
  if (bandKey === "look out") return "normal";
  if (statusKey) return "normal";
  return "normal";
}

function movementWord(input: CombinedTrendInput): "improved" | "declined" | "elevated" | "stable" {
  const trend = String(input.trend || "").toLowerCase();
  const value = asFiniteNumber(input.value);
  const previous = asFiniteNumber(input.previousValue);

  if (trend === "improving") return "improved";

  if (trend === "worsening" || trend === "declining") {
    if (value != null && previous != null) {
      if (value > previous) return "elevated";
      if (value < previous) return "declined";
    }
    return "declined";
  }

  return "stable";
}

/**
 * Pair direction with the current range, e.g. "Declined but still optimal".
 * A change inside optimal/normal is never labelled "needs attention".
 */
export function combinedTrendStatusLabel(input: CombinedTrendInput): string {
  const movement = movementWord(input);
  const range = rangeWordFromStatus(input.status, input.band);
  const inRange = range === "optimal" || range === "normal";

  if (movement === "stable") {
    if (inRange) return `Still ${range}`;
    return "Out of range";
  }
  if (movement === "improved") {
    if (inRange) return `Improved and still ${range}`;
    return "Improved but still out of range";
  }
  if (inRange) return sentenceCase(`${movement} but still ${range}`);
  return sentenceCase(`${movement} and out of range`);
}

export function worstRangeStatus(statuses: Array<string | null | undefined>): string {
  let worst: "optimal" | "normal" | "out of range" = "optimal";
  let sawStatus = false;
  for (const status of statuses) {
    if (status == null || String(status).trim() === "") continue;
    sawStatus = true;
    const range = rangeWordFromStatus(status);
    if (range === "out of range") return "out of range";
    if (range === "normal") worst = "normal";
  }
  return sawStatus ? worst : "normal";
}

export function combinedTrendStatusTone(input: CombinedTrendInput): CombinedTrendTone {
  const movement = movementWord(input);
  const range = rangeWordFromStatus(input.status, input.band);
  const inRange = range === "optimal" || range === "normal";

  if (!inRange) return movement === "improved" ? "watch" : "alert";
  if (movement === "declined" || movement === "elevated") return "watch";
  if (movement === "improved") return "positive";
  return "neutral";
}

export function trendDisplayLabel(
  trend?: string | null,
  status?: string | null,
  extra?: Omit<CombinedTrendInput, "trend" | "status">
): string {
  return combinedTrendStatusLabel({ trend, status, ...extra });
}

export function trendArrowLabel(
  trend?: string | null,
  status?: string | null,
  extra?: Omit<CombinedTrendInput, "trend" | "status">
): string {
  return combinedTrendStatusLabel({ trend, status, ...extra });
}

const GP_NOUN = String.raw`(?:GP|doctor|physician|clinician)`;
const GP_HANDOFF_LEAD =
  /^(?:please\s+)?(?:ask|talk(?:\s+with)?|speak(?:\s+with|\s+to)?|see|visit|contact|call|mention|discuss|tell|flag|bring)\b/i;

function mentionsClinician(text: string): boolean {
  return new RegExp(`\\b${GP_NOUN}\\b`, "i").test(text);
}

/** True when copy is mainly telling the member to involve their GP or doctor. */
export function isGpHandoffCopy(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (mentionsClinician(value) && GP_HANDOFF_LEAD.test(value)) return true;
  if (
    /^(?:please\s+)?ask\b/i.test(value) &&
    /\b(review|repeat|test|panel|appointment|consult|gp|doctor|clinician|iron|crp|blood)\b/i.test(value)
  ) {
    return true;
  }
  if (!mentionsClinician(value)) return false;
  return new RegExp(
    `(?:ask|talk(?:\\s+with)?|speak(?:\\s+with|\\s+to)?|see|visit|contact|call|mention|discuss|tell|flag|bring(?:\\s+\\w+){0,6}\\s+up).{0,80}\\b(?:your\\s+)?${GP_NOUN}\\b|\\b(?:with|to)\\s+your\\s+${GP_NOUN}\\b`,
    "i"
  ).test(value);
}

/** Shown once under a group of report cards, never on each card. */
export const GP_NEXT_CONSULT_COPY =
  "Your GP will discuss these with you in detail during your next consultation.";

export function isGpConsultCopy(text?: string | null): boolean {
  const value = (text || "").trim().replace(/\.+$/, "");
  return value === GP_NEXT_CONSULT_COPY.replace(/\.+$/, "");
}

/**
 * Remove GP/doctor handoff phrasing from member-facing cards.
 * The consult line is rendered once under the card group, not on every card.
 */
export function stripGpHandoffLanguage(text: string): string {
  if (typeof text !== "string" || !text.trim()) return "";
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) return "";

  const kept: string[] = [];

  for (const original of sentences) {
    if (isGpConsultCopy(original) || isGpHandoffCopy(original)) {
      continue;
    }

    let next = original
      .replace(
        /\b(?:please\s+)?(?:ask|talk with|speak with|speak to|see|visit|contact|call)\s+your\s+(?:GP|doctor|physician)(?:\s+or\s+Sanative care team)?(?:\s+about)?/gi,
        ""
      )
      .replace(/\bmention(?:\s+\w+){0,8}\s+to\s+your\s+(?:GP|doctor|physician)\b/gi, "")
      .replace(
        /\bdiscuss(?:\s+\w+){0,10}\s+with\s+your\s+(?:GP|doctor|physician)(?:\s+or\s+Sanative care team)?\b/gi,
        ""
      )
      .replace(
        /\b(?:reviewed?|confirm(?:ed)?|check(?:ed)?)\s+with\s+your\s+(?:GP|doctor|physician)(?:\s+or\s+Sanative care team)?\b/gi,
        ""
      )
      .replace(/\bwith your\s+(?:GP|doctor|physician)(?:\s+or\s+Sanative care team)?\b/gi, "")
      .replace(/\bto your\s+(?:GP|doctor|physician)\b/gi, "")
      .replace(/\byour\s+(?:GP|doctor|physician)(?:\s+or\s+Sanative care team)?\b/gi, "")
      .replace(/\s+(?:and|or)\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/^[,.;:\s]+/, "")
      .replace(/\s+\./g, ".")
      .trim();
    if (!next || /^(?:about|and|or|to|with|for)\b/i.test(next) || isGpHandoffCopy(next) || isGpConsultCopy(next)) {
      continue;
    }
    kept.push(next.charAt(0).toUpperCase() + next.slice(1));
  }

  return kept.join(" ").replace(/\s{2,}/g, " ").trim();
}

/** Drop the canned Ask footer that tells the member to check with their GP. */
export function stripAskEducationalGpClosing(closing?: string | null): string | undefined {
  const value = (closing || "").trim();
  if (!value) return undefined;
  const normalized = value.replace(/[—–]/g, "-").replace(/\s+/g, " ").toLowerCase();
  if (
    normalized.includes("educational only") &&
    (normalized.includes("your gp") ||
      normalized.includes("your doctor") ||
      normalized.includes("care team"))
  ) {
    return undefined;
  }
  return value;
}
