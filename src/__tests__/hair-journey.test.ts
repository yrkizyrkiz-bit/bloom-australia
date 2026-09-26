import { describe, expect, it } from "vitest";
import {
  HAIR_LOSS_JOURNEY_STEPS,
  getHairJourneyStageDescription,
  getHairTimelineProgress,
  resolveHairApprovalUserJourney,
  resolveHairJourneyStatus,
} from "@/lib/program-journey/hair-journey";
import { DEFAULT_JOURNEY_STEPS, getTimelineProgress } from "@/lib/program-journey/timeline";

describe("hair health journey", () => {
  it("uses four steps only", () => {
    expect(HAIR_LOSS_JOURNEY_STEPS.map((step) => step.label)).toEqual([
      "Payment received",
      "Doctor assessment",
      "Treatment program approved",
      "Program active",
    ]);
    expect(getTimelineProgress("CONSULTATION_PAID", { programKey: "HAIR_LOSS" }).steps).toHaveLength(4);
  });

  it("maps payment, doctor assessment, approval, and active", () => {
    expect(resolveHairJourneyStatus({ journeyStatus: "CONSULTATION_PAID" })).toBe(
      "CONSULTATION_PAID"
    );
    expect(resolveHairJourneyStatus({ journeyStatus: "PRE_TRIAGE_PENDING" })).toBe(
      "CONSULTATION_PAID"
    );
    expect(
      resolveHairJourneyStatus({
        journeyStatus: "PRE_TRIAGE_PENDING",
        hasUpcomingBooking: true,
      })
    ).toBe("AWAITING_DOCTOR_CALL");
    expect(
      resolveHairJourneyStatus({
        journeyStatus: "AWAITING_DOCTOR_DECISION",
        hairOnly: true,
      })
    ).toBe("AWAITING_DOCTOR_CALL");
    expect(
      resolveHairJourneyStatus({ approvalStatus: "APPROVED", hairOnly: true })
    ).toBe("APPROVED");
    expect(
      resolveHairJourneyStatus({
        approvalStatus: "APPROVED",
        programMemberStatus: "ACTIVE",
        hasHairPrescription: true,
      })
    ).toBe("ACTIVE");
    expect(
      resolveHairJourneyStatus({
        journeyStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        programMemberStatus: "PENDING",
        consultCompleted: true,
        hairOnly: false,
      })
    ).toBe("AWAITING_DOCTOR_CALL");

    expect(getHairTimelineProgress("CONSULTATION_PAID").currentStep).toBe(0);
    expect(getHairTimelineProgress("AWAITING_DOCTOR_CALL").currentStep).toBe(1);
    expect(getHairTimelineProgress("APPROVED").currentStep).toBe(2);
    expect(getHairTimelineProgress("ACTIVE").currentStep).toBe(3);
    expect(getHairJourneyStageDescription("APPROVED")).toBe("Treatment program approved");
  });

  it("does not change the weight-management timeline", () => {
    const wm = getTimelineProgress("APPROVED");
    expect(wm.steps).toEqual(DEFAULT_JOURNEY_STEPS);
    expect(wm.steps).toHaveLength(8);
    expect(wm.currentStep).toBe(4);
    expect(getTimelineProgress("ACTIVE").currentStep).toBe(7);
  });

  it("leaves a dual-enrolled member on the weight-management journey after hair approval", () => {
    expect(
      resolveHairApprovalUserJourney({ hasWeightManagementEnrollment: true })
    ).toEqual({});
    expect(
      resolveHairApprovalUserJourney({ hasWeightManagementEnrollment: false })
    ).toEqual({ journeyStatus: "ACTIVE" });
  });
});
