import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ASSESSMENT_PATH,
  buildAssessmentUrl,
  buildFunnelUrl,
  calculateBmi,
  FUNNEL_PATH,
  isHealthCheckOfferActive,
  isLikelyEligibleBmi,
  LP_FUNNEL_SOURCE,
  LP_PATH,
  PRICING,
} from "@/lib/lp/weight-management";
import {
  LP_WM_STAFF_INBOX,
  lpWmStaffNotificationEmail,
  lpWmWelcomeEmail,
} from "@/lib/lp/weight-management-emails";
import {
  LP_WM_ASSESSMENT_CENTS,
  LP_WM_FUNNEL_STAGE_LABELS,
  LP_WM_QUIZ_STEPS,
  applyLpWmClosedWeekdayBookings,
  collectLpWmUtm,
  isLpWmClosedWeekday,
  isLpWmHiddenWeekday,
  LP_WM_CALENDAR_HORIZON_DAYS,
  lpWmNeedsExtraReview,
  lpWmPaymentGate,
  lpWmProjectedTargetKg,
  quizAnswerLabels,
  validateLpWmContact,
  validateLpWmIdentity,
  validateLpWmQuizAnswers,
  validateLpWmSlot,
  visibleLpWmQuizOptions,
  visibleLpWmQuizSteps,
} from "@/lib/lp/weight-management-funnel";

