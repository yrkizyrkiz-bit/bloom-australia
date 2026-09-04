import { RECIPES, type Recipe } from "@/data/recipes";
import { RECIPE_DETAILS } from "@/data/recipeDetails";

export type RecipeCategory = "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "Desserts";

export type CatalogRecipe = Recipe & {
  ingredients: string[];
  instructions: string[];
  tips?: string[];
  category: RecipeCategory;
};

export const RECIPE_CATEGORY_BY_MEAL_TYPE: Record<Recipe["mealType"], RecipeCategory> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
  DESSERT: "Desserts",
};

export const RECIPE_TO_DIARY_MEAL_TYPE: Record<Recipe["mealType"], string> = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "AFTERNOON_SNACK",
  DESSERT: "AFTERNOON_SNACK",
};

export function normalizeRecipeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function hydrateRecipe(recipe: Recipe): CatalogRecipe {
  const details = RECIPE_DETAILS[recipe.id];
  return {
    ...recipe,
    ingredients: details?.ingredients?.length ? details.ingredients : recipe.ingredients ?? [],
    instructions: details?.instructions?.length ? details.instructions : recipe.instructions ?? [],
    tips: details?.tips,
    category: RECIPE_CATEGORY_BY_MEAL_TYPE[recipe.mealType],
  };
}

export function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>();
  const unique: Recipe[] = [];
  for (const recipe of recipes) {
    const key = normalizeRecipeTitle(recipe.title);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(recipe);
  }
  return unique;
}

export const RECIPE_CATALOG: CatalogRecipe[] = dedupeRecipes(RECIPES).map(hydrateRecipe);
