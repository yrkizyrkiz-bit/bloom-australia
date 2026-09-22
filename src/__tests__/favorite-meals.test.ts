import { describe, expect, it } from "vitest";
import {
  favoriteMealOwnerWhere,
  favoriteNameKey,
  matchesFavoriteName,
  normalizeFavoriteMeal,
  toPublicFavoriteMeal,
} from "@/lib/weight-management/favorite-meals";
import { recipeToFavoriteMeal } from "@/lib/weight-management/recipe-catalog";

describe("favorite meals", () => {
  it("normalises a custom meal for favourites", () => {
    expect(
      normalizeFavoriteMeal({
        name: "  Homemade pasta  ",
        mealType: "LUNCH",
        calories: "450",
        protein: "22.25",
        carbs: "48",
        fat: "12.1",
      })
    ).toEqual({
      name: "Homemade pasta",
      nameKey: "homemade pasta",
      mealType: "LUNCH",
      calories: 450,
      protein: 22.3,
      carbs: 48,
      fat: 12.1,
    });
  });

  it("rejects a meal without a name or type", () => {
    expect(normalizeFavoriteMeal({ name: "Eggs", mealType: "brunch" })).toBeNull();
    expect(normalizeFavoriteMeal({ name: "   ", mealType: "BREAKFAST" })).toBeNull();
  });

  it("ignores a client-supplied owner id when normalising", () => {
    const meal = normalizeFavoriteMeal({
      name: "Eggs",
      mealType: "BREAKFAST",
      userId: "someone-else",
    } as { name: string; mealType: string; userId: string });
    expect(meal).toMatchObject({ name: "Eggs", mealType: "BREAKFAST" });
    expect(meal).not.toHaveProperty("userId");
  });

  it("scopes favourite queries to the signed-in member only", () => {
    expect(favoriteMealOwnerWhere("user-a")).toEqual({ userId: "user-a" });
    expect(favoriteMealOwnerWhere("user-a", "fav-1")).toEqual({
      id: "fav-1",
      userId: "user-a",
    });
  });

  it("strips owner id from favourite payloads sent to the client", () => {
    const stored = {
      id: "fav-1",
      name: "Eggs",
      mealType: "BREAKFAST",
      calories: 150,
      protein: 12,
      carbs: 1,
      fat: 10,
      userId: "user-a",
    };
    expect(toPublicFavoriteMeal(stored)).toEqual({
      id: "fav-1",
      name: "Eggs",
      mealType: "BREAKFAST",
      calories: 150,
      protein: 12,
      carbs: 1,
      fat: 10,
    });
  });

  it("matches favourite names regardless of spacing or case", () => {
    expect(favoriteNameKey("  Greek  Yogurt  ")).toBe("greek yogurt");
    expect(matchesFavoriteName("Greek Yogurt Parfait", "greek yogurt parfait")).toBe(true);
  });

  it("maps a catalog recipe onto the diary favourite payload", () => {
    expect(
      recipeToFavoriteMeal({
        title: "Overnight Oats",
        mealType: "BREAKFAST",
        calories: 320,
        protein: 12,
        carbs: 48,
        fat: 8,
      })
    ).toEqual({
      name: "Overnight Oats",
      mealType: "BREAKFAST",
      calories: 320,
      protein: 12,
      carbs: 48,
      fat: 8,
    });
    expect(
      recipeToFavoriteMeal(
        {
          title: "Berry Bowl",
          mealType: "SNACK",
          calories: 180,
          protein: 6,
          carbs: 22,
          fat: 5,
        },
        "MORNING_SNACK"
      ).mealType
    ).toBe("MORNING_SNACK");
  });
});
