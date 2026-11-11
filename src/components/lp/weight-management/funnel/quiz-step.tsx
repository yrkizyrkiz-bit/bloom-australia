"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { LP_WM_QUIZ_STEPS } from "@/lib/lp/weight-management-funnel";

type Props = {
  saving: boolean;
  error: string | null;
  onDone: (answers: Record<string, string>) => void;
};

export function LpWmQuizStep({ saving, error, onDone }: Props) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const question = LP_WM_QUIZ_STEPS[quizIndex];

  if (!question) return null;

  const selectAnswer = (optionId: string) => {
    if (saving) return;
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    const nextIndex = quizIndex + 1;
    if (nextIndex >= LP_WM_QUIZ_STEPS.length) {
      onDone(next);
      return;
    }
    setQuizIndex(nextIndex);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {LP_WM_QUIZ_STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`h-1.5 flex-1 rounded-full ${i <= quizIndex ? "bg-[#5c7a52]" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Question {quizIndex + 1} of {LP_WM_QUIZ_STEPS.length}
      </p>

      <h3 className="text-lg font-semibold text-gray-900">{question.prompt}</h3>
      {question.subtitle && <p className="text-sm text-gray-500">{question.subtitle}</p>}

      <div className="space-y-2.5">
        {question.options.map((option) => {
          const selected = answers[question.id] === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={saving}
              onClick={() => selectAnswer(option.id)}
              className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                selected
                  ? "border-[#5c7a52] bg-[#f4f7f2]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-sm text-gray-900">{option.label}</span>
            </button>
          );
        })}
      </div>

      {saving && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving your answers…
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
