/**
 * In-portal men's sexual health quiz, branches on ED / PE / Both,
 * then recommends a doctor consultation before any prescribed program.
 */

import {
  buildConsultationSummary,
  SEXUAL_HEALTH_QUIZ_TAIL,
  type QuizStep,
} from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export type SexualHealthFocus = "ed" | "pe" | "both";

export type { QuizOption, QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export const TREATMENT_FOCUS_STEP: QuizStep = {
  id: "treatmentFocus",
  prompt: "What are you considering treatment for?",
  subtitle: "This helps us ask the right clinical questions. Everything is confidential.",
  options: [
    {
      id: "ed",
      label: "Erectile Dysfunction (ED)",
      description: "Difficulty getting or keeping an erection",
    },
    {
      id: "pe",
      label: "Premature Ejaculation (PE)",
      description: "Ejaculating sooner than you or your partner would like",
    },
    {
      id: "both",
      label: "Both ED and PE",
      description: "You're experiencing both concerns",
    },
  ],
};

const ED_STEPS: QuizStep[] = [
  {
    id: "edDuration",
    prompt: "How long have you been experiencing ED symptoms?",
    options: [
      { id: "less-3-months", label: "Less than 3 months" },
      { id: "3-6-months", label: "3 to 6 months" },
      { id: "6-12-months", label: "6 to 12 months" },
      { id: "1-2-years", label: "1 to 2 years" },
      { id: "more-2-years", label: "More than 2 years" },
    ],
  },
  {
    id: "edSeverity",
    prompt: "How would you describe the severity?",
    options: [
      { id: "mild", label: "Mild", description: "Occasional difficulty, mostly manageable" },
      { id: "moderate", label: "Moderate", description: "Regular difficulty affecting intimacy" },
      { id: "severe", label: "Severe", description: "Persistent difficulty most or all of the time" },
    ],
  },
  {
    id: "edMainIssue",
    prompt: "What best describes your main difficulty?",
    options: [
      { id: "getting", label: "Difficulty getting an erection" },
      { id: "maintaining", label: "Difficulty maintaining an erection" },
      { id: "both", label: "Both getting and maintaining" },
    ],
  },
  {
    id: "takingNitrates",
    prompt: "Are you currently taking nitrates for chest pain or heart conditions?",
    subtitle: "Important for clinical safety, e.g. GTN spray, isosorbide, or similar.",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
];

const PE_STEPS: QuizStep[] = [
  {
    id: "peDuration",
    prompt: "How long have you been experiencing PE symptoms?",
    options: [
      { id: "less-3-months", label: "Less than 3 months" },
      { id: "3-6-months", label: "3 to 6 months" },
      { id: "6-12-months", label: "6 to 12 months" },
      { id: "more-1-year", label: "More than 1 year" },
      { id: "lifelong", label: "As long as I can remember" },
    ],
  },
  {
    id: "peFrequency",
    prompt: "How often does this happen?",
    options: [
      { id: "always", label: "Nearly every time" },
      { id: "often", label: "Most of the time" },
      { id: "sometimes", label: "Sometimes" },
    ],
  },
  {
    id: "peTiming",
    prompt: "When does ejaculation typically occur?",
    options: [
      { id: "before-entry", label: "Before or shortly after penetration" },
      { id: "within-1-min", label: "Within about 1 minute" },
      { id: "before-desired", label: "Sooner than I or my partner would like" },
    ],
  },
  {
    id: "peDistress",
    prompt: "How much is this affecting you?",
    options: [
      { id: "mild", label: "Mild frustration" },
      { id: "moderate", label: "Moderately affecting confidence or intimacy" },
      { id: "severe", label: "Significantly affecting relationships or wellbeing" },
    ],
  },
];

const BOTH_STEPS: QuizStep[] = [
  {
    id: "edDuration",
    prompt: "How long have you noticed ED symptoms?",
    options: ED_STEPS[0].options,
  },
  {
    id: "edMainIssue",
    prompt: "What best describes your erection difficulty?",
    options: ED_STEPS[2].options,
  },
  {
    id: "peDuration",
    prompt: "How long have you noticed PE symptoms?",
    options: PE_STEPS[0].options,
  },
  {
    id: "peFrequency",
    prompt: "How often does premature ejaculation occur?",
    options: PE_STEPS[1].options,
  },
  {
    id: "takingNitrates",
    prompt: "Are you currently taking nitrates for chest pain or heart conditions?",
    subtitle: "Important for clinical safety if ED treatment may be considered.",
    options: ED_STEPS[3].options,
  },
];

export function getMensSexualHealthQuizSteps(focus?: SexualHealthFocus | string): QuizStep[] {
  const steps: QuizStep[] = [TREATMENT_FOCUS_STEP];
  if (!focus) return steps;

  switch (focus) {
    case "ed":
      steps.push(...ED_STEPS, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
    case "pe":
      steps.push(...PE_STEPS, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
    case "both":
      steps.push(...BOTH_STEPS, ...SEXUAL_HEALTH_QUIZ_TAIL);
      break;
  }
  return steps;
}

export function focusLabel(focus?: string): string {
  switch (focus) {
    case "ed":
      return "Erectile Dysfunction";
    case "pe":
      return "Premature Ejaculation";
    case "both":
      return "ED and PE";
    default:
      return "Sexual Health";
  }
}

export function consultationSummary(focus?: string): string {
  return buildConsultationSummary(focusLabel(focus));
}
