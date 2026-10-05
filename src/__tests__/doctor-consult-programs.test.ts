import { describe, expect, it } from "vitest";
import {
  defaultDoctorProgramTab,
  isNonWeightDoctorApproval,
  resolveDoctorEnrolledPrograms,
  resolveDoctorPrescriptionCategory,
} from "@/lib/admin/doctor-consult-programs";
import { resolveWomensApprovalUserJourney } from "@/lib/program-journey/womens-journey";

describe("doctor consult programs", () => {
  it("tags hair enrollment from program members without treating membership as weight management", () => {
    const programs = resolveDoctorEnrolledPrograms(
      [{ program: "HAIR_LOSS", membershipStatus: "PENDING" }],
      [{ key: "HAIR_LOSS", status: "PENDING" }]
    );

    expect(programs).toEqual([
      expect.objectContaining({ key: "HAIR_LOSS", label: "Hair" }),
    ]);
  });

  it("tags membership-only from subscription tier without a Weight Management badge", () => {
    const programs = resolveDoctorEnrolledPrograms([], [], "membership", [
      { key: "MEMBERSHIP", status: "ACTIVE" },
    ]);

    expect(programs).toEqual([
      expect.objectContaining({ key: "membership", label: "Membership" }),
    ]);
    expect(programs.some((p) => p.key === "WEIGHT_MANAGEMENT")).toBe(false);
    expect(defaultDoctorProgramTab(programs)).toBe("MEMBERSHIP");
  });

  it("defaults a hair-only member to the Hair tab", () => {
    expect(
      defaultDoctorProgramTab([{ key: "HAIR_LOSS", label: "Hair", status: "PENDING" }], true)
    ).toBe("HAIR_LOSS");
    expect(
      defaultDoctorProgramTab(
        [{ key: "WEIGHT_MANAGEMENT", label: "Weight Management", status: "ACTIVE" }],
        false
      )
    ).toBe("WEIGHT_MANAGEMENT");
  });

  it("does not default empty enrollment to Weight Management", () => {
    expect(defaultDoctorProgramTab([])).toBe("MEMBERSHIP");
  });

  it("defaults a sexual-health-only member to the Men's ED tab", () => {
    expect(
      defaultDoctorProgramTab(
        [{ key: "MENS_HEALTH_SEXUAL", label: "Men's Sexual Health", status: "PENDING" }],
        false,
        true
      )
    ).toBe("MENS_HEALTH_SEXUAL");
  });

  it("defaults a women's-wellness-only member to the Women's Wellness tab", () => {
    expect(
      defaultDoctorProgramTab(
        [{ key: "WOMENS_HEALTH_SEXUAL", label: "Women's Wellness", status: "PENDING" }],
        false,
        false,
        true
      )
    ).toBe("WOMENS_HEALTH_SEXUAL");
  });

  it("maps Men's ED tab to SEXUAL_HEALTH prescriptions", () => {
    expect(resolveDoctorPrescriptionCategory("MENS_HEALTH_SEXUAL")).toBe("SEXUAL_HEALTH");
  });

  it("maps Women's Wellness tab to HORMONE_THERAPY prescriptions", () => {
    expect(resolveDoctorPrescriptionCategory("WOMENS_HEALTH_SEXUAL")).toBe("HORMONE_THERAPY");
    expect(isNonWeightDoctorApproval("HORMONE_THERAPY")).toBe(true);
  });

  it("does not change hair/mens defaults when women is also enrolled with weight", () => {
    expect(
      defaultDoctorProgramTab(
        [
          { key: "WEIGHT_MANAGEMENT", label: "Weight Management", status: "ACTIVE" },
          { key: "WOMENS_HEALTH_SEXUAL", label: "Women's Wellness", status: "PENDING" },
        ],
        false,
        false,
        true
      )
    ).toBe("WEIGHT_MANAGEMENT");
  });
});

describe("resolveWomensApprovalUserJourney", () => {
  it("activates journey only when no competing clinical programs", () => {
    expect(resolveWomensApprovalUserJourney({ hasWeightManagementEnrollment: false })).toEqual({
      journeyStatus: "ACTIVE",
    });
    expect(
      resolveWomensApprovalUserJourney({
        hasWeightManagementEnrollment: true,
      })
    ).toEqual({});
    expect(
      resolveWomensApprovalUserJourney({
        hasWeightManagementEnrollment: false,
        hasHairLossEnrollment: true,
      })
    ).toEqual({});
  });
});
