import { describe, expect, it } from "vitest";
import {
  calendarDayBounds,
  mergeDailyLogFields,
} from "@/lib/weight-management/daily-weight-log";

describe("calendarDayBounds", () => {
  it("covers the local calendar day", () => {
    const { start, end } = calendarDayBounds(new Date(2026, 8, 4, 18, 30, 0));
    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(4);
    expect(end.getTime()).toBe(start.getTime() + 24 * 60 * 60 * 1000);
  });
});

describe("mergeDailyLogFields", () => {
  const today = {
    weight: 83,
    waistCircumference: 90,
    notes: null as string | null,
  };

  it("amends weight on today's entry and keeps waist", () => {
    expect(mergeDailyLogFields(today, 82, { weight: 82.5 })).toEqual({
      weight: 82.5,
      waistCircumference: 90,
      notes: null,
    });
  });

  it("amends waist on today's entry and keeps weight", () => {
    expect(mergeDailyLogFields(today, 82, { waistCircumference: 91 })).toEqual({
      weight: 83,
      waistCircumference: 91,
      notes: null,
    });
  });

  it("creates a new day from weight only without copying yesterday's waist", () => {
    expect(mergeDailyLogFields(null, 83, { weight: 82.4 })).toEqual({
      weight: 82.4,
      waistCircumference: null,
      notes: null,
    });
  });

  it("creates a new day from waist using the last known weight", () => {
    expect(mergeDailyLogFields(null, 83, { waistCircumference: 88 })).toEqual({
      weight: 83,
      waistCircumference: 88,
      notes: null,
    });
  });

  it("returns null when waist is saved with no weight history", () => {
    expect(mergeDailyLogFields(null, null, { waistCircumference: 88 })).toBeNull();
  });
});
