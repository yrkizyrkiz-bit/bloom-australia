import { describe, expect, it } from "bun:test";
import {
  getSexualJourneyStageDescription,
  resolveSexualApprovalUserJourney,
  resolveSexualJourneyStatus,
} from "@/lib/program-journey/sexual-journey";
import {
  resolveHairApprovalUserJourney,
  resolveHairJourneyStatus,
} from "@/lib/program-journey/hair-journey";

describe("hair vs sexual journey separation", () => {
  it("does not mark Sexual Health approved from a hair-only doctor approval", () => {
    expect(
      resolveSexualJourneyStatus({
        journeyStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        programMemberStatus: "PENDING",
        hasSexualPrescription: false,
        hasActiveTreatment: false,
        sexualOnly: false,
      })
    ).toBe("CONSULTATION_PAID");
  });

  it("ignores global approval when member also has hair (David dual-program case)", () => {
    // Hair entitlement/tier present ⇒ sexualOnly false ⇒ no shared approval bleed.
    expect(
      resolveSexualJourneyStatus({
        journeyStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        programMemberStatus: "PENDING",
        hasSexualPrescription: false,
        hasActiveTreatment: false,
        sexualOnly: false,
      })
    ).toBe("CONSULTATION_PAID");
    expect(
      getSexualJourneyStageDescription("CONSULTATION_PAID")
    ).toBe("Payment received");
  });

  it("still advances Sexual Health when a sexual script exists", () => {
    expect(
      resolveSexualJourneyStatus({
        journeyStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        hasSexualPrescription: true,
        sexualOnly: false,
      })
    ).toBe("APPROVED");
  });

  it("still uses shared user approval for sexual-only members", () => {
    expect(
      resolveSexualJourneyStatus({
        approvalStatus: "APPROVED",
        sexualOnly: true,
      })
    ).toBe("APPROVED");
  });

  it("does not mark Hair approved from sexual user approval without a hair script", () => {
    expect(
      resolveHairJourneyStatus({
        journeyStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        programMemberStatus: "PENDING",
        hasHairPrescription: false,
        hairOnly: false,
      })
    ).toBe("CONSULTATION_PAID");
  });

  it("leaves the other program's user journeyStatus alone after approval", () => {
    expect(
      resolveHairApprovalUserJourney({
        hasWeightManagementEnrollment: false,
        hasSexualHealthEnrollment: true,
      })
    ).toEqual({});
    expect(
      resolveSexualApprovalUserJourney({
        hasWeightManagementEnrollment: false,
        hasHairLossEnrollment: true,
      })
    ).toEqual({});
    expect(
      resolveHairApprovalUserJourney({
        hasWeightManagementEnrollment: false,
        hasSexualHealthEnrollment: false,
      })
    ).toEqual({ journeyStatus: "ACTIVE" });
  });
});
