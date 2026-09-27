/**
 * Legacy browser-only recipe hearts (pre–FavoriteMeal, Sep 2026).
 * Read-only helpers for one-way migrate into the server FavoriteMeal table.
 * Do not write to this localStorage key again — favourites are persisted via /api/weight-management/favorite-meals.
 */
import { RECIPES } from "@/data/recipes";
import { recipeToFavoriteMeal } from "@/lib/weight-management/recipe-catalog";
import type { FavoriteMealWrite } from "@/lib/weight-management/favorite-meals-client";
import { matchesFavoriteName } from "@/lib/weight-management/favorite-meals";

export { recipeFavouritesStorageKey } from "@/lib/weight-management/recipe-favourites-key";
export { hasLegacyRecipeFavourites } from "@/lib/weight-management/has-legacy-recipe-favourites";

export function parseRecipeFavouriteIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Payloads for recipe ids still sitting in pre–FavoriteMeal localStorage. */
export function legacyRecipeFavouritePayloads(
  raw: string | null,
  alreadySavedNames: string[] = []
): FavoriteMealWrite[] {
  const ids = parseRecipeFavouriteIds(raw);
  if (ids.length === 0) return [];
  const byId = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
  const payloads: FavoriteMealWrite[] = [];
  for (const id of ids) {
    const recipe = byId.get(id);
    if (!recipe) continue;
    if (alreadySavedNames.some((name) => matchesFavoriteName(name, recipe.title))) continue;
    payloads.push(recipeToFavoriteMeal(recipe));
  }
  return payloads;
}
