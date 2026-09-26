import { describe, expect, it } from "vitest";
import {
  formatHairDoseLine,
  generateHairDoseDates,
  hairDoseScheduleNeedsRepair,
  hairDosesPerDay,
  isDoctorCompletedHairPrescription,
  parseHairFirstDoseDate,
  selectUpcomingHairDoses,
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
    expect(hairDosesPerDay("twice_daily")).toBe(2);
    const twice = generateHairDoseDates(first!, "twice_daily", 2);
    expect(twice).toHaveLength(4);
    expect(twice[0].toISOString()).toBe("2026-09-26T00:00:00.000Z");
    expect(twice[1].toISOString()).toBe("2026-09-26T12:00:00.000Z");
    expect(twice[2].toISOString().slice(0, 10)).toBe("2026-09-27");
  });

  it("lists upcoming doses in chronological order from today", () => {
    const doses = [
      { id: "c", scheduledAt: new Date("2026-10-20T00:00:00.000Z"), takenAt: null },
      { id: "a", scheduledAt: new Date("2026-09-26T00:00:00.000Z"), takenAt: null },
      { id: "b", scheduledAt: new Date("2026-09-27T00:00:00.000Z"), takenAt: null },
      { id: "old", scheduledAt: new Date("2026-09-20T00:00:00.000Z"), takenAt: null },
    ];
    const upcoming = selectUpcomingHairDoses(doses, new Date("2026-09-26T03:00:00.000Z"), 3);
    expect(upcoming.map((dose) => dose.id)).toEqual(["a", "b", "c"]);
  });

  it("flags a once-a-day series as wrong for twice-daily hair scripts", () => {
    const first = parseHairFirstDoseDate("2026-09-26")!;
    const daily = generateHairDoseDates(first, "once_daily", 2);
    expect(hairDoseScheduleNeedsRepair("twice_daily", first, 2, daily)).toBe(true);
    expect(formatHairDoseLine({
      strength: "1 mg",
      dosage: "1 tablet",
      frequency: "once_daily",
    })).toBe("1 mg · 1 tablet · Once daily");
  });
});
