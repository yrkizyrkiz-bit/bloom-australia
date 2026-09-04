import { describe, expect, it } from "vitest";
import { hasReachedNumericTarget } from "@/lib/goal-display";

describe("hasReachedNumericTarget", () => {
  it("requires current weight at or below a loss target", () => {
    expect(hasReachedNumericTarget(110, 85, 120)).toBe(false);
    expect(hasReachedNumericTarget(85, 85, 120)).toBe(true);
    expect(hasReachedNumericTarget(84.2, 85, 120)).toBe(true);
  });

  it("requires current value at or above a gain target", () => {
    expect(hasReachedNumericTarget(68, 72, 64)).toBe(false);
    expect(hasReachedNumericTarget(72, 72, 64)).toBe(true);
  });
});
