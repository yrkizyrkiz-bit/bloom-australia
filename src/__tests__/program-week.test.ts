import { describe, expect, it } from "vitest";
import {
  daysLeftInMondayWeek,
  isShortProgramStartWeek,
  programCalendarWeek,
  weeklyAveragesFromWeightLogs,
} from "@/lib/program/program-week";

describe("program calendar week (Monday start)", () => {
  it("counts Friday–Sunday as a short week 0", () => {
    expect(daysLeftInMondayWeek(new Date(2026, 8, 4))).toBe(3); // Fri
    expect(daysLeftInMondayWeek(new Date(2026, 8, 5))).toBe(2); // Sat
    expect(daysLeftInMondayWeek(new Date(2026, 8, 6))).toBe(1); // Sun
    expect(isShortProgramStartWeek(new Date(2026, 8, 4))).toBe(true);
    expect(isShortProgramStartWeek(new Date(2026, 8, 3))).toBe(false); // Thu
  });

  it("keeps a Saturday starter in week 0 until Monday", () => {
    const start = new Date(2026, 8, 5); // Sat 5 Sep 2026
    expect(programCalendarWeek(start, new Date(2026, 8, 5))).toBe(0);
    expect(programCalendarWeek(start, new Date(2026, 8, 6))).toBe(0);
    expect(programCalendarWeek(start, new Date(2026, 8, 7))).toBe(1); // Mon
    expect(programCalendarWeek(start, new Date(2026, 8, 13))).toBe(1);
    expect(programCalendarWeek(start, new Date(2026, 8, 14))).toBe(2);
    expect(programCalendarWeek(start, new Date(2026, 8, 22))).toBe(3);
  });

  it("starts a Monday–Thursday join as week 1", () => {
    const monday = new Date(2026, 7, 31); // Mon 31 Aug
    expect(programCalendarWeek(monday, monday)).toBe(1);
    expect(programCalendarWeek(monday, new Date(2026, 8, 6))).toBe(1);
    expect(programCalendarWeek(monday, new Date(2026, 8, 7))).toBe(2);

    const thursday = new Date(2026, 8, 3);
    expect(programCalendarWeek(thursday, thursday)).toBe(1);
    expect(programCalendarWeek(thursday, new Date(2026, 8, 7))).toBe(2);
  });

  it("groups weigh-ins on Monday week starts", () => {
    const weeks = weeklyAveragesFromWeightLogs([
      { measuredAt: "2026-09-05T01:26:54.337Z", weight: 66.3 },
      { measuredAt: "2026-09-07T01:10:54.185Z", weight: 66.5 },
      { measuredAt: "2026-09-08T00:56:31.746Z", weight: 65.3 },
      { measuredAt: "2026-09-22T01:00:20.227Z", weight: 64.6 },
    ]);
    expect(weeks.map((row) => row.week)).toEqual(["2026-08-31", "2026-09-07", "2026-09-21"]);
    expect(weeks[1]?.avgWeight).toBe(65.9);
  });
});
