import {
  getMensSexualHealthQuizSteps,
  type QuizStep,
} from "@/lib/programs/quizzes/mens-sexual-health-quiz";

export function isSexualHealthConcern(concern: string): boolean {
  const c = concern.toLowerCase();
  return (
    c === "sexual-health" ||
    c === "erectile-dysfunction" ||
    c === "premature-ejaculation"
  );
}

export function normalizeSexualHealthConcern(concern: string): string {
  return isSexualHealthConcern(concern) ? "sexual-health" : concern;
}

const QUIZ_START = 5;

export function getSexualHealthPublicStepBounds(quizStepCount: number) {
  const contact = QUIZ_START + quizStepCount;
  return {
    intro: 0,
    firstName: 1,
    email: 2,
    dob: 3,
    quizTransition: 4,
    quizStart: QUIZ_START,
    contact,
    consent: contact + 1,
    checkout: contact + 2,
    thankYou: contact + 3,
    total: contact + 3,
  };
}

export function getSexualHealthPublicQuizSteps(
  answers: Record<string, string>
): QuizStep[] {
  return getMensSexualHealthQuizSteps(answers.treatmentFocus);
}

export function sexualHealthQuizQuestionAtStep(
  step: number,
  answers: Record<string, string>
): QuizStep | null {
  const bounds = getSexualHealthPublicStepBounds(
    getSexualHealthPublicQuizSteps(answers).length
  );
  if (step < bounds.quizStart || step >= bounds.contact) return null;
  return getSexualHealthPublicQuizSteps(answers)[step - bounds.quizStart] ?? null;
}

export function isSexualHealthQuizStepComplete(
  step: number,
  answers: Record<string, string>
): boolean {
  const question = sexualHealthQuizQuestionAtStep(step, answers);
  if (!question) return false;
  return Boolean(answers[question.id]);
}
