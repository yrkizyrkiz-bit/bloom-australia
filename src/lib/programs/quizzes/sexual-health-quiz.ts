/**
 * Resolve in-portal sexual health quiz helpers by program.
 */

import type { ProgramKey } from "@/lib/membership/keys";
import {
  consultationSummary as mensConsultationSummary,
  focusLabel as mensFocusLabel,
  getMensSexualHealthQuizSteps,
} from "@/lib/programs/quizzes/mens-sexual-health-quiz";
import {
  getWomensSexualHealthQuizSteps,
  womensConsultationSummary,
  womensFocusLabel,
} from "@/lib/programs/quizzes/womens-sexual-health-quiz";
import type { QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export function isSexualHealthProgram(programKey: ProgramKey): boolean {
  return programKey === "MENS_HEALTH_SEXUAL" || programKey === "WOMENS_HEALTH_SEXUAL";
}

export function getSexualHealthQuizSteps(
  programKey: ProgramKey,
  answers: Record<string, string>
): QuizStep[] | null {
  const focus = answers.treatmentFocus;
  if (programKey === "MENS_HEALTH_SEXUAL") {
    return getMensSexualHealthQuizSteps(focus);
  }
  if (programKey === "WOMENS_HEALTH_SEXUAL") {
    return getWomensSexualHealthQuizSteps(focus);
  }
  return null;
}

export function getSexualHealthFocusLabel(programKey: ProgramKey, focus?: string): string {
  if (programKey === "WOMENS_HEALTH_SEXUAL") return womensFocusLabel(focus);
  if (programKey === "MENS_HEALTH_SEXUAL") return mensFocusLabel(focus);
  return "Sexual Health";
}

export function getSexualHealthConsultationSummary(programKey: ProgramKey, focus?: string): string {
  if (programKey === "WOMENS_HEALTH_SEXUAL") return womensConsultationSummary(focus);
  if (programKey === "MENS_HEALTH_SEXUAL") return mensConsultationSummary(focus);
  return "";
}
