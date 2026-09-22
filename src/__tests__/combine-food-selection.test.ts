import { describe, expect, it } from "vitest";
import { combineFoodSelection, formatFoodLine } from "@/lib/weight-management/combine-food-selection";

describe("combine food selection", () => {
  it("omits 1x from a single serving line", () => {
    expect(formatFoodLine("Eggs", 1)).toBe("Eggs");
    expect(formatFoodLine("Toast", 2)).toBe("Toast (2x)");
  });

  it("joins selected foods into one meal", () => {
    expect(
      combineFoodSelection([
        { name: "Eggs", portion: 2, calories: 180, protein: 12, carbs: 1, fat: 10 },
        { name: "Toast", portion: 1, calories: 80, protein: 3, carbs: 14, fat: 1 },
      ])
    ).toEqual({
      name: "Eggs (2x), Toast",
      lines: "Eggs (2x)\nToast",
      calories: 260,
      protein: 15,
      carbs: 15,
      fat: 11,
    });
  });
});
