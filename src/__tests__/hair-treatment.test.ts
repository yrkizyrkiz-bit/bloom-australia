import { describe, expect, it } from "vitest";
import {
  generateHairDoseDates,
  hairDosesPerDay,
  isDoctorCompletedHairPrescription,
  parseHairFirstDoseDate,
} from "@/lib/program/hair-treatment";

describe("hair treatment first-dose schedule", () => {
  it("only uses doctor-completed hair prescriptions", () => {
    expect(
      isDoctorCompletedHairPrescription({ category: "HAIR_LOSS", status: "ACTIVE" })
    ).toBe(true);
    expect(
      isDoctorCompletedHairPrescription({ category: "WEIGHT_MANAGEMENT", status: "ACTIVE" })
    ).toBe(false);
    expect(
      isDoctorCompletedHairPrescription({ category: "HAIR_LOSS", status: "CANCELLED" })
    ).toBe(false);
  });

  it("calculates later dose dates from the first dose", () => {
    const first = parseHairFirstDoseDate("2026-09-26");
    expect(first?.toISOString()).toBe("2026-09-26T00:00:00.000Z");

    const daily = generateHairDoseDates(first!, "Once daily", 4);
    expect(daily.map((date) => date.toISOString().slice(0, 10))).toEqual([
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
    ]);

    expect(hairDosesPerDay("Twice daily")).toBe(2);
    const twice = generateHairDoseDates(first!, "Twice daily", 2);
    expect(twice).toHaveLength(4);
    expect(twice[0].toISOString()).toBe("2026-09-26T00:00:00.000Z");
    expect(twice[1].toISOString()).toBe("2026-09-26T12:00:00.000Z");
    expect(twice[2].toISOString().slice(0, 10)).toBe("2026-09-27");
  });
});
