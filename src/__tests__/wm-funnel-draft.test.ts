import { describe, expect, it } from "vitest";
import {
  WM_FUNNEL_PAYMENT_STEP,
  WM_FUNNEL_RESUME_MIN_STEP,
  draftReachedPayment,
  quizAnswersFromDraft,
  resumeWeightManagementStep,
} from "@/lib/funnel/wm-funnel-draft";

describe("resumeWeightManagementStep", () => {
  it("starts after the email gate when nothing was saved", () => {
    expect(resumeWeightManagementStep(undefined, false)).toBe(WM_FUNNEL_RESUME_MIN_STEP);
    expect(resumeWeightManagementStep(3, false)).toBe(WM_FUNNEL_RESUME_MIN_STEP);
  });

  it("restores the last quiz step", () => {
    expect(resumeWeightManagementStep(12, false)).toBe(12);
  });

  it("keeps a failed or abandoned payment on the payment step", () => {
    expect(resumeWeightManagementStep(20, true)).toBe(WM_FUNNEL_PAYMENT_STEP);
    expect(resumeWeightManagementStep(21, false)).toBe(WM_FUNNEL_PAYMENT_STEP);
    expect(resumeWeightManagementStep(22, true)).toBe(WM_FUNNEL_PAYMENT_STEP);
  });
});

describe("quizAnswersFromDraft", () => {
  it("returns quiz answers and drops server metadata", () => {
    expect(
      quizAnswersFromDraft({
        firstName: "Alex",
        currentWeight: "90",
        _draftStep: 12,
        _reachedPayment: false,
        journeyStatus: "LEAD",
        userId: "user_1",
        password: "nope",
      })
    ).toEqual({
      firstName: "Alex",
      currentWeight: "90",
    });
  });

  it("reads the payment flag", () => {
    expect(draftReachedPayment({ _reachedPayment: true })).toBe(true);
    expect(draftReachedPayment({ _reachedPayment: false })).toBe(false);
    expect(draftReachedPayment(null)).toBe(false);
  });
});
