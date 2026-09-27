import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postFavoriteMeal = vi.fn();

vi.mock("@/lib/weight-management/favorite-meals-client", () => ({
  postFavoriteMeal: (...args: unknown[]) => postFavoriteMeal(...args),
}));

import {
  ensureLegacyRecipeFavouritesMigrated,
  resetLegacyRecipeFavouritesMigrationForTests,
} from "@/lib/weight-management/migrate-legacy-recipe-favourites";
import { recipeFavouritesStorageKey } from "@/lib/weight-management/recipe-favourites";

describe("legacy recipe favourites migration", () => {
  const userId = "user-maria";
  const key = recipeFavouritesStorageKey(userId);
  const store = new Map<string, string>();

  beforeEach(() => {
    resetLegacyRecipeFavouritesMigrationForTests();
    postFavoriteMeal.mockReset();
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies leftover localStorage recipe hearts into FavoriteMeal and clears the key", async () => {
    store.set(key, '["b1","d1"]');
    postFavoriteMeal.mockImplementation(async (payload: { name: string; mealType: string }) => ({
      id: `id-${payload.name}`,
      name: payload.name,
      mealType: payload.mealType,
      calories: 1,
      protein: null,
      carbs: null,
      fat: null,
    }));

    const saved = await ensureLegacyRecipeFavouritesMigrated(userId, []);
    expect(saved.map((m) => m.name).sort()).toEqual([
      "Greek Yogurt Parfait",
      "Grilled Salmon with Asparagus",
    ]);
    expect(store.has(key)).toBe(false);

    // Second call is a no-op (already migrated).
    postFavoriteMeal.mockClear();
    store.set(key, '["b2"]');
    const again = await ensureLegacyRecipeFavouritesMigrated(userId, []);
    expect(again).toEqual([]);
    expect(postFavoriteMeal).not.toHaveBeenCalled();
  });

  it("keeps localStorage when a save fails so the next visit can retry", async () => {
    store.set(key, '["b1"]');
    postFavoriteMeal.mockResolvedValue(null);

    const saved = await ensureLegacyRecipeFavouritesMigrated(userId, []);
    expect(saved).toEqual([]);
    expect(store.get(key)).toBe('["b1"]');

    postFavoriteMeal.mockResolvedValue({
      id: "fav-1",
      name: "Greek Yogurt Parfait",
      mealType: "BREAKFAST",
      calories: 250,
      protein: null,
      carbs: null,
      fat: null,
    });
    const retried = await ensureLegacyRecipeFavouritesMigrated(userId, []);
    expect(retried).toHaveLength(1);
    expect(store.has(key)).toBe(false);
  });

  it("does not re-post meals already on the server", async () => {
    store.set(key, '["b1"]');
    const saved = await ensureLegacyRecipeFavouritesMigrated(userId, [
      {
        id: "existing",
        name: "Greek Yogurt Parfait",
        mealType: "BREAKFAST",
        calories: 250,
        protein: null,
        carbs: null,
        fat: null,
      },
    ]);
    expect(saved).toEqual([]);
    expect(postFavoriteMeal).not.toHaveBeenCalled();
    expect(store.has(key)).toBe(false);
  });
});
