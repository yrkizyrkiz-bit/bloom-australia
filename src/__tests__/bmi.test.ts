import { describe, expect, it } from "vitest";
import { calculateBmi, formatBmi, resolveBmi, roundBmi, roundToOneDecimal } from "@/lib/bmi";

describe("roundToOneDecimal", () => {
  it("rounds half up to one decimal", () => {
    expect(roundToOneDecimal(21.65)).toBe(21.7);
    expect(roundToOneDecimal(21.64)).toBe(21.6);
    expect(roundToOneDecimal(24.22145328719723)).toBe(24.2);
  });
});

describe("calculateBmi", () => {
  it("returns BMI rounded to one decimal from kg and cm", () => {
    expect(calculateBmi(70, 170)).toBe(24.2);
    expect(calculateBmi("62.6", "170")).toBe(21.7);
  });

  it("accepts height already in metres", () => {
    expect(calculateBmi(70, 1.7)).toBe(24.2);
  });

  it("returns null for missing or invalid inputs", () => {
    expect(calculateBmi(70, 0)).toBeNull();
    expect(calculateBmi(0, 170)).toBeNull();
    expect(calculateBmi("", "170")).toBeNull();
    expect(calculateBmi(70, "not-a-height")).toBeNull();
  });
});

describe("roundBmi / formatBmi / resolveBmi", () => {
  it("rounds a stored unrounded BMI for display", () => {
    expect(roundBmi(21.65626581211)).toBe(21.7);
    expect(formatBmi(21.65626581211)).toBe("21.7");
    expect(formatBmi(null)).toBe("N/A");
  });

  it("prefers a fresh calculation over a stored value", () => {
    expect(
      resolveBmi({
        storedBmi: 2.165626581211,
        weightKg: 70,
        heightCm: 170,
      })
    ).toBe(24.2);
  });

  it("falls back to a rounded stored BMI when measurements are missing", () => {
    expect(resolveBmi({ storedBmi: 21.65626581211 })).toBe(21.7);
  });
});
