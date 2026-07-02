import { PROGRAM_LABELS, SCOPE_LABELS, type ProgramKey, type ScopeKey } from "@/lib/membership/keys";
import { getBiomarkersQuizQuestions, parseBiomarkersAnswer } from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { getPublicBiomarkersPanelQuizQuestions } from "@/lib/biomarkers/public-biomarkers-panel-quiz";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { getOrganCareQuizQuestions } from "@/lib/programs/quizzes/organ-care-intake-quiz";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import { getSexualHealthQuizSteps, isSexualHealthProgram } from "@/lib/programs/quizzes/sexual-health-quiz";
import { GENERIC_PROGRAM_QUIZ } from "@/lib/programs/quizzes/generic-program-quiz";

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
  if (programKey in PROGRAM_LABELS) {
    return PROGRAM_LABELS[programKey as ProgramKey];
  }
  if (programKey in SCOPE_LABELS) {
    return SCOPE_LABELS[programKey as ScopeKey];
  }
  return programKey.replace(/_/g, " ");
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
  if (isSexualHealthProgram(pk)) {
    return getSexualHealthQuizSteps(pk, {}) ?? [];
  }
  const funnel = getPublicFunnelQuizSteps(pk, gender);
  if (funnel) return funnel;
  return GENERIC_PROGRAM_QUIZ;
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
  const steps = resolveQuizSteps(programKey, gender, answers);
  const rows: PortalQuizDisplayRow[] = [];

  for (const step of steps) {
    const raw = answers[step.id];
    if (raw == null || raw === "") continue;

    if ("allowMultiple" in step && step.allowMultiple) {
      const labels = parseBiomarkersAnswer(String(raw)).map(
        (id) => step.options.find((o) => o.id === id)?.label ?? id
      );
      rows.push({
        questionId: step.id,
        question: step.prompt,
        answerId: String(raw),
        answerLabel: labels.join("; "),
      });
      continue;
    }

    const answerId = String(raw);
    const option = step.options.find((o) => o.id === answerId);
    rows.push({
      questionId: step.id,
      question: step.prompt,
      answerId,
      answerLabel: option?.label ?? answerId,
    });
  }

  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith("_")) continue;
    if (steps.some((s) => s.id === key)) continue;
    if (value == null || value === "") continue;
    rows.push({
      questionId: key,
      question: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      answerId: String(value),
      answerLabel: String(value),
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

/** Group portal quiz rows by program — each list sorted newest first. */
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
