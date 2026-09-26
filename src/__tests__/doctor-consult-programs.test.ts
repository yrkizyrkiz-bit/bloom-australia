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

  it("keeps weight-management prescriptions unless the Hair tab is active", () => {
    expect(resolveDoctorPrescriptionCategory("WEIGHT_MANAGEMENT")).toBe("WEIGHT_MANAGEMENT");
    expect(resolveDoctorPrescriptionCategory(undefined)).toBe("WEIGHT_MANAGEMENT");
    expect(resolveDoctorPrescriptionCategory("HAIR_LOSS")).toBe("HAIR_LOSS");
  });
});
