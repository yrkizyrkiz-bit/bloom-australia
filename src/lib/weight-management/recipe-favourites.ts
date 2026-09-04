export function recipeFavouritesStorageKey(userId: string): string {
  return `wm-recipe-favourites:${userId}`;
}

export function parseRecipeFavouriteIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
