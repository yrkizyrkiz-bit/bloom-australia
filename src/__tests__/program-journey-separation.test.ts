import { describe, expect, it } from "vitest";
import {
  getSexualJourneyStageDescription,
  isMensSexualHealthBookingNotes,
  pickMensSexualHealthBooking,
  resolveSexualApprovalUserJourney,
  resolveSexualJourneyStatus,
} from "@/lib/program-journey/sexual-journey";
import {
  resolveHairApprovalUserJourney,
  resolveHairJourneyStatus,
  resolveHairOnlyEnrollment,
  resolveHairPortalBooking,
} from "@/lib/program-journey/hair-journey";
import { resolveSubscriptionTierOnSync } from "@/lib/billing/sync-subscription";

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

  it("does not let Hair steal a Men's Health booking after portal hair upsell (Darth)", () => {
    const mensBooking = {
      id: "bk_mens",
      notes: "Men's Health Program - Doctor to be assigned during triage by care partner",
    };
    const hairOnly = resolveHairOnlyEnrollment({
      hasHairProgramMember: true,
      hasSexualProgramMember: false,
      entitlementKeys: ["MENS_HEALTH_SEXUAL", "HAIR_LOSS"],
    });
    expect(hairOnly).toBe(false);

    const booking = resolveHairPortalBooking({
      hairNoteBooking: null,
      openBooking: mensBooking,
      hairOnly,
      isHairMember: true,
    });
    expect(booking).toBeNull();

    expect(
      resolveHairJourneyStatus({
        journeyStatus: "CONSULTATION_BOOKED",
        hasUpcomingBooking: Boolean(booking),
        hairOnly,
      })
    ).toBe("CONSULTATION_PAID");
  });

  it("recognizes men's public funnel notes on Sexual Health portal", () => {
    const notes =
      "Men's Health Program - Doctor to be assigned during triage by care partner";
    expect(isMensSexualHealthBookingNotes(notes)).toBe(true);
    expect(isMensSexualHealthBookingNotes("Men\u2019s Health Program - triage")).toBe(
      true
    );
    expect(
      pickMensSexualHealthBooking([
        { id: "hair", notes: "Hair Loss Program - triage" },
        { id: "mens", notes },
      ])?.id
    ).toBe("mens");
  });

  it("preserves existing subscriptionTier when another ACTIVE program exists", () => {
    expect(
      resolveSubscriptionTierOnSync({
        existingTier: "mens_health_sexual",
        proposedTier: "hair_loss",
        activeProgramKeys: ["MENS_HEALTH_SEXUAL"],
        incomingProgramKey: "HAIR_LOSS",
      })
    ).toBe("mens_health_sexual");

    expect(
      resolveSubscriptionTierOnSync({
        existingTier: null,
        proposedTier: "hair_loss",
        activeProgramKeys: [],
        incomingProgramKey: "HAIR_LOSS",
      })
    ).toBe("hair_loss");
  });
});
