import { postFavoriteMeal } from "@/lib/weight-management/favorite-meals-client";
import type { PublicFavoriteMeal } from "@/lib/weight-management/favorite-meals";
import { legacyRecipeFavouritePayloads } from "@/lib/weight-management/recipe-favourites";
import { recipeFavouritesStorageKey } from "@/lib/weight-management/recipe-favourites-key";

/** In-memory guard so layout + hooks do not race the same migrate. */
const migratedUsers = new Set<string>();

export function resetLegacyRecipeFavouritesMigrationForTests() {
  migratedUsers.clear();
}

/**
 * One-way migrate: browser-only recipe hearts → FavoriteMeal rows.
 * Clears localStorage only after every payload is saved (or there is nothing left to save).
 * Safe to call from any WM surface; no-ops after the first successful pass per user.
 */
export async function ensureLegacyRecipeFavouritesMigrated(
  userId: string,
  current: PublicFavoriteMeal[]
): Promise<PublicFavoriteMeal[]> {
  if (!userId || migratedUsers.has(userId)) {
    return [];
  }
  if (typeof localStorage === "undefined") {
    return [];
  }

  const key = recipeFavouritesStorageKey(userId);
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return [];
  }

  if (!raw) {
    migratedUsers.add(userId);
    return [];
  }

  const payloads = legacyRecipeFavouritePayloads(
    raw,
    current.map((meal) => meal.name)
  );

  if (payloads.length === 0) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    migratedUsers.add(userId);
    return [];
  }

  const saved: PublicFavoriteMeal[] = [];
  let failed = 0;
  for (const payload of payloads) {
    const meal = await postFavoriteMeal(payload);
    if (meal) saved.push(meal);
    else failed += 1;
  }

  // Keep the legacy key if anything failed so the next visit can retry.
  if (failed === 0) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    migratedUsers.add(userId);
  }

  return saved;
}
