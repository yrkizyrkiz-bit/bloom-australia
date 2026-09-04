import { describe, expect, it } from "vitest";
import { getMealImage } from "@/data/mealImages";

describe("getMealImage", () => {
  it("matches a known salmon phrase to the salmon photo", () => {
    const src = getMealImage("Grilled Salmon with Vegetables", "DINNER");
    expect(src).toContain("photo-1467003909585-2f8a72700288");
  });

  it("does not use avocado toast for salmon", () => {
    const src = getMealImage("Grilled Salmon", "BREAKFAST");
    expect(src).not.toContain("photo-1525351484163-7529414344d8");
  });

  it("returns no photo for an unknown meal instead of a type default", () => {
    expect(getMealImage("Banana Pancakes", "BREAKFAST")).toBeNull();
    expect(getMealImage("Edamame", "AFTERNOON_SNACK")).toBeNull();
  });
});
