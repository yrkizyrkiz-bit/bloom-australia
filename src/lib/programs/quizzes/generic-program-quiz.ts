/**
 * Generic in-portal program quiz steps (non–sexual-health programs).
 */

import type { QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export const GENERIC_PROGRAM_QUIZ: QuizStep[] = [
  {
    id: "goal",
    prompt: "What's your main goal right now?",
    options: [
      { id: "feel-better", label: "Feel better day to day" },
      { id: "specific", label: "Address a specific concern" },
      { id: "prevention", label: "Long-term prevention" },
    ],
  },
  {
    id: "history",
    prompt: "Have you tried treatment for this before?",
    options: [
      { id: "first-time", label: "No, this is my first time" },
      { id: "past", label: "Yes, in the past" },
      { id: "current", label: "Currently on something" },
    ],
  },
  {
    id: "timing",
    prompt: "How soon would you like to start?",
    options: [
      { id: "asap", label: "As soon as possible" },
      { id: "month", label: "Within a month" },
      { id: "exploring", label: "Just exploring" },
    ],
  },
];
