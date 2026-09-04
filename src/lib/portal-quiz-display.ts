import { PROGRAM_LABELS, SCOPE_LABELS, type ProgramKey, type ScopeKey } from "@/lib/membership/keys";
import { getBiomarkersQuizQuestions, parseBiomarkersAnswer } from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { getPublicBiomarkersPanelQuizQuestions } from "@/lib/biomarkers/public-biomarkers-panel-quiz";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { getOrganCareQuizQuestions } from "@/lib/programs/quizzes/organ-care-intake-quiz";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import { getSexualHealthQuizSteps, isSexualHealthProgram } from "@/lib/programs/quizzes/sexual-health-quiz";
import { GENERIC_PROGRAM_QUIZ } from "@/lib/programs/quizzes/generic-program-quiz";
import { STRIP_FROM_PUBLIC_FUNNEL_ANSWERS } from "@/lib/portal/public-funnel-answer-fields";

export const PORTAL_QUIZ_TAB_ORDER = [
  "ORGAN_CARE",
  "BIOLOGICAL_CLOCK",
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH_SEXUAL",
  "WOMENS_HEALTH_SEXUAL",
  "MENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_VITALITY",
] as const;

export type PortalQuizTabKey = (typeof PORTAL_QUIZ_TAB_ORDER)[number];

export function portalQuizTabLabel(programKey: string): string {
  if (programKey === "ORGAN_CARE") return "Organ & Metabolic Care";
  if (programKey === "BIOLOGICAL_CLOCK") return "Biomarkers Intake Quiz";
  if (programKey === "HAIR_LOSS") return "Hair health";
  if (programKey in PROGRAM_LABELS) {
    return PROGRAM_LABELS[programKey as ProgramKey];
  }
  if (programKey in SCOPE_LABELS) {
    return SCOPE_LABELS[programKey as ScopeKey];
  }
  return programKey.replace(/_/g, " ");
}

/** System notes created from public program quizzes — they belong on the program tab, not Notes. */
export const HAIR_QUIZ_INTAKE_NOTE_TITLES = [
  "Hair Loss, Stage",
  "Hair Loss, Timeline",
  "Hair Loss, Family History",
  "Hair Loss, Medical Conditions",
  "Hair Loss, Pregnancy Status (FLAG)",
] as const;

export const WM_QUIZ_INTAKE_NOTE_TITLES = [
  "Patient Motivations",
  "Previous Weight Loss Attempts",
  "Previous Treatment",
  "Exercise Frequency",
  "Waist Measurement",
  "Preferred Start Timing",
] as const;

const PROGRAM_QUIZ_NOTE_PREFIXES = [
  "Hair Loss,",
  "Men's Health,",
  "Men's Sexual Health,",
  "Women's Health,",
  "Triage,",
] as const;

export function isProgramQuizIntakeNote(note: {
  title?: string | null;
  createdBy?: string | null;
}): boolean {
  const title = (note.title || "").trim();
  if (!title) return false;
  if (note.createdBy && note.createdBy !== "system") return false;
  if (PROGRAM_QUIZ_NOTE_PREFIXES.some((prefix) => title.startsWith(prefix))) return true;
  return (WM_QUIZ_INTAKE_NOTE_TITLES as readonly string[]).includes(title);
}

/** @deprecated Use isProgramQuizIntakeNote */
export function isHairQuizIntakeNote(note: {
  title?: string | null;
  createdBy?: string | null;
}): boolean {
  return isProgramQuizIntakeNote(note);
}

function quizGenderFromAnswers(answers?: Record<string, unknown>): string | null {
  const raw = answers?.gender;
  return typeof raw === "string" && raw.trim() ? raw : null;
}

function answerValues(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean);
  return parseBiomarkersAnswer(String(raw));
}

function matchQuizOption(
  step: { options: Array<{ id: string; label: string }> },
  value: string
) {
  const needle = value.trim().toLowerCase();
  return step.options.find(
    (option) => option.id.toLowerCase() === needle || option.label.toLowerCase() === needle
  );
}

