import { recipeFavouritesStorageKey } from "@/lib/weight-management/recipe-favourites-key";

/** Sync, allocation-free check — does not import the recipe catalog. */
export function hasLegacyRecipeFavourites(userId: string): boolean {
  if (!userId || typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(recipeFavouritesStorageKey(userId)) != null;
  } catch {
    return false;
  }
}
