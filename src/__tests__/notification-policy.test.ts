import { describe, expect, it } from "vitest";
import {
  allowsEmail,
  allowsNotification,
  extraDailyCap,
  normaliseFrequency,
} from "@/lib/notifications/policy";

describe("allowsNotification", () => {
  it("always sends results, a program step, and a care-team message", () => {
    for (const frequency of ["QUIET", "STANDARD", "CLOSER"] as const) {
      expect(allowsNotification({ frequency, dailyTrackingPing: false, intent: "RESULTS_READY" })).toBe(true);
      expect(allowsNotification({ frequency, dailyTrackingPing: false, intent: "PROGRAM_STEP" })).toBe(true);
      expect(allowsNotification({ frequency, dailyTrackingPing: false, intent: "CARE_MESSAGE" })).toBe(true);
    }
  });

  it("keeps the daily ring, meal, or weigh-in ping on its own switch", () => {
    expect(allowsNotification({ frequency: "QUIET", dailyTrackingPing: true, intent: "DAILY_TRACKING" })).toBe(true);
    expect(allowsNotification({ frequency: "CLOSER", dailyTrackingPing: false, intent: "DAILY_TRACKING" })).toBe(false);
  });

  it("gives Quiet only decision items", () => {
    expect(allowsNotification({ frequency: "QUIET", dailyTrackingPing: false, intent: "DUE_TODAY" })).toBe(false);
    expect(allowsNotification({ frequency: "QUIET", dailyTrackingPing: false, intent: "WEEKLY_NOTE" })).toBe(false);
    expect(allowsNotification({ frequency: "QUIET", dailyTrackingPing: false, intent: "MIDWEEK_NUDGE" })).toBe(false);
    expect(allowsNotification({ frequency: "QUIET", dailyTrackingPing: false, intent: "RETEST" })).toBe(false);
  });

  it("adds the weekly note and a due reminder on Standard", () => {
    expect(allowsNotification({ frequency: "STANDARD", dailyTrackingPing: false, intent: "WEEKLY_NOTE" })).toBe(true);
    expect(allowsNotification({ frequency: "STANDARD", dailyTrackingPing: false, intent: "DUE_TODAY" })).toBe(true);
    expect(allowsNotification({ frequency: "STANDARD", dailyTrackingPing: false, intent: "MIDWEEK_NUDGE" })).toBe(false);
    expect(allowsNotification({ frequency: "STANDARD", dailyTrackingPing: false, intent: "RETEST" })).toBe(false);
  });

  it("adds the mid-week nudge and a standalone retest on Closer", () => {
    expect(allowsNotification({ frequency: "CLOSER", dailyTrackingPing: false, intent: "MIDWEEK_NUDGE" })).toBe(true);
    expect(allowsNotification({ frequency: "CLOSER", dailyTrackingPing: false, intent: "RETEST" })).toBe(true);
  });
});

describe("allowsEmail", () => {
  it("emails decision items and the weekly note, not the daily ping", () => {
    expect(allowsEmail("QUIET", "RESULTS_READY")).toBe(true);
    expect(allowsEmail("STANDARD", "WEEKLY_NOTE")).toBe(true);
    expect(allowsEmail("QUIET", "WEEKLY_NOTE")).toBe(false);
    expect(allowsEmail("CLOSER", "DAILY_TRACKING")).toBe(false);
    expect(allowsEmail("STANDARD", "DUE_TODAY")).toBe(false);
  });
});

describe("extraDailyCap", () => {
  it("caps non-urgent extras at one on Standard and two on Closer", () => {
    expect(extraDailyCap("QUIET")).toBe(0);
    expect(extraDailyCap("STANDARD")).toBe(1);
    expect(extraDailyCap("CLOSER")).toBe(2);
    expect(normaliseFrequency("nope")).toBe("STANDARD");
  });
});
