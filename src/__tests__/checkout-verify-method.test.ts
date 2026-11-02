import { describe, expect, it } from "vitest";
import {
  checkoutPrefillSelectsEmailTab,
  defaultCheckoutVerifyMethod,
  isLiverSignupCheckout,
} from "@/lib/membership/checkout-verify-method";

describe("checkout verify method default", () => {
  it("treats fatty_liver and the $79 liver quiz product as liver signup", () => {
    expect(isLiverSignupCheckout({ source: "fatty_liver" })).toBe(true);
    expect(
      isLiverSignupCheckout({
        product: "liver_biomarker_insights",
        button: "liver_quiz_result",
      })
    ).toBe(true);
    expect(isLiverSignupCheckout({ source: "heart_health" })).toBe(false);
    expect(isLiverSignupCheckout({ source: "kidney_health" })).toBe(false);
    expect(isLiverSignupCheckout({ source: null, product: null, button: null })).toBe(false);
  });

  it("defaults liver signup to Mobile (SMS), including desktop", () => {
    expect(
      defaultCheckoutVerifyMethod({
        source: "fatty_liver",
        product: "liver_biomarker_insights",
        button: "liver_quiz_result",
        isPhoneViewport: true,
      })
    ).toBe("phone");
    expect(
      defaultCheckoutVerifyMethod({
        source: "fatty_liver",
        product: "liver_biomarker_insights",
        button: "liver_quiz_result",
        isPhoneViewport: false,
      })
    ).toBe("phone");
    expect(
      checkoutPrefillSelectsEmailTab({
        source: "fatty_liver",
        product: "liver_biomarker_insights",
        button: "liver_quiz_result",
        isPhoneViewport: true,
      })
    ).toBe(false);
  });

  it("keeps other funnels email-first on desktop and SMS on phone", () => {
    expect(
      defaultCheckoutVerifyMethod({
        source: "heart_health",
        button: "heart_quiz_result",
        isPhoneViewport: false,
      })
    ).toBe("email");
    expect(
      defaultCheckoutVerifyMethod({
        source: "kidney_health",
        button: "kidney_quiz_result",
        isPhoneViewport: true,
      })
    ).toBe("phone");
    expect(
      defaultCheckoutVerifyMethod({
        source: null,
        product: null,
        button: null,
        isPhoneViewport: false,
      })
    ).toBe("email");
    expect(
      checkoutPrefillSelectsEmailTab({
        source: "heart_health",
        isPhoneViewport: false,
      })
    ).toBe(true);
    expect(
      checkoutPrefillSelectsEmailTab({
        source: "heart_health",
        isPhoneViewport: true,
      })
    ).toBe(false);
  });
});
