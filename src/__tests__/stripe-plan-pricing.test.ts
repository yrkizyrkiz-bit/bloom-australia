import { describe, it, expect } from "vitest";
import {
  expectedFirstMonthCentsForConsultProgram,
  expectedVerifiedPaymentCents,
  isAllowedCheckoutPlanId,
  isPrecisionPlanId,
  isSanativeMembershipPaymentMetadata,
  paymentMetadataMatchesSelectedPlan,
  resolveFirstMonthCheckoutCharge,
  SANATIVE_MEMBERSHIP_CENTS,
} from "@/lib/stripe/plan-pricing";

describe("stripe plan-pricing", () => {
  it("resolves public WM checkout as Sanative Membership $365", () => {
    const charge = resolveFirstMonthCheckoutCharge("weight_management", "core");
    expect(charge?.amountCents).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(charge?.selectedPlan).toBe("membership");
    expect(charge?.ongoingAmountCents).toBe(36000);
  });

  it("resolves hair / men's / women's public checkout as membership $365", () => {
    const mens = resolveFirstMonthCheckoutCharge("mens_health", "core");
    expect(mens?.amountCents).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(mens?.ongoingAmountCents).toBe(24000);
    const hair = resolveFirstMonthCheckoutCharge("hair_loss", "core");
    expect(hair?.amountCents).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(hair?.ongoingAmountCents).toBe(9000);
    const womens = resolveFirstMonthCheckoutCharge("womens_health", "core");
    expect(womens?.amountCents).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(womens?.ongoingAmountCents).toBe(24000);
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

  it("expectedFirstMonthCentsForConsultProgram uses membership entry amounts", () => {
    expect(
      expectedFirstMonthCentsForConsultProgram(
        { isWeightManagement: true, firstMonthAud: 365 },
        "CORE"
      )
    ).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(
      expectedFirstMonthCentsForConsultProgram(
        { isWeightManagement: false, firstMonthAud: 365 },
        null
      )
    ).toBe(SANATIVE_MEMBERSHIP_CENTS);
  });

  it("accepts the $365 membership charge for current public-funnel payments", () => {
    expect(isSanativeMembershipPaymentMetadata({ purchaseType: "sanative_membership" })).toBe(
      true
    );
    expect(
      expectedVerifiedPaymentCents({
        metadata: { purchaseType: "sanative_membership" },
        consultProgram: { isWeightManagement: true, firstMonthAud: 365 },
        selectedPlan: "CORE",
      })
    ).toBe(SANATIVE_MEMBERSHIP_CENTS);
    expect(
      expectedVerifiedPaymentCents({
        metadata: {},
        consultProgram: { isWeightManagement: true, firstMonthAud: 365 },
        selectedPlan: "CORE",
      })
    ).toBe(SANATIVE_MEMBERSHIP_CENTS);
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
