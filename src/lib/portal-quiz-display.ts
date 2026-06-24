import { PROGRAM_LABELS, SCOPE_LABELS, type ProgramKey, type ScopeKey } from "@/lib/membership/keys";
import { getBiomarkersQuizQuestions, parseBiomarkersAnswer } from "@/lib/programs/quizzes/biomarkers-intake-quiz";
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

export function extractPortalQuizResultSummary(result: unknown): {
  summary?: string;
  sections: PortalQuizResultSection[];
  suggestedPanel?: string;
} {
  if (!result || typeof result !== "object") {
    return { sections: [] };
  }
  const r = result as Record<string, unknown>;
  const sections = Array.isArray(r.sections)
    ? (r.sections as PortalQuizResultSection[])
    : [];
  return {
    summary: typeof r.doctorSummary === "string" ? r.doctorSummary : undefined,
    sections,
    suggestedPanel: typeof r.suggestedPanel === "string" ? r.suggestedPanel : undefined,
  };
}
