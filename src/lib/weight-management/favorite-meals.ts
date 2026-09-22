export const FAVORITE_MEAL_TYPES = [
  "BREAKFAST",
  "MORNING_SNACK",
  "LUNCH",
  "AFTERNOON_SNACK",
  "DINNER",
  "EVENING_SNACK",
] as const;

export type FavoriteMealType = (typeof FAVORITE_MEAL_TYPES)[number];

export type FavoriteMealInput = {
  name?: unknown;
  mealType?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
};

export type FavoriteMealPayload = {
  name: string;
  nameKey: string;
  mealType: FavoriteMealType;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export type PublicFavoriteMeal = {
  id: string;
  name: string;
  mealType: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export function favoriteMealOwnerWhere(userId: string, id?: string) {
  return id ? { id, userId } : { userId };
}

export function toPublicFavoriteMeal(meal: {
  id: string;
  name: string;
  mealType: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}): PublicFavoriteMeal {
  return {
    id: meal.id,
    name: meal.name,
    mealType: meal.mealType,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  };
}

function optionalNumber(value: unknown, integer = false): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return integer ? Math.round(parsed) : Math.round(parsed * 10) / 10;
}

export function isFavoriteMealType(value: unknown): value is FavoriteMealType {
  return typeof value === "string" && FAVORITE_MEAL_TYPES.includes(value as FavoriteMealType);
}

export function favoriteNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function matchesFavoriteName(favoriteName: string, name: string): boolean {
  return favoriteNameKey(favoriteName) === favoriteNameKey(name);
}

export function normalizeFavoriteMeal(input: FavoriteMealInput): FavoriteMealPayload | null {
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!name || !isFavoriteMealType(input.mealType)) return null;
  return {
    name,
    nameKey: favoriteNameKey(name),
    mealType: input.mealType,
    calories: optionalNumber(input.calories, true),
    protein: optionalNumber(input.protein),
    carbs: optionalNumber(input.carbs),
    fat: optionalNumber(input.fat),
  };
}
