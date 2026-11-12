"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { calculateBmi, PRICING } from "@/lib/lp/weight-management";
import { trackLpWmFunnelProgress } from "@/lib/lp/weight-management-analytics";
import {
  lpWmProjectedTargetKg,
  parseLpWmHeightWeight,
  visibleLpWmQuizOptions,
  visibleLpWmQuizSteps,
  type LpWmQuizStep,
} from "@/lib/lp/weight-management-funnel";
import { LpWmProjectionGraph } from "./projection-graph";

type Props = {
  saving?: boolean;
  error?: string | null;
  initialAnswers?: Record<string, string>;
  onAnswersChange?: (answers: Record<string, string>) => void;
  onLeadCapture?: (answers: Record<string, string>) => Promise<void>;
  onDone: (answers: Record<string, string>) => void;
};

export function LpWmQuizStep({
  saving = false,
  error = null,
  initialAnswers = {},
  onAnswersChange,
  onLeadCapture,
  onDone,
}: Props) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [draft, setDraft] = useState(initialAnswers.firstName ?? "");
  const [height, setHeight] = useState(initialAnswers.height ?? "");
  const [weight, setWeight] = useState(initialAnswers.weight ?? "");
  const [graphRevealed, setGraphRevealed] = useState(Boolean(initialAnswers.email));
  const [capturingLead, setCapturingLead] = useState(false);

  const steps = useMemo(() => visibleLpWmQuizSteps(answers), [answers]);
  const question = steps[Math.min(quizIndex, Math.max(steps.length - 1, 0))] as
    | LpWmQuizStep
    | undefined;
  const measured = parseLpWmHeightWeight({ ...answers, height, weight });
  const bmi = calculateBmi(measured.height, measured.weight);
  const busy = saving || capturingLead;

  useEffect(() => {
    if (!question) return;
    const gatedGraph = question.kind === "graph" && !graphRevealed;
    trackLpWmFunnelProgress({
      stage: "quiz",
      questionId: gatedGraph ? "projection_email" : question.id,
      questionIndex: quizIndex,
      questionCount: steps.length,
      questionPrompt: gatedGraph ? "Let's see what goal we can aim for" : question.prompt,
    });
  }, [graphRevealed, question, quizIndex, steps.length]);

  useEffect(() => {
    if (!question) return;
    if (question.kind === "text") setDraft(answers[question.id] ?? "");
  }, [answers, question]);

  if (!question) return null;

  const commitAnswers = (nextAnswers: Record<string, string>) => {
    setAnswers(nextAnswers);
    onAnswersChange?.(nextAnswers);
    return nextAnswers;
  };

  const goNext = (nextAnswers: Record<string, string>) => {
    if (busy) return;
    const committed = commitAnswers(nextAnswers);
    const nextSteps = visibleLpWmQuizSteps(committed);
    const nextIndex = quizIndex + 1;
    if (nextIndex >= nextSteps.length) {
      onDone(committed);
      return;
    }
    const nextQuestion = nextSteps[nextIndex];
    if (nextQuestion?.kind === "text") setDraft(committed[nextQuestion.id] ?? "");
    if (nextQuestion?.kind === "graph") setGraphRevealed(Boolean(committed.email));
    setQuizIndex(nextIndex);
  };

  const selectAnswer = (optionId: string) => {
    goNext({ ...answers, [question.id]: optionId });
  };

  const submitText = () => {
    const value = draft.trim();
    if (!value) return;
    goNext({ ...answers, [question.id]: value });
  };

  const submitBmi = () => {
    if (!measured.bmi) return;
    goNext({
      ...answers,
      height: String(Math.round(measured.height)),
      weight: String(Math.round(measured.weight * 10) / 10),
      bmi: String(measured.bmi),
    });
  };

  const unlockGraph = async (email: string) => {
    if (busy) return;
    const next = { ...answers, email };
    commitAnswers(next);
    if (onLeadCapture) {
      setCapturingLead(true);
      try {
        await onLeadCapture(next);
      } catch {
        return;
      } finally {
        setCapturingLead(false);
      }
    }
    setGraphRevealed(true);
  };

  const fieldReady =
    question.kind === "text"
      ? draft.trim().length > 0
      : question.kind === "bmi"
        ? Boolean(bmi)
        : false;

  return (
    <div className="space-y-4">
      {quizIndex === 0 && (
        <div className="mb-2">
          <h1 className="font-serif text-[2.15rem] font-normal leading-[1.15] tracking-tight text-black sm:text-5xl">
            A few questions for your doctor
          </h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-neutral-500">
            We&apos;ll save your details, show you a projected goal, then you pick a time, add your
            mobile and pay ${PRICING.assessmentFee}.
          </p>
        </div>
      )}
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`h-1.5 flex-1 rounded-full ${i <= quizIndex ? "bg-[#5c7a52]" : "bg-gray-200"}`}
          />
        ))}
      </div>
      {question.kind !== "graph" && (
        <p className="text-xs text-gray-400">
          Question {quizIndex + 1} of {steps.length}
        </p>
      )}

      {question.kind !== "graph" && (
        <>
          <h3 className="text-lg font-semibold text-gray-900">{question.prompt}</h3>
          {question.subtitle && <p className="text-sm text-gray-500">{question.subtitle}</p>}
        </>
      )}

      {question.kind === "graph" ? (
        <LpWmProjectionGraph
          currentWeight={measured.weight}
          targetWeight={lpWmProjectedTargetKg(measured.weight, answers.weightLossGoal ?? "unsure")}
          firstName={answers.firstName}
          email={answers.email}
          revealed={graphRevealed}
          saving={busy}
          error={error}
          onUnlock={unlockGraph}
          onContinue={() => goNext({ ...answers, projection: "viewed" })}
        />
      ) : question.kind === "choice" ? (
        <div className="space-y-2.5">
          {visibleLpWmQuizOptions(question, answers).map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
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
      ) : question.kind === "bmi" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Height (cm)</label>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-xl border border-black/15 px-4 py-3.5 text-base outline-none transition-colors focus:border-black"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Weight (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                min={30}
                max={350}
                step="0.1"
                placeholder="85"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl border border-black/15 px-4 py-3.5 text-base outline-none transition-colors focus:border-black"
              />
            </div>
          </div>
          {bmi ? (
            <p className="text-sm text-neutral-500">
              Your BMI is <span className="font-medium text-black">{bmi}</span>
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || !fieldReady}
            onClick={submitBmi}
            className="flex w-full items-center justify-center rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            autoComplete="given-name"
            placeholder={question.placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && fieldReady) {
                e.preventDefault();
                submitText();
              }
            }}
            className="w-full rounded-xl border border-black/15 px-4 py-3.5 text-base outline-none transition-colors focus:border-black"
          />
          <button
            type="button"
            disabled={busy || !fieldReady}
            onClick={submitText}
            className="flex w-full items-center justify-center rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {quizIndex > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const nextIndex = Math.max(0, quizIndex - 1);
            const prev = steps[nextIndex];
            if (prev?.kind === "text") setDraft(answers[prev.id] ?? "");
            if (prev?.kind === "graph") setGraphRevealed(Boolean(answers.email));
            setQuizIndex(nextIndex);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}

      {busy && question.kind !== "graph" && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving your answers…
        </p>
      )}
      {error && question.kind !== "graph" && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
