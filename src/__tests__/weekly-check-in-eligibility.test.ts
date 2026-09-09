import { describe, expect, it } from "vitest";
import {
  daysOnProgramInWeek,
  programWeekNumber,
  shouldPromptWeeklyCheckIn,
} from "@/lib/weight-management/weekly-check-in-eligibility";
import { startOfWeekMonday } from "@/lib/weight-management/score-ring-week";

describe("weekly check-in eligibility", () => {
  it("counts only Sat–Sun when joining on Saturday of a Mon–Sun week", () => {
    // Mon 1 Sep 2026 … Sun 7 Sep 2026; join Sat 5 Sep
    const join = new Date(2026, 8, 5);
    const weekStart = startOfWeekMonday(join);
    expect(daysOnProgramInWeek(join, weekStart, new Date(2026, 8, 7))).toBe(2);
  });

  it("does not prompt mid-week for a brand new member", () => {
    expect(
      shouldPromptWeeklyCheckIn({
        programStart: new Date(2026, 8, 5),
        now: new Date(2026, 8, 5, 15), // Saturday afternoon — weekend, but week 1 with only 1 day so far
      })
    ).toBe(false);
  });

  it("does not prompt at end of week 1 when the member had only 2 days", () => {
    expect(
      shouldPromptWeeklyCheckIn({
        programStart: new Date(2026, 8, 5), // Sat
        now: new Date(2026, 8, 6, 18), // Sun end of week 1
      })
    ).toBe(false);
  });

  it("prompts at end of week 1 when the member had more than 3 days", () => {
    // Joined Monday → 7 days in week
    expect(
      shouldPromptWeeklyCheckIn({
        programStart: new Date(2026, 7, 31), // Mon 31 Aug 2026
        now: new Date(2026, 8, 6, 18), // Sun
      })
    ).toBe(true);
  });

  it("prompts at end of week 2 even if week 1 was short", () => {
    expect(
      shouldPromptWeeklyCheckIn({
        programStart: new Date(2026, 8, 5), // Sat week 1
        now: new Date(2026, 8, 13, 18), // Sun week 2
      })
    ).toBe(true);
  });

  it("increments program week from the Monday of the start week", () => {
    const start = new Date(2026, 8, 5); // Sat 5 Sep 2026
    expect(programWeekNumber(start, new Date(2026, 8, 5))).toBe(1);
    expect(programWeekNumber(start, new Date(2026, 8, 6))).toBe(1); // Sun — still week 1
    expect(programWeekNumber(start, new Date(2026, 8, 7))).toBe(2); // Mon 7 Sep — week 2
  });
});
