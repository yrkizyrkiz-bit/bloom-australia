/** Shared types and tail steps for in-portal sexual health quizzes. */

export type QuizOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuizStep = {
  id: string;
  prompt: string;
  subtitle?: string;
  options: QuizOption[];
};

export const SEXUAL_HEALTH_QUIZ_TAIL: QuizStep[] = [
  {
    id: "previousTreatment",
    prompt: "Have you tried treatment for this before?",
    options: [
      { id: "none", label: "No, this is my first time" },
      { id: "otc", label: "Over-the-counter or online products" },
      { id: "prescription", label: "Prescription medication or hormone therapy in the past" },
      { id: "current", label: "I'm currently on something" },
    ],
  },
  {
    id: "startTiming",
    prompt: "How soon would you like to speak with a doctor?",
    options: [
      { id: "asap", label: "As soon as possible" },
      { id: "this-week", label: "Within the next week" },
      { id: "exploring", label: "I'm exploring options for now" },
    ],
  },
];

export function buildConsultationSummary(focusArea: string): string {
  return `Based on your answers about ${focusArea}, the next step is a confidential doctor consultation. An AHPRA-registered doctor will review your history, confirm what's clinically appropriate, and only then discuss a prescribed treatment program if suitable.`;
}