function resolveQuizSteps(programKey: string, gender?: string | null, answers?: Record<string, unknown>) {
  if (programKey === "ORGAN_CARE") {
    return getOrganCareQuizQuestions(
      gender,
      answers as Record<string, string> | undefined
    );
  }
  if (programKey === "BIOLOGICAL_CLOCK") {
    const tierRaw = answers?._publicPanelTier;
    if (typeof tierRaw === "string" && isValidPublicPanelTier(tierRaw)) {
      return getPublicBiomarkersPanelQuizQuestions(
        tierRaw,
        gender,
        answers as Record<string, string> | undefined
      );
    }
    return getBiomarkersQuizQuestions(
      gender,
      answers as Record<string, string> | undefined
    );
  }
  const pk = programKey as ProgramKey;
  if (pk === "WOMENS_HEALTH_SEXUAL" && hasPublicWomensAssessmentAnswers(answers)) {
    return getPublicFunnelQuizSteps("WOMENS_HEALTH_VITALITY", gender, answers) ?? [];
  }
  if (isSexualHealthProgram(pk)) {
    return getSexualHealthQuizSteps(pk, sexualHealthAnswerRecord(answers)) ?? [];
  }
  const funnel = getPublicFunnelQuizSteps(pk, gender, answers);
  if (funnel) return funnel;
  return GENERIC_PROGRAM_QUIZ;
}

function hasPublicWomensAssessmentAnswers(answers?: Record<string, unknown>): boolean {
  if (!answers) return false;
  return Boolean(
    (typeof answers.category === "string" && answers.category) ||
      (Array.isArray(answers.primaryConcerns) && answers.primaryConcerns.length > 0) ||
      (Array.isArray(answers.goals) && answers.goals.length > 0) ||
      (Array.isArray(answers.currentTreatments) && answers.currentTreatments.length > 0)
  );
}

function resolveSexualHealthFocus(answers?: Record<string, unknown>): string {
  if (typeof answers?.treatmentFocus === "string" && answers.treatmentFocus.trim()) {
    return answers.treatmentFocus;
  }
  const concern = typeof answers?.concern === "string" ? answers.concern.toLowerCase() : "";
  if (concern === "erectile-dysfunction") return "ed";
  if (concern === "premature-ejaculation") return "pe";
  return "";
}

function sexualHealthAnswerRecord(answers?: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!answers) return out;
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  const focus = resolveSexualHealthFocus(answers);
  if (focus) out.treatmentFocus = focus;
  return out;
}

function hasDedicatedProgramQuiz(
  programKey: string,
  gender?: string | null,
  answers?: Record<string, unknown>
): boolean {
  const pk = programKey as ProgramKey;
  if (isSexualHealthProgram(pk)) return true;
  return Boolean(getPublicFunnelQuizSteps(pk, gender, answers));
}

export type PortalQuizDisplayRow = {
  questionId: string;
  question: string;
  answerId: string;
  answerLabel: string;
};

export function formatPortalQuizAnswers(
  programKey: string,
  answers: Record<string, unknown>,
  gender?: string | null
): PortalQuizDisplayRow[] {
  const resolvedGender = quizGenderFromAnswers(answers) || gender;
  const steps = resolveQuizSteps(programKey, resolvedGender, answers);
  const rows: PortalQuizDisplayRow[] = [];
  const seen = new Set<string>();

  for (const step of steps) {
    const raw = answers[step.id];
    const values = answerValues(raw);
    if (values.length === 0) continue;
    seen.add(step.id);

    const labels = values.map((value) => matchQuizOption(step, value)?.label ?? value);
    rows.push({
      questionId: step.id,
      question: step.prompt,
      answerId: values.join(", "),
      answerLabel: labels.join("; "),
    });
  }

  if (hasDedicatedProgramQuiz(programKey, resolvedGender, answers)) return rows;

  for (const [key, value] of Object.entries(answers)) {
    if (seen.has(key)) continue;
    if (key.startsWith("_")) continue;
    if (STRIP_FROM_PUBLIC_FUNNEL_ANSWERS.has(key)) continue;
    if (steps.some((s) => s.id === key)) continue;
    const values = answerValues(value);
    if (values.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value)) continue;
    rows.push({
      questionId: key,
      question: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      answerId: values.join(", "),
      answerLabel: values.join("; "),
    });
  }

  return rows;
}

