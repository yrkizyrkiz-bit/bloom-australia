import { describe, expect, it } from "vitest";
import {
  defaultDoctorProgramTab,
  resolveDoctorEnrolledPrograms,
  resolveDoctorPrescriptionCategory,
} from "@/lib/admin/doctor-consult-programs";

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

  it("defaults a sexual-health-only member to the Men's ED tab", () => {
    expect(
      defaultDoctorProgramTab(
        [{ key: "MENS_HEALTH_SEXUAL", label: "Men's Sexual Health", status: "PENDING" }],
        false,
        true
      )
    ).toBe("MENS_HEALTH_SEXUAL");
  });

  it("maps Men's ED tab to SEXUAL_HEALTH prescriptions", () => {
    expect(resolveDoctorPrescriptionCategory("MENS_HEALTH_SEXUAL")).toBe("SEXUAL_HEALTH");
  });
});
