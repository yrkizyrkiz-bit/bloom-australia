import { describe, expect, it } from "vitest";
import { generateDoseDates, parseDoseIntervalDays } from "@/lib/program/dose-schedule";
import {
  buildScheduleChangeLines,
  buildScheduleChangeNote,
  normalizeDosingFrequency,
  parseUtcDateOnly,
  planPendingDoseDates,
  resolveDoseSeriesStart,
  toUtcDateInput,
} from "@/lib/program/member-schedule";

describe("member schedule dates", () => {
  it("round-trips calendar days as UTC date-only values", () => {
    const parsed = parseUtcDateOnly("2026-09-10");
    expect(parsed?.toISOString()).toBe("2026-09-10T00:00:00.000Z");
    expect(toUtcDateInput(parsed)).toBe("2026-09-10");
  });

  it("uses next dose as the series start when no doses have been taken and next changed", () => {
    const start = resolveDoseSeriesStart({
      hasTakenDoses: false,
      firstDoseDate: parseUtcDateOnly("2026-09-10"),
      nextDoseDate: parseUtcDateOnly("2026-09-17"),
      firstChanged: false,
      nextChanged: true,
    });
    expect(toUtcDateInput(start)).toBe("2026-09-17");
  });

  it("keeps next dose as the remaining-series start after doses have been taken", () => {
    const start = resolveDoseSeriesStart({
      hasTakenDoses: true,
      firstDoseDate: parseUtcDateOnly("2026-09-03"),
      nextDoseDate: parseUtcDateOnly("2026-09-17"),
      firstChanged: true,
      nextChanged: false,
    });
    expect(toUtcDateInput(start)).toBe("2026-09-17");
  });

  it("adds weekly UTC calendar days without local-timezone drift", () => {
    const start = parseUtcDateOnly("2026-09-17")!;
    expect(generateDoseDates(start, 7, 3).map(toUtcDateInput)).toEqual([
      "2026-09-17",
      "2026-09-24",
      "2026-10-01",
    ]);
  });

  it("rebuilds weekly remaining doses from the new next date", () => {
    const dates = planPendingDoseDates({
      hasTakenDoses: true,
      seriesStart: parseUtcDateOnly("2026-09-17")!,
      intervalDays: parseDoseIntervalDays("Once weekly"),
      pendingCount: 3,
    });
    expect(dates.map(toUtcDateInput)).toEqual(["2026-09-17", "2026-09-24", "2026-10-01"]);
  });

  it("normalizes stored dosing aliases to the admin dropdown values", () => {
    expect(normalizeDosingFrequency("once_weekly")).toBe("Once weekly");
    expect(normalizeDosingFrequency("Every 2 weeks")).toBe("Every 2 weeks");
  });

  it("parses fortnightly dosing before weekly", () => {
    expect(parseDoseIntervalDays("Every 2 weeks")).toBe(14);
    expect(parseDoseIntervalDays("Once weekly")).toBe(7);
    expect(parseDoseIntervalDays("Every other day")).toBe(2);
  });

  it("writes a notes history line with the staff member who saved", () => {
    const lines = buildScheduleChangeLines([
      { label: "Next dose scheduled", from: "10 September 2026", to: "17 September 2026" },
      { label: "Dosing", from: "Once weekly", to: "Every 2 weeks" },
    ]);
    const note = buildScheduleChangeNote({
      actorName: "Alex Admin",
      actorRole: "ADMIN",
      lines,
      regeneratedDoses: true,
    });
    expect(note).toContain("Alex Admin (ADMIN)");
    expect(note).toContain("Next dose scheduled: 10 September 2026 → 17 September 2026");
    expect(note).toContain("Remaining untaken doses were regenerated");
  });
});
