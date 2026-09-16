import { describe, expect, it } from "vitest";
import {
  getHigherIsBetter,
  isClinicallyImproved,
} from "@/lib/biomarker-clinical-trend";
import type { BiomarkerRange } from "@/types";

const altMale: BiomarkerRange = {
  low: 0,
  optimal_low: 0,
  optimal_high: 51,
  high: 100,
  unit: "U/L",
};

describe("biomarker clinical trend", () => {
  it("treats ALT as lower-is-better", () => {
    expect(getHigherIsBetter("alt", altMale)).toBe(false);
  });

  it("counts a small ALT drop inside optimal as improved", () => {
    expect(isClinicallyImproved(26, 27, altMale, false)).toBe(true);
  });

  it("counts a small ALT rise inside optimal as a decline", () => {
    expect(isClinicallyImproved(27, 26, altMale, false)).toBe(false);
  });

  it("treats HDL as higher-is-better", () => {
    expect(getHigherIsBetter("hdl_cholesterol")).toBe(true);
  });
});
