/**
 * Clinical risk for In Triage is derived from quiz/intake flags, not from the
 * stored triageScore. Intake scores start high (80–90) for routine hair, men's,
 * and women's cases and subtract when a contraindication is present — treating
 * those numbers as "High Risk" made every typical member look high-risk with
 * no visible reason.
 */

export type ClinicalRiskLevel = "HIGH" | "MODERATE" | "LOW";

export type ClinicalRisk = {
  level: ClinicalRiskLevel;
  reasons: string[];
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function matchesAny(items: string[], needles: string[]): string[] {
  const hits: string[] = [];
  for (const item of items) {
    const lower = item.toLowerCase();
    if (needles.some((needle) => lower.includes(needle.toLowerCase()))) {
      hits.push(item);
    }
  }
  return hits;
}

export function resolveClinicalRisk(input: {
  quizData?: Record<string, unknown> | null;
  medicalConditions?: Array<{ title?: string | null; content?: string | null; isSevere?: boolean }>;
}): ClinicalRisk {
  const data = input.quizData || {};
  const high: string[] = [];
  const moderate: string[] = [];

  const medical = asList(data.medicalConditions);
  const serious = asList(data.seriousConditions).filter(
    (item) => !/^none\b/i.test(item)
  );
  const family = asList(data.familyHistory);
  const mental = asList(data.mentalHealthConditions);
  const nitrates = String(data.takingNitrates || "").toLowerCase();
  const pregnancy = String(data.pregnancyStatus || "").toLowerCase();

  if (nitrates === "yes") {
    high.push("Taking nitrates — do not prescribe PDE5 inhibitors");
  } else if (nitrates === "unsure" || nitrates === "not-sure") {
    moderate.push("Unsure about nitrates — confirm before any ED medication");
  }

  if (pregnancy === "yes" || pregnancy === "pregnant") {
    high.push("Pregnant or planning pregnancy — some hair treatments are not suitable");
  } else if (pregnancy === "maybe") {
    moderate.push("Possible pregnancy — confirm before prescribing");
  }

  for (const item of serious) {
    high.push(`Serious condition: ${item}`);
  }

  if (mental.some((item) => /anorexia|bulimia|eating disorder/i.test(item))) {
    high.push("Eating disorder history");
  }

  const highMedical = matchesAny(medical, [
    "breast cancer",
    "blood clotting",
    "migraines with aura",
    "heart disease",
    "heart attack",
    "heart condition",
    "stroke",
    "uncontrolled blood pressure",
    "cirrhosis",
    "liver failure",
  ]);
  for (const item of highMedical) {
    high.push(item);
  }

  const liver = matchesAny(medical, ["liver"]);
  for (const item of liver) {
    if (!highMedical.includes(item)) moderate.push(item);
  }

  const highFamily = matchesAny(family, ["breast cancer", "blood clot"]);
  for (const item of highFamily) {
    moderate.push(`Family history: ${item}`);
  }

  for (const note of input.medicalConditions || []) {
    if (!note.isSevere) continue;
    const text = [note.title, note.content].filter(Boolean).join(" — ");
    if (text && !high.includes(text) && !moderate.includes(text)) {
      high.push(text);
    }
  }

  const reasons = [...high, ...moderate];
  const level: ClinicalRiskLevel = high.length > 0 ? "HIGH" : moderate.length > 0 ? "MODERATE" : "LOW";
  return { level, reasons };
}

export function clinicalRiskLabel(level: ClinicalRiskLevel): string {
  if (level === "HIGH") return "High risk";
  if (level === "MODERATE") return "Needs review";
  return "Routine";
}
