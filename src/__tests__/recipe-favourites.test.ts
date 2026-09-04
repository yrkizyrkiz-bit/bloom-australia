import { describe, expect, it } from "vitest";
import {
  parseRecipeFavouriteIds,
  recipeFavouritesStorageKey,
} from "@/lib/weight-management/recipe-favourites";

describe("recipe favourites storage", () => {
  it("scopes the storage key to the member", () => {
    expect(recipeFavouritesStorageKey("user-1")).toBe("wm-recipe-favourites:user-1");
  });

  it("parses favourite recipe ids", () => {
    expect(parseRecipeFavouriteIds(null)).toEqual([]);
    expect(parseRecipeFavouriteIds('["b1","d13"]')).toEqual(["b1", "d13"]);
    expect(parseRecipeFavouriteIds("[1, \"b1\"]")).toEqual(["b1"]);
    expect(parseRecipeFavouriteIds("not-json")).toEqual([]);
  });
});
