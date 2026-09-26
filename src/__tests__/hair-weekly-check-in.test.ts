import { describe, expect, it } from "vitest";
import {
  alreadyCheckedInHairWeek,
  clampHairRating,
  hairWeekKey,
} from "@/lib/hair-health/weekly-check-in";

describe("hair weekly check-in", () => {
  it("uses a stable Monday week key in Sydney time", () => {
    const monday = hairWeekKey(new Date("2026-09-28T01:00:00+10:00"));
    const tuesday = hairWeekKey(new Date("2026-09-29T12:00:00+10:00"));
    const sundayBefore = hairWeekKey(new Date("2026-09-27T23:00:00+10:00"));
    expect(monday).toMatch(/^2026-W\d{2}$/);
    expect(tuesday).toBe(monday);
    expect(sundayBefore).not.toBe(monday);
  });

  it("allows only one check-in per week", () => {
    const now = new Date("2026-09-26T12:00:00+10:00");
    const key = hairWeekKey(now);
    expect(alreadyCheckedInHairWeek(key, now)).toBe(true);
    expect(alreadyCheckedInHairWeek("2026-W01", now)).toBe(false);
  });

  it("clamps how-you-feel ratings to 1-5", () => {
    expect(clampHairRating(0)).toBe(1);
    expect(clampHairRating(9)).toBe(5);
    expect(clampHairRating("3")).toBe(3);
  });
});
