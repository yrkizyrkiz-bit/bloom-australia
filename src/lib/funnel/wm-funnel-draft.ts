/** First screen after the email gate. */
export const WM_FUNNEL_RESUME_MIN_STEP = 7;
/** Membership payment. Unpaid returns always land here instead of later screens. */
export const WM_FUNNEL_PAYMENT_STEP = 20;

const DRAFT_META_KEYS = new Set([
  "programType",
  "userId",
  "journeyStatus",
  "submittedAt",
  "completedAt",
  "membershipPaid",
  "biomarkersPaid",
  "hasContraindications",
  "bmi",
  "resumeVerificationToken",
  "_draftStep",
  "_reachedPayment",
]);

/**
 * Unpaid visitors resume at the last quiz step, or on payment if they got that far.
 * Booking and password screens stay behind a successful payment.
 */
export function resumeWeightManagementStep(
  draftStep: unknown,
  reachedPayment: unknown
): number {
  if (reachedPayment === true) return WM_FUNNEL_PAYMENT_STEP;
  const step = typeof draftStep === "number" ? draftStep : Number(draftStep);
  if (!Number.isFinite(step)) return WM_FUNNEL_RESUME_MIN_STEP;
  const rounded = Math.floor(step);
  if (rounded >= WM_FUNNEL_PAYMENT_STEP) return WM_FUNNEL_PAYMENT_STEP;
  if (rounded < WM_FUNNEL_RESUME_MIN_STEP) return WM_FUNNEL_RESUME_MIN_STEP;
  return rounded;
}

/** Quiz fields safe to store and restore. Drops server metadata. */
export function quizAnswersFromDraft(
  quiz: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!quiz) return {};
  const answers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(quiz)) {
    if (DRAFT_META_KEYS.has(key) || key.startsWith("_")) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && /password|token|secret/i.test(key)) continue;
    answers[key] = value;
  }
  return answers;
}

export function draftReachedPayment(quiz: Record<string, unknown> | null | undefined): boolean {
  return quiz?._reachedPayment === true;
}