describe("weight-management campaign landing", () => {
  it("uses a compressed male care photo on What's included slide 05", () => {
    const images = readFileSync(
      join(process.cwd(), "src/lib/lp/weight-management.ts"),
      "utf8"
    );
    const included = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/whats-included.tsx"),
      "utf8"
    );
    expect(images).not.toContain("doctorScreensMale");
    expect(images).toContain("/images/lp/weight-management/ongoing-care-male.webp");
    expect(images).toContain("/images/lp/weight-management/welcome-female.webp");
    expect(images).toContain("/images/lp/weight-management/welcome-male.webp");
    expect(included).toContain("lpImages.ongoingCareMale");
    expect(included).toContain('slide.number === "05" && isMale');
    expect(included).not.toContain('slide.number === "04" && isMale');
  });

  it("charges $49 for the clinical assessment with a Sanative doctor", () => {
    expect(PRICING.assessmentFee).toBe(49);
  });

  it("defaults the pricing slider to the monthly plan", () => {
    const slider = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/pricing-slider.tsx"),
      "utf8"
    );
    expect(slider).toContain("defaultPlanIndex = 0");
    expect(slider).not.toContain("defaultPlanIndex = 3");
  });

  it("values the complimentary 85+ biomarker health check at $365", () => {
    expect(PRICING.healthCheckValue).toBe(365);
    expect(PRICING.biomarkerCount).toBe(85);
  });

  it("continues care at $360 per quarter", () => {
    expect(PRICING.carePerQuarter).toBe(360);
  });

  it("offers the free health check to members who sign up before the end of 2026 (Sydney time)", () => {
    expect(isHealthCheckOfferActive(new Date("2026-12-31T23:59:00+11:00"))).toBe(true);
    expect(isHealthCheckOfferActive(new Date("2027-01-01T00:00:00+11:00"))).toBe(false);
  });

  it("passes ad click params through to the assessment and tags the LP source", () => {
    const url = new URL(buildAssessmentUrl("?gclid=abc&utm_source=google"), "https://sanative.com.au");
    expect(url.pathname).toBe("/weight-management/assessment");
    expect(url.searchParams.get("gclid")).toBe("abc");
    expect(url.searchParams.get("utm_source")).toBe("google");
    expect(url.searchParams.get("source")).toBe(LP_FUNNEL_SOURCE);
  });

  it("calculates BMI to one decimal", () => {
    expect(calculateBmi(170, 85)).toBe(29.4);
    expect(calculateBmi(0, 85)).toBeNull();
  });

  it("flags BMI 27 and above as likely eligible", () => {
    expect(isLikelyEligibleBmi(27)).toBe(true);
    expect(isLikelyEligibleBmi(26.9)).toBe(false);
  });

  it("sends LP CTAs into the isolated guest funnel and keeps the public assessment path unchanged", () => {
    const funnel = new URL(buildFunnelUrl("?gclid=abc&utm_source=google"), "https://sanative.com.au");
    expect(LP_PATH).toBe("/lp/weight-management");
    expect(funnel.pathname).toBe(FUNNEL_PATH);
    expect(funnel.searchParams.get("gclid")).toBe("abc");
    expect(funnel.searchParams.get("source")).toBe(LP_FUNNEL_SOURCE);
    expect(LP_WM_ASSESSMENT_CENTS).toBe(4900);
    expect(LP_WM_QUIZ_STEPS.length).toBeGreaterThanOrEqual(5);
    expect(LP_WM_QUIZ_STEPS.some((step) => /how soon would you like to speak with a doctor/i.test(step.prompt))).toBe(
      false
    );
    expect(ASSESSMENT_PATH).toBe("/weight-management/assessment");
  });

  it("uses a shortened copy of the original weight-loss quiz, then book, then $49", () => {
    const ids = LP_WM_QUIZ_STEPS.map((step) => step.id);
    expect(ids).toEqual([
      "weightLossGoal",
      "firstName",
      "measurements",
      "projection",
      "gender",
      "motivation",
      "previousAttempt",
      "previousTreatment",
      "medicalConditions",
      "pregnancyStatus",
    ]);
    expect(ids).not.toContain("digestiveConditions");
    expect(ids).not.toContain("mentalHealthConditions");
    expect(ids).not.toContain("currentMedications");
    expect(visibleLpWmQuizSteps({ gender: "male" }).some((step) => step.id === "pregnancyStatus")).toBe(false);
    expect(visibleLpWmQuizSteps({ gender: "female" }).some((step) => step.id === "pregnancyStatus")).toBe(true);

    const medical = LP_WM_QUIZ_STEPS.find((step) => step.id === "medicalConditions");
    expect(medical).toBeTruthy();
    if (medical) {
      expect(visibleLpWmQuizOptions(medical, { gender: "male" }).some((option) => option.id === "pcos")).toBe(
        false
      );
      expect(visibleLpWmQuizOptions(medical, { gender: "female" }).some((option) => option.id === "pcos")).toBe(
        true
      );
    }
    expect(LP_WM_FUNNEL_STAGE_LABELS.map((stage) => stage.id)).toEqual(["quiz", "book", "pay"]);
    expect(lpWmProjectedTargetKg(85, "10-25")).toBeLessThan(85);

    const female = validateLpWmQuizAnswers({
      weightLossGoal: "10-25",
      firstName: "Ada",
      weight: "85",
      height: "170",
      email: "ada@example.com",
      projection: "viewed",
      gender: "female",
      motivation: "energy",
      previousAttempt: "none",
      previousTreatment: "none",
      medicalConditions: "none",
      pregnancyStatus: "no",
    });
    expect(female.ok).toBe(true);
    if (female.ok) expect(female.value.bmi).toBe("29.4");
    expect(validateLpWmQuizAnswers({ gender: "female", weightLossGoal: "10-25" }).ok).toBe(false);
    expect(quizAnswerLabels(female.ok ? female.value : {}).some((row) => row.prompt === "BMI")).toBe(true);

    const male = validateLpWmQuizAnswers({
      weightLossGoal: "10-25",
      firstName: "Tom",
      weight: "95",
      height: "180",
      email: "tom@example.com",
      projection: "viewed",
      gender: "male",
      motivation: "energy",
      previousAttempt: "none",
      previousTreatment: "none",
      medicalConditions: "none",
    });
    expect(male.ok).toBe(true);
    expect(lpWmNeedsExtraReview({ pregnancyStatus: "pregnant" })).toBe(true);
    expect(lpWmNeedsExtraReview({ pregnancyStatus: "no" })).toBe(false);
    expect(
      validateLpWmQuizAnswers({
        ...((male.ok ? male.value : {}) as Record<string, string>),
        medicalConditions: "pcos",
      }).ok
    ).toBe(false);
  });

  it("runs the LP funnel quiz-first and tracks Google drop-off steps", () => {
    const funnel = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/funnel-client.tsx"),
      "utf8"
    );
    const quiz = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/quiz-step.tsx"),
      "utf8"
    );
    const assessment = readFileSync(
      join(process.cwd(), "src/app/(public)/weight-management/assessment/page.tsx"),
      "utf8"
    );
    expect(funnel).toContain('useState<Step>("quiz")');
    expect(funnel).toContain('setStep("qualify")');
    expect(funnel).toContain('setStep("details")');
    expect(funnel).toContain('step === "payment"');
    expect(funnel).toContain("onLeadCapture");
    expect(funnel).toContain("Complete your profile");
    expect(funnel).toContain("Proceed to payment");
    expect(funnel).toContain("Join with confidence");
    expect(funnel).toContain("ShieldCheck");
    expect(funnel).not.toContain("Your details are saved");
    expect(funnel).toContain("Back to homepage");
    expect(funnel).toContain("LP_PATH");
    expect(funnel).not.toContain("Start a new assessment");
    expect(funnel).toContain("A leftover booking token must not lock the funnel");
    expect(funnel).toContain("Last name");
    expect(funnel).not.toContain("Payment successful");
    const qualify = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/qualification-step.tsx"),
      "utf8"
    );
    expect(qualify).toContain("come to the right place");
    expect(qualify).not.toContain("Additional review needed");
    expect(qualify).toContain("lpImages.welcomeMale");
    expect(qualify).toContain("lpImages.welcomeFemale");
    expect(qualify).not.toContain("WM_quiz.webp");
    expect(qualify).toContain("Love it or Leave it, 30-day money-back guarantee");
    expect(qualify).toContain("Claim your intro offer");
    expect(qualify).toContain("Continue");
    expect(qualify).toContain("onContinue(claimed)");
    expect(qualify).toContain("new and exciting medical weight options");
    expect(funnel).toContain("quizAnswers: quizAnswersRef.current");
    expect(funnel).toContain("trackLpWmFunnelProgress");
    expect(quiz).toContain('stage: "quiz"');
    expect(quiz).toContain("LpWmProjectionGraph");
    expect(quiz).toContain("projection_email");
    expect(quiz).toContain("Height (cm)");
    expect(quiz).toContain("onUnlock");
    expect(assessment).toContain("digestiveConditions");
  });

  it("blocks payment until a time and contact details are in", () => {
    const contact = validateLpWmContact({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "0412 345 678",
    });
    expect(lpWmPaymentGate({ slot: null, contact }).ok).toBe(false);
    expect(
      lpWmPaymentGate({
        slot: null,
        contact,
      })
    ).toMatchObject({ target: "time" });
    expect(
      lpWmPaymentGate({
        slot: {
          slotId: "slot_1",
          startTime: "2026-11-12T22:00:00.000Z",
          endTime: "2026-11-12T22:30:00.000Z",
        },
        contact: validateLpWmContact({ firstName: "", lastName: "", email: "", phone: "" }),
      })
    ).toMatchObject({ target: "details" });
    expect(
      lpWmPaymentGate({
        slot: {
          slotId: "slot_1",
          startTime: "2026-11-12T22:00:00.000Z",
          endTime: "2026-11-12T22:30:00.000Z",
        },
        contact,
      }).ok
    ).toBe(true);
  });

  it("validates guest contact without requiring an address", () => {
    expect(
      validateLpWmIdentity({
        firstName: "Ada",
        email: "ada@example.com",
      }).ok
    ).toBe(true);
    expect(
      validateLpWmContact({
        firstName: "Ada",
        email: "ada@example.com",
        phone: "0412 345 678",
      }).ok
    ).toBe(false);
    expect(
      validateLpWmContact({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "0412 345 678",
      }).ok
    ).toBe(true);
    expect(validateLpWmContact({ firstName: "Ada", email: "ada@example.com", phone: "" }).ok).toBe(false);
    expect(validateLpWmContact({ firstName: "Ada", lastName: "Lovelace", email: "nope", phone: "0412" }).ok).toBe(
      false
    );
    expect(collectLpWmUtm("?utm_campaign=wm&gclid=1").utm_campaign).toBe("wm");
  });

  it("marks Monday, Tuesday and Wednesday as booked on the LP funnel", () => {
    expect(isLpWmClosedWeekday("2026-11-09T00:00:00+11:00")).toBe(true);
    expect(isLpWmClosedWeekday("2026-11-10T00:00:00+11:00")).toBe(true);
    expect(isLpWmClosedWeekday("2026-11-11T00:00:00+11:00")).toBe(true);
    expect(isLpWmClosedWeekday("2026-11-12T00:00:00+11:00")).toBe(false);
    expect(isLpWmHiddenWeekday("2026-11-15T00:00:00+11:00")).toBe(true);
    expect(isLpWmHiddenWeekday("2026-11-14T00:00:00+11:00")).toBe(false);
    expect(LP_WM_CALENDAR_HORIZON_DAYS).toBe(14);
    const picker = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/slot-picker.tsx"),
      "utf8"
    );
    expect(picker).toContain("isLpWmHiddenWeekday");
    expect(picker).toContain("LP_WM_CALENDAR_HORIZON_DAYS");
    expect(picker).not.toContain("WINDOW_DAYS");
    expect(
      validateLpWmSlot({
        slotId: "slot_sun",
        startTime: "2026-11-14T22:00:00.000Z",
        endTime: "2026-11-14T22:30:00.000Z",
      }).ok
    ).toBe(false);
    const marked = applyLpWmClosedWeekdayBookings([
      {
        startTime: "2026-11-10T22:00:00.000Z",
        availabilityStatus: "AVAILABLE",
        availableDoctors: 2,
      },
    ]);
    expect(marked[0]?.availabilityStatus).toBe("BOOKED");
    expect(
      validateLpWmSlot({
        slotId: "slot_1",
        startTime: "2026-11-10T22:00:00.000Z",
        endTime: "2026-11-10T22:30:00.000Z",
      }).ok
    ).toBe(false);
  });

  it("writes welcome and staff emails with no login link", () => {
    const payload = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "0412345678",
      appointmentStart: "2026-11-20T00:00:00.000Z",
      paymentIntentId: "pi_test",
    };
    const welcome = lpWmWelcomeEmail(payload);
    const staff = lpWmStaffNotificationEmail(payload);
    expect(welcome.subject).toContain("Ada");
    expect(welcome.text).not.toMatch(/login|magic link|password/i);
    expect(welcome.text).not.toMatch(/no account has been created/i);
    expect(welcome.text).toContain("Congratulations on completing the first step in your weight loss journey");
    expect(welcome.text).not.toContain("Quick online intake assessment");
    expect(welcome.html).not.toContain("text-decoration: line-through");
    expect(welcome.text).toContain("1. Consultation with a Sanative doctor");
    expect(welcome.text).toContain("2. Join the program");
    expect(welcome.text).toContain("3. Start your personalised program");
    expect(welcome.html).toContain("border-collapse: collapse");
    expect(welcome.html).not.toMatch(/<ol[\s>]/);
    expect(welcome.text).toContain("Kind regards,");
    expect(welcome.text).toContain("Your Sanative Care Team");
    expect(staff.text).toContain("to_process");
    expect(LP_WM_STAFF_INBOX).toBe("info@sanative.com.au");
  });

  it("mounts Apple Pay only on the visible payment step and keeps card validation off the wallet path", () => {
    const funnel = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/funnel-client.tsx"),
      "utf8"
    );
    const payment = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/payment-form.tsx"),
      "utf8"
    );
    expect(funnel).toContain('step === "payment"');
    expect(funnel).not.toContain("left-[-120vw]");
    expect(funnel).toContain("stripeCheckoutElementsPaymentMethodOrder");
    expect(payment).toContain("stripePaymentElementOptions");
    expect(payment).toContain("completeCheckoutPayment(true)");
    expect(payment).toContain("ExpressCheckoutElement");
    expect(payment).toContain("showCardElement");
    expect(payment).toContain("walletBlocked");
    expect(payment).not.toContain('layout: "tabs"');
  });

  it("does not rate-limit PaymentIntent reuse or fire an intent on every keystroke", () => {
    const intent = readFileSync(
      join(process.cwd(), "src/app/api/lp/weight-management/intent/route.ts"),
      "utf8"
    );
    const lead = readFileSync(
      join(process.cwd(), "src/app/api/lp/weight-management/lead/route.ts"),
      "utf8"
    );
    const funnel = readFileSync(
      join(process.cwd(), "src/components/lp/weight-management/funnel/funnel-client.tsx"),
      "utf8"
    );
    expect(intent).toContain("hasExistingIntent");
    expect(intent).toContain("RATE_LIMITS.lpWmIntentIp");
    expect(lead).toContain("hasExistingLead");
    expect(funnel).toContain("ensurePaymentIntent");
    expect(funnel).not.toContain("[email, firstName, hydrated, lastName, paid, phone, slot, step]");
    expect(funnel).toContain("clientSecret: clientSecret ?? undefined");
    expect(funnel).toContain("draft.clientSecret");
  });
});
