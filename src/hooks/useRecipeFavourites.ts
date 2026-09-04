"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  parseRecipeFavouriteIds,
  recipeFavouritesStorageKey,
} from "@/lib/weight-management/recipe-favourites";

export function useRecipeFavourites() {
  const { user, isLoading: authLoading } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [favouritesUserId, setFavouritesUserId] = useState<string | null>(null);

  const loadFavourites = useCallback((userId: string) => {
    try {
      const raw = localStorage.getItem(recipeFavouritesStorageKey(userId));
      setSavedRecipes(new Set(parseRecipeFavouriteIds(raw)));
    } catch {
      setSavedRecipes(new Set());
    }
    setFavouritesUserId(userId);
  }, []);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    setFavouritesUserId(null);
    loadFavourites(user.id);
  }, [user?.id, authLoading, loadFavourites]);

  useEffect(() => {
    if (!user?.id || favouritesUserId !== user.id) return;
    localStorage.setItem(recipeFavouritesStorageKey(user.id), JSON.stringify([...savedRecipes]));
  }, [savedRecipes, favouritesUserId, user?.id]);

  const toggleFavourite = useCallback((recipeId: string) => {
    setSavedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  }, []);

  return {
    savedRecipes,
    toggleFavourite,
    loadFavourites,
    userId: user?.id ?? null,
  };
}
