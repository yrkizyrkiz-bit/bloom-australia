/**
 * In-portal women's sexual health quiz — branches on libido / pain / both,
 * then recommends a doctor consultation before any prescribed program.
 */

import {
  buildConsultationSummary,
  SEXUAL_HEALTH_QUIZ_TAIL,
  type QuizStep,
} from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export type WomensSexualHealthFocus = "libido" | "pain" | "both";

export type { QuizOption, QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export const WOMENS_TREATMENT_FOCUS_STEP: QuizStep = {
  id: "treatmentFocus",
  prompt: "What are you considering treatment for?",
  subtitle: "This helps us ask the right clinical questions. Everything is confidential.",
  options: [
    {
      id: "libido",
      label: "Low libido or reduced desire",
      description: "Less interest in sex or difficulty feeling in the mood",
    },
    {
      id: "pain",
      label: "Pain or discomfort during intimacy",
      description: "Dryness, burning, or pain before, during, or after sex",
    },
    {
      id: "both",
      label: "Both libido and pain concerns",
      description: "You're experiencing both reduced desire and discomfort",
    },
  ],
};

const LIFE_STAGE_STEP: QuizStep = {
  id: "lifeStage",
  prompt: "Which best describes your stage of life?",
  subtitle: "Hormonal context helps your doctor assess what may be contributing.",
  options: [
    { id: "premenopause", label: "Regular periods", description: "Still menstruating regularly" },
    { id: "perimenopause", label: "Perimenopause", description: "Cycle changes, symptoms shifting" },
    { id: "menopause", label: "Menopause", description: "Periods have stopped" },
    { id: "postpartum", label: "Postpartum or breastfeeding", description: "Within 12 months of birth or currently breastfeeding" },
    { id: "unsure", label: "I'm not sure" },
  ],
};

const LIBIDO_STEPS: QuizStep[] = [
  {
    id: "libidoDuration",
    prompt: "How long have you noticed changes in libido or desire?",
    options: [
      { id: "less-3-months", label: "Less than 3 months" },
      { id: "3-6-months", label: "3 to 6 months" },
      { id: "6-12-months", label: "6 to 12 months" },
      { id: "more-1-year", label: "More than 1 year" },
    ],
  },
  {
    id: "libidoSeverity",
    prompt: "How much is this affecting you?",
    options: [
      { id: "mild", label: "Mild", description: "Noticeable but mostly manageable" },
      { id: "moderate", label: "Moderate", description: "Regularly affecting intimacy or confidence" },
      { id: "severe", label: "Severe", description: "Significantly affecting relationships or wellbeing" },
    ],
  },
  {
    id: "libidoMainIssue",
    prompt: "What best describes your main experience?",
    options: [
      { id: "low-interest", label: "Low interest or little desire for sex" },
      { id: "arousal", label: "Interest is there, but difficulty becoming aroused" },
      { id: "both-aspects", label: "Both low interest and difficulty with arousal" },
      { id: "stress-linked", label: "Mostly linked to stress, mood, or fatigue" },
    ],
  },
];

const PAIN_STEPS: QuizStep[] = [
  {
    id: "painDuration",
    prompt: "How long have you experienced pain or discomfort during intimacy?",
    options: [
      { id: "less-3-months", label: "Less than 3 months" },
      { id: "3-6-months", label: "3 to 6 months" },
      { id: "6-12-months", label: "6 to 12 months" },
      { id: "more-1-year", label: "More than 1 year" },
    ],
  },
  {
    id: "painTiming",
    prompt: "When do you typically experience discomfort?",
    options: [
      { id: "before", label: "Before or at the start of intimacy" },
      { id: "during", label: "During intimacy" },
      { id: "after", label: "After intimacy" },
      { id: "throughout", label: "Throughout or at multiple points" },
    ],
  },
  {
    id: "painType",
    prompt: "What type of discomfort is most prominent?",
    options: [
      { id: "dryness", label: "Dryness or lack of lubrication" },
      { id: "burning", label: "Burning or stinging" },
      { id: "deep", label: "Deep or pelvic pain" },
      { id: "general", label: "General discomfort or tenderness" },
    ],
  },
  {
    id: "painFrequency",
    prompt: "How often does this happen?",
    options: [
      { id: "always", label: "Nearly every time" },
      { id: "often", label: "Most of the time" },
      { id: "sometimes", label: "Sometimes" },
    ],
  },
];

const BOTH_STEPS: QuizStep[] = [
  {
    id: "libidoDuration",
    prompt: "How long have you noticed changes in libido or desire?",
    options: LIBIDO_STEPS[0].options,
  },
  {
    id: "libidoMainIssue",
    prompt: "What best describes your libido or desire concern?",
    options: LIBIDO_STEPS[2].options,
  },
  {
    id: "painDuration",
    prompt: "How long have you experienced pain or discomfort?",
    options: PAIN_STEPS[0].options,
  },
  {
    id: "painType",
    prompt: "What type of discomfort is most prominent?",
    options: PAIN_STEPS[2].options,
  },
];

export function getWomensSexualHealthQuizSteps(focus?: WomensSexualHealthFocus | string): QuizStep[] {
  const steps: QuizStep[] = [WOMENS_TREATMENT_FOCUS_STEP];
  if (!focus) return steps;

  switch (focus) {
    case "libido":
      steps.push(...LIBIDO_STEPS, LIFE_STAGE_STEP, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
    case "pain":
      steps.push(...PAIN_STEPS, LIFE_STAGE_STEP, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
    case "both":
      steps.push(...BOTH_STEPS, LIFE_STAGE_STEP, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
  }
  return steps;
}

export function womensFocusLabel(focus?: string): string {
  switch (focus) {
    case "libido":
      return "Low libido and reduced desire";
    case "pain":
      return "Pain or discomfort during intimacy";
    case "both":
      return "Libido and pain concerns";
    default:
      return "Sexual Health";
  }
}

export function womensConsultationSummary(focus?: string): string {
  return buildConsultationSummary(womensFocusLabel(focus));
}
