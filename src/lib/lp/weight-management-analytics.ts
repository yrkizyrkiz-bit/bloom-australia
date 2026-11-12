import { trackGaEvent, trackGaPageView } from "@/lib/analytics/ga";
import { LP_FUNNEL_SOURCE } from "@/lib/lp/weight-management";

export type LpWmFunnelStage = "quiz" | "qualify" | "book" | "pay" | "complete";

export function trackLpWmFunnelProgress(input: {
  stage: LpWmFunnelStage;
  questionId?: string;
  questionIndex?: number;
  questionCount?: number;
  questionPrompt?: string;
}): void {
  const funnelStep =
    input.stage === "quiz" && input.questionId
      ? `quiz_${input.questionId}`
      : input.stage === "qualify"
        ? "quiz_complete"
        : input.stage === "book"
          ? "book_appointment"
          : input.stage === "pay"
            ? "pay_49"
            : "complete";

  const quizOffset = input.questionIndex ?? 0;
  const quizCount = input.questionCount ?? 0;
  const funnelStepNumber =
    input.stage === "quiz"
      ? quizOffset + 1
      : input.stage === "qualify"
        ? quizCount + 1
        : input.stage === "book"
          ? quizCount + 2
          : input.stage === "pay"
            ? quizCount + 3
            : quizCount + 4;

  trackGaEvent("lp_wm_funnel_progress", {
    funnel_name: LP_FUNNEL_SOURCE,
    funnel_stage: input.stage,
    funnel_step: funnelStep,
    funnel_step_number: funnelStepNumber,
    question_id: input.questionId,
    question_name: input.questionPrompt,
    question_count: quizCount || undefined,
  });

  if (typeof window === "undefined") return;
  const path =
    input.stage === "quiz" && input.questionId
      ? `/lp/weight-management/start/quiz/${input.questionId}`
      : `/lp/weight-management/start/${input.stage}`;
  const title =
    input.stage === "quiz" && input.questionPrompt
      ? `Weight management · ${input.questionPrompt}`
      : `Weight management · ${funnelStep}`;
  trackGaPageView(`${window.location.origin}${path}${window.location.search}`, title);
}
