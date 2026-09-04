import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECTION_MONTHS,
  averageDailyWeightLossKg,
  formatAverageDailyLoss,
  getWeightLossCurveParams,
  monthAxisTicks,
  monthsBetween,
  monthsFromStart,
  programHorizonMonths,
  projectedWeightAt,
  smoothSvgPath,
} from "@/lib/weight-management/journey-projection";

describe("getWeightLossCurveParams", () => {
  it("starts at the current weight and approaches the target by the goal month", () => {
    const start = 90;
    const target = 75;
    const { k, goalMonths, weightLoss } = getWeightLossCurveParams(start, target);
    expect(goalMonths).toBe(DEFAULT_PROJECTION_MONTHS);
    expect(weightLoss).toBe(15);
    expect(projectedWeightAt(start, target, 0, k)).toBeCloseTo(start, 5);
    expect(projectedWeightAt(start, target, goalMonths, k)).toBeCloseTo(target + (start - target) * 0.05, 5);
  });
});

describe("programHorizonMonths", () => {
  it("uses six months when no target date is set", () => {
    expect(programHorizonMonths(new Date("2026-03-04"), null)).toBe(6);
  });

  it("reads the goal window from start to target date", () => {
    expect(programHorizonMonths(new Date("2026-03-04"), new Date("2026-09-04"))).toBeCloseTo(6, 1);
  });
});

describe("monthsFromStart", () => {
  it("clamps progress onto the program axis", () => {
    const start = new Date("2026-01-01");
    expect(monthsFromStart(start, new Date("2026-01-01"), 6)).toBe(0);
    expect(monthsFromStart(start, new Date("2026-04-01"), 6)).toBeCloseTo(3, 1);
    expect(monthsFromStart(start, new Date("2027-01-01"), 6)).toBe(6);
  });
});

describe("monthAxisTicks", () => {
  it("marks now, mid, and goal on a six-month sketch", () => {
    expect(monthAxisTicks(6)).toEqual([0, 3, 6]);
  });
});

describe("smoothSvgPath", () => {
  it("builds a curve from plotted points", () => {
    expect(smoothSvgPath([])).toBe("");
    expect(smoothSvgPath([{ x: 0, y: 10 }, { x: 20, y: 30 }])).toBe("M0.00,10.00 L20.00,30.00");
    expect(smoothSvgPath([{ x: 0, y: 10 }, { x: 20, y: 30 }, { x: 40, y: 18 }])).toContain("C");
  });
});

describe("monthsBetween", () => {
  it("counts about six months from January to July", () => {
    const months = monthsBetween(new Date("2026-01-01"), new Date("2026-07-01"));
    expect(months).toBeGreaterThan(5.9);
    expect(months).toBeLessThan(6.1);
  });
});

describe("averageDailyWeightLossKg", () => {
  it("divides kg lost by calendar days since start", () => {
    expect(
      averageDailyWeightLossKg(3.2, "2026-09-01T00:00:00.000Z", new Date(2026, 8, 4))
    ).toBeCloseTo(1.07, 2);
  });

  it("treats the start day as one day so the rate is never infinite", () => {
    expect(
      averageDailyWeightLossKg(0.4, "2026-09-04T08:00:00.000Z", new Date(2026, 8, 4, 18))
    ).toBe(0.4);
  });

  it("does not count weight gain as daily loss", () => {
    expect(
      averageDailyWeightLossKg(-1.2, "2026-08-01T00:00:00.000Z", new Date(2026, 8, 4))
    ).toBe(0);
  });
});

describe("formatAverageDailyLoss", () => {
  it("uses two decimals for sub-kilo daily rates", () => {
    expect(formatAverageDailyLoss(0.12)).toBe("0.12 kg/day avg");
    expect(formatAverageDailyLoss(0)).toBe("0 kg/day avg");
    expect(formatAverageDailyLoss(1.25)).toBe("1.3 kg/day avg");
  });
});
