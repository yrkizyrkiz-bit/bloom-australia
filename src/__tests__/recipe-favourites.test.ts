import { describe, expect, it, vi } from "vitest";
import {
  legacyRecipeFavouritePayloads,
  parseRecipeFavouriteIds,
} from "@/lib/weight-management/recipe-favourites";
import { recipeFavouritesStorageKey } from "@/lib/weight-management/recipe-favourites-key";
import { hasLegacyRecipeFavourites } from "@/lib/weight-management/has-legacy-recipe-favourites";

describe("recipe favourites storage", () => {
  it("scopes the storage key to the member", () => {
    expect(recipeFavouritesStorageKey("user-1")).toBe("wm-recipe-favourites:user-1");
  });

  it("detects legacy localStorage without loading migrate payloads", () => {
    const key = recipeFavouritesStorageKey("user-1");
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(hasLegacyRecipeFavourites("user-1")).toBe(false);
    store.set(key, "[]");
    expect(hasLegacyRecipeFavourites("user-1")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("parses favourite recipe ids", () => {
    expect(parseRecipeFavouriteIds(null)).toEqual([]);
    expect(parseRecipeFavouriteIds('["b1","d13"]')).toEqual(["b1", "d13"]);
    expect(parseRecipeFavouriteIds("[1, \"b1\"]")).toEqual(["b1"]);
    expect(parseRecipeFavouriteIds("not-json")).toEqual([]);
  });

  it("builds FavoriteMeal payloads from legacy localStorage ids", () => {
    const payloads = legacyRecipeFavouritePayloads('["b1","missing","d1"]', [
      "Grilled Salmon with Asparagus",
    ]);
    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.name).toBe("Greek Yogurt Parfait");
    expect(payloads[0]?.mealType).toBe("BREAKFAST");
  });
});
