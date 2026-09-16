import { describe, expect, it } from "vitest";
import {
  AU_POPULATION_DEFAULTS,
  ageBandForYears,
  ageYearsFromDob,
  compareResultToPopulation,
} from "@/lib/au-population";
import { bandFromAbnormalHigh } from "@/lib/au-population/stats-math";

describe("Australian population age bands", () => {
  it("maps ages onto ABS NHMS groups", () => {
    expect(ageBandForYears(22)).toBe("18-24");
    expect(ageBandForYears(40)).toBe("35-44");
    expect(ageBandForYears(58)).toBe("55-64");
    expect(ageBandForYears(80)).toBe("75+");
  });

  it("computes age from date of birth", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 47);
    expect(ageYearsFromDob(dob.toISOString())).toBe(47);
  });

  it("derives a mean below 5.5 when fewer than half exceed the ABS high-cholesterol cut-off", () => {
    const band = bandFromAbnormalHigh(5.5, 25.1, 1.05);
    expect(band.mean).toBeLessThan(5.5);
    expect(band.absAbnormalPercent).toBe(25.1);
  });

  it("compares a heart marker using the member age band", () => {
    const young = compareResultToPopulation({
      dataset: AU_POPULATION_DEFAULTS,
      biomarkerId: "total_cholesterol",
      value: 5.2,
      sex: "male",
      ageBand: "18-24",
    });
    const midlife = compareResultToPopulation({
      dataset: AU_POPULATION_DEFAULTS,
      biomarkerId: "total_cholesterol",
      value: 5.2,
      sex: "male",
      ageBand: "45-54",
    });
    expect(young).toBeTruthy();
    expect(midlife).toBeTruthy();
    expect(young!.stats.mean).toBeLessThan(midlife!.stats.mean);
  });

  it("uses the official ABS HDL adult mean", () => {
    const hdl = compareResultToPopulation({
      dataset: AU_POPULATION_DEFAULTS,
      biomarkerId: "hdl_cholesterol",
      value: 1.3,
      sex: "male",
      ageBand: "45-54",
    });
    expect(hdl?.stats.mean).toBe(1.3);
    expect(hdl?.stats.quality).toBe("official");
  });
});
