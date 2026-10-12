import { describe, expect, it } from "vitest";
import {
  orderProgramPaymentIntentIds,
  paymentBelongsToMember,
  portalPaymentFailureIsTerminal,
  portalProgramChargeAllowed,
  programKeysForPrescriptionCategory,
  weightDecisionShouldUseMembershipPayment,
} from "@/lib/stripe/verify-portal-program-care-payment";

describe("paymentBelongsToMember", () => {
  it("accepts a membership charge that stored the email and not the user id", () => {
    expect(
      paymentBelongsToMember({
        metadataUserId: "",
        metadataEmail: "DinoBeauFabio@gmail.com",
        memberId: "cmv4ogzz3000112heqnl49l0m",
        memberEmail: "dinobeaufabio@gmail.com",
      })
    ).toBe(true);
  });

  it("rejects a charge that names a different member", () => {
    expect(
      paymentBelongsToMember({
        metadataUserId: "someone-else",
        metadataEmail: "dinobeaufabio@gmail.com",
        memberId: "cmv4ogzz3000112heqnl49l0m",
        memberEmail: "dinobeaufabio@gmail.com",
      })
    ).toBe(false);
  });

  it("rejects a charge with neither a user id nor a matching email", () => {
    expect(
      paymentBelongsToMember({
        metadataUserId: null,
        metadataEmail: "other@example.com",
        memberId: "cmv4ogzz3000112heqnl49l0m",
        memberEmail: "dinobeaufabio@gmail.com",
      })
    ).toBe(false);
  });
});

describe("programKeysForPrescriptionCategory", () => {
  it("maps hair / sexual / hormone / weight categories to program keys", () => {
    expect(programKeysForPrescriptionCategory("HAIR_LOSS")).toEqual(["HAIR_LOSS"]);
    expect(programKeysForPrescriptionCategory("SEXUAL_HEALTH")).toEqual([
      "MENS_HEALTH_SEXUAL",
      "MENS_HEALTH_VITALITY",
    ]);
    expect(programKeysForPrescriptionCategory("HORMONE_THERAPY")).toEqual([
      "WOMENS_HEALTH_SEXUAL",
      "WOMENS_HEALTH_VITALITY",
    ]);
    expect(programKeysForPrescriptionCategory("WEIGHT_MANAGEMENT")).toEqual([
      "WEIGHT_MANAGEMENT",
    ]);
  });
});

describe("shared consult payment selection", () => {
  it("tries the program payment before another program's charge stored on the consult", () => {
    expect(
      orderProgramPaymentIntentIds({
        matchingIds: ["pi_weight"],
        otherIds: ["pi_womens_on_booking", "pi_weight"],
      })
    ).toEqual(["pi_weight", "pi_womens_on_booking"]);
  });

  it("accepts a portal charge that matches its catalog price", () => {
    expect(portalProgramChargeAllowed(24900, 24900)).toBe(true);
    expect(portalProgramChargeAllowed(86400, 36500)).toBe(false);
    expect(portalProgramChargeAllowed(32400, null)).toBe(true);
  });

  it("keeps looking when the consult charge belongs to another program", () => {
    expect(
      portalPaymentFailureIsTerminal({
        error: "Payment does not match the prescribed program",
        paymentWasForThisProgram: false,
      })
    ).toBe(false);
    expect(
      portalPaymentFailureIsTerminal({
        error: "Program payment has been refunded",
        paymentWasForThisProgram: true,
      })
    ).toBe(true);
  });

  it("uses the membership amount check only when no portal program charge verified", () => {
    expect(
      weightDecisionShouldUseMembershipPayment({
        ok: true,
        paymentIntentId: "pi_weight",
        programKey: "WEIGHT_MANAGEMENT",
        backfilled: false,
      })
    ).toBe(false);
    expect(
      weightDecisionShouldUseMembershipPayment({
        ok: false,
        error: "Payment does not match the prescribed program",
        status: 400,
      })
    ).toBe(true);
    expect(
      weightDecisionShouldUseMembershipPayment({
        ok: false,
        error: "Invalid payment amount",
        status: 400,
      })
    ).toBe(false);
  });
});
