import { describe, expect, it } from "vitest";
import { biomarkerPaymentAmountAllowed } from "@/lib/stripe/verify-biomarkers-panel-booking-payment";
import { BIOMARKERS_RETEST_ADDON_AUD } from "@/lib/biomarkers/checkout-addons";

const RETEST = BIOMARKERS_RETEST_ADDON_AUD * 100;
const ADVANCED = 36500;

describe("biomarkerPaymentAmountAllowed", () => {
  it("accepts the panel amount alone", () => {
    expect(biomarkerPaymentAmountAllowed(ADVANCED, [ADVANCED])).toBe(true);
  });

  it("accepts panel + retest add-on", () => {
    expect(biomarkerPaymentAmountAllowed(ADVANCED + RETEST, [ADVANCED])).toBe(true);
  });

  it("accepts a drifted Stripe price amount that was actually charged", () => {
    const legacyStripeAmount = 39900;
    expect(
      biomarkerPaymentAmountAllowed(legacyStripeAmount, [ADVANCED, legacyStripeAmount])
    ).toBe(true);
  });

  it("accepts drifted Stripe price + retest", () => {
    const legacyStripeAmount = 39900;
    expect(
      biomarkerPaymentAmountAllowed(legacyStripeAmount + RETEST, [
        ADVANCED,
        legacyStripeAmount,
      ])
    ).toBe(true);
  });

  it("rejects unrelated amounts", () => {
    expect(biomarkerPaymentAmountAllowed(4900, [ADVANCED])).toBe(false);
  });
});
