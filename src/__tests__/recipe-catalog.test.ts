import { describe, expect, it } from "vitest";
import { RECIPES } from "@/data/recipes";
import { RECIPE_DETAILS } from "@/data/recipeDetails";
import {
  RECIPE_CATALOG,
  dedupeRecipes,
  hydrateRecipe,
  normalizeRecipeTitle,
} from "@/lib/weight-management/recipe-catalog";

describe("recipe catalog", () => {
  it("includes every unique recipe from the recipes database", () => {
    expect(RECIPE_CATALOG.length).toBe(dedupeRecipes(RECIPES).length);
    expect(RECIPE_CATALOG.length).toBe(RECIPES.length);
    expect(new Set(RECIPE_CATALOG.map((recipe) => recipe.id)).size).toBe(RECIPES.length);
  });

  it("hydrates ingredients and instructions from recipe details when present", () => {
    const parfait = hydrateRecipe(RECIPES.find((recipe) => recipe.id === "b1")!);
    expect(parfait.category).toBe("Breakfast");
    expect(parfait.ingredients.length).toBeGreaterThan(0);
    expect(parfait.instructions.length).toBeGreaterThan(0);
    expect(parfait.protein).toBeGreaterThan(0);
  });

  it("gives every recipe ingredients and instructions", () => {
    const incomplete = RECIPE_CATALOG.filter(
      (recipe) => recipe.ingredients.length === 0 || recipe.instructions.length === 0
    ).map((recipe) => recipe.title);
    expect(incomplete).toEqual([]);
  });

  it("includes baked-cod ingredients that match the dish", () => {
    const cod = RECIPE_CATALOG.find((recipe) => recipe.id === "d13");
    expect(cod?.title).toBe("Baked Cod with Vegetables");
    expect(cod?.ingredients.join(" ").toLowerCase()).toMatch(/cod/);
    expect(cod?.ingredients.join(" ").toLowerCase()).toMatch(/tomato/);
    expect(cod?.ingredients.join(" ").toLowerCase()).toMatch(/olive/);
    expect(cod?.ingredients.join(" ").toLowerCase()).toMatch(/caper/);
    expect(cod?.instructions.length).toBeGreaterThan(3);
  });

  it("has matching recipe-detail entries for every catalog recipe", () => {
    const missing = RECIPE_CATALOG.filter((recipe) => !RECIPE_DETAILS[recipe.id]).map(
      (recipe) => recipe.id
    );
    expect(missing).toEqual([]);
    expect(Object.keys(RECIPE_DETAILS)).toHaveLength(RECIPES.length);
  });

  it("normalizes titles for duplicate checks", () => {
    expect(normalizeRecipeTitle("Hummus & Veggie Sticks")).toBe("hummus and veggie sticks");
    expect(normalizeRecipeTitle("Fresh Fruit Plate")).not.toBe(normalizeRecipeTitle("Herb Roasted Chicken"));
  });
});
