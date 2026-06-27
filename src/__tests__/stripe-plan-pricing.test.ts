import { describe, it, expect } from "vitest";
import {
  expectedFirstMonthCentsForConsultProgram,
  isAllowedCheckoutPlanId,
  isPrecisionPlanId,
  paymentMetadataMatchesSelectedPlan,
  resolveFirstMonthCheckoutCharge,
  WM_CORE_FIRST_MONTH_CENTS,
  WM_PRECISION_FIRST_MONTH_CENTS,
} from "@/lib/stripe/plan-pricing";

describe("stripe plan-pricing", () => {
  it("resolves WM core at 24900 cents server-side", () => {
    const charge = resolveFirstMonthCheckoutCharge("weight_management", "core");
    expect(charge?.amountCents).toBe(24900);
    expect(charge?.selectedPlan).toBe("core");
  });

  it("resolves WM precision at 39900 cents server-side", () => {
    const charge = resolveFirstMonthCheckoutCharge("weight_management", "precision");
    expect(charge?.amountCents).toBe(39900);
    expect(charge?.selectedPlan).toBe("precision");
  });

  it("ignores client tampering — amounts are fixed per program", () => {
    const mens = resolveFirstMonthCheckoutCharge("mens_health", "core");
    expect(mens?.amountCents).toBe(4900);
    const hair = resolveFirstMonthCheckoutCharge("hair_loss", "core");
    expect(hair?.amountCents).toBe(4900);
  });

  it("rejects legacy plan ids", () => {
    expect(isAllowedCheckoutPlanId("legacy_plan")).toBe(false);
    expect(resolveFirstMonthCheckoutCharge("weight_management", "legacy_plan")).toBeNull();
  });

  it("matches precision metadata correctly", () => {
    expect(
      paymentMetadataMatchesSelectedPlan(
        { selectedPlan: "precision", planId: "precision" },
        "PRECISION"
      )
    ).toBe(true);
    expect(
      paymentMetadataMatchesSelectedPlan({ selectedPlan: "core" }, "PRECISION")
    ).toBe(false);
  });

  it("expectedFirstMonthCentsForConsultProgram uses WM tiers", () => {
    expect(
      expectedFirstMonthCentsForConsultProgram(
        { isWeightManagement: true, firstMonthAud: 249 },
        "CORE"
      )
    ).toBe(WM_CORE_FIRST_MONTH_CENTS);
    expect(
      expectedFirstMonthCentsForConsultProgram(
        { isWeightManagement: true, firstMonthAud: 249 },
        "PRECISION"
      )
    ).toBe(WM_PRECISION_FIRST_MONTH_CENTS);
    expect(
      expectedFirstMonthCentsForConsultProgram(
        { isWeightManagement: false, firstMonthAud: 49 },
        null
      )
    ).toBe(4900);
  });

  it("identifies precision plan ids", () => {
    expect(isPrecisionPlanId("precision")).toBe(true);
    expect(isPrecisionPlanId("sanative_precision_first_month")).toBe(true);
    expect(isPrecisionPlanId("core")).toBe(false);
  });
});

describe("verifyFirstMonthPaymentForBooking contract", () => {
  it("exports shared verifier used by confirm and doctor decision routes", async () => {
    const { verifyFirstMonthPaymentForBooking } = await import(
      "@/lib/stripe/verify-booking-payment-intent"
    );
    expect(typeof verifyFirstMonthPaymentForBooking).toBe("function");
  });
});