export type PortalQuizResultSection = {
  categoryName?: string;
  priority?: string;
  clinicalIndications?: string[];
  medicareNotes?: string[];
};

export type PanelMedicareBreakdownRow = {
  biomarkerId?: string;
  name?: string;
  eligibility?: string;
  eligibilityLabel?: string;
};

export function extractPortalQuizResultSummary(result: unknown): {
  summary?: string;
  sections: PortalQuizResultSection[];
  suggestedPanel?: string;
  publicPanelTier?: string;
  panelMedicareBreakdown: PanelMedicareBreakdownRow[];
} {
  if (!result || typeof result !== "object") {
    return { sections: [], panelMedicareBreakdown: [] };
  }
  const r = result as Record<string, unknown>;
  const sections = Array.isArray(r.sections)
    ? (r.sections as PortalQuizResultSection[])
    : [];
  const panelMedicareBreakdown = Array.isArray(r.panelMedicareBreakdown)
    ? (r.panelMedicareBreakdown as PanelMedicareBreakdownRow[])
    : [];
  return {
    summary: typeof r.doctorSummary === "string" ? r.doctorSummary : undefined,
    sections,
    suggestedPanel: typeof r.suggestedPanel === "string" ? r.suggestedPanel : undefined,
    publicPanelTier:
      typeof r.publicPanelTier === "string" ? r.publicPanelTier : undefined,
    panelMedicareBreakdown,
  };
}

export type PortalQuizSubmissionLike = {
  id: string;
  programKey: string;
  submittedAt: string;
};

/** Group portal quiz rows by program, each list sorted newest first. */
export function groupPortalQuizSubmissionsByProgram<T extends PortalQuizSubmissionLike>(
  submissions: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const submission of submissions) {
    const list = grouped.get(submission.programKey) ?? [];
    list.push(submission);
    grouped.set(submission.programKey, list);
  }
  for (const [key, list] of grouped) {
    grouped.set(
      key,
      [...list].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
    );
  }
  return grouped;
}

const QUIZ_ASSESSMENT_TAB_ORDER = [
  "WEIGHT_MANAGEMENT",
  ...PORTAL_QUIZ_TAB_ORDER.filter((key) => key !== "WEIGHT_MANAGEMENT"),
] as const;

export function quizAssessmentProgramTabLabel(programKey: string): string {
  if (programKey === "WEIGHT_MANAGEMENT") return "Weight Management";
  return portalQuizTabLabel(programKey);
}

/** Ordered program keys that have quiz / assessment content for the member form. */
export function resolveQuizAssessmentProgramTabs(input: {
  portalSubmissions: PortalQuizSubmissionLike[];
  hasWeightManagementAssessment?: boolean;
  hasHairLegacyQuestionnaire?: boolean;
}): string[] {
  const keys = new Set<string>();
  if (input.hasWeightManagementAssessment) {
    keys.add("WEIGHT_MANAGEMENT");
  }
  for (const submission of input.portalSubmissions) {
    keys.add(submission.programKey);
  }
  if (input.hasHairLegacyQuestionnaire && !keys.has("HAIR_LOSS")) {
    keys.add("HAIR_LOSS");
  }
  return QUIZ_ASSESSMENT_TAB_ORDER.filter((key) => keys.has(key));
}

export function formatQuizCompletedDate(submittedAt: string): string {
  return new Date(submittedAt).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
