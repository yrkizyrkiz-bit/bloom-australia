/** Shared storage key — kept separate so callers can check without loading RECIPES. */
export function recipeFavouritesStorageKey(userId: string): string {
  return `wm-recipe-favourites:${userId}`;
}
