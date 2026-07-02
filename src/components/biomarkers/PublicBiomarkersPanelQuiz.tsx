"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  isBiomarkersQuestionAnswered,
  parseBiomarkersAnswer,
  toggleBiomarkersMultiAnswer,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { getPublicBiomarkersPanelQuizQuestions } from "@/lib/biomarkers/public-biomarkers-panel-quiz";

type Props = {
  tier: BiomarkerSubscriptionTier;
  profileGender?: string | null;
  onComplete: (answers: Record<string, string>) => void;
  onBack?: () => void;
};

export function PublicBiomarkersPanelQuiz({
  tier,
  profileGender,
  onComplete,
  onBack,
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(
    () => getPublicBiomarkersPanelQuizQuestions(tier, profileGender, answers),
    [tier, profileGender, answers]
  );

  const current = questions[step];
  const isLast = step >= questions.length - 1;
  const progress = questions.length > 0 ? ((step + 1) / questions.length) * 100 : 0;
  const canContinue = current
    ? isBiomarkersQuestionAnswered(current, answers[current.id])
    : false;

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (isLast) {
      setSubmitting(true);
      Promise.resolve(onComplete(answers)).catch(() => {
        setSubmitting(false);
      });
      return;
    }
    setStep((s) => s + 1);
  };

  useEffect(() => {
    optionsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (!current) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#5c7a52]" />
      </div>
    );
  }

  const selectedMulti = current.allowMultiple
    ? parseBiomarkersAnswer(answers[current.id])
    : [];

  return (
    <div className="flex flex-col min-h-[min(640px,calc(100dvh-14rem))] max-h-[calc(100dvh-14rem)] rounded-2xl border border-[#e6ebe3] bg-white p-4 sm:p-6">
      <div className="shrink-0 mb-4 space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[#7e9a72]">
            <span className="font-medium uppercase tracking-wide text-[#5c7a52]">
              {current.sectionTitle}
            </span>
            <span>
              Question {step + 1} of {questions.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e6ebe3]">
            <div
              className="h-full rounded-full bg-[#5c7a52] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2c3628] leading-snug">
            {current.prompt}
          </h2>
          {current.subtitle && (
            <p className="mt-1.5 text-sm text-[#5c7a52]">{current.subtitle}</p>
          )}
        </div>
      </div>

      <div
        ref={optionsRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5 -mr-0.5"
      >
        {current.options.map((option) => {
          const isSelected = current.allowMultiple
            ? selectedMulti.includes(option.id)
            : answers[current.id] === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (current.allowMultiple) {
                  setAnswer(
                    current.id,
                    toggleBiomarkersMultiAnswer(answers[current.id], option.id)
                  );
                } else {
                  setAnswer(current.id, option.id);
                }
              }}
              className={`w-full rounded-xl border-2 p-3 sm:p-3.5 text-left transition-all ${
                isSelected
                  ? "border-[#5c7a52] bg-[#5c7a52]/5 ring-2 ring-[#5c7a52]/20"
                  : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-[#2c3628] sm:text-base">
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[#7e9a72] sm:text-sm">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex shrink-0 justify-between gap-3 border-t border-[#e6ebe3] bg-white pt-4">
        <button
          type="button"
          onClick={() => (step === 0 ? onBack?.() : setStep((s) => s - 1))}
          className="btn-secondary flex items-center gap-2"
          disabled={submitting}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue || submitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isLast ? (
            <>
              Complete questionnaire
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
