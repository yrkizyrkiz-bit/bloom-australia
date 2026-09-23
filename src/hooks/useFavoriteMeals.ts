"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteFavoriteMeal,
  fetchFavoriteMeals,
  postFavoriteMeal,
  type FavoriteMealWrite,
} from "@/lib/weight-management/favorite-meals-client";
import {
  matchesFavoriteName,
  type PublicFavoriteMeal,
} from "@/lib/weight-management/favorite-meals";

export function useFavoriteMeals() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<PublicFavoriteMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!user?.id) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const next = await fetchFavoriteMeals(signal);
        if (!signal?.aborted) setFavorites(next);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
        setFavorites([]);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    // Do not clear favourites to [] on every effect for the same user (avoids empty-list flash).
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [authLoading, user?.id, reload]);

  const isFavourite = useCallback(
    (name: string, mealType?: string) =>
      favorites.some(
        (meal) =>
          matchesFavoriteName(meal.name, name) && (!mealType || meal.mealType === mealType)
      ),
    [favorites]
  );

  const addFavourite = useCallback(
    async (payload: FavoriteMealWrite) => {
      const saved = await postFavoriteMeal(payload);
      if (saved) {
        setFavorites((current) => {
          const without = current.filter(
            (meal) =>
              !(matchesFavoriteName(meal.name, payload.name) && meal.mealType === payload.mealType)
          );
          return [saved, ...without];
        });
      }
      return Boolean(saved);
    },
    []
  );

  const removeFavourite = useCallback(
    async (name: string, mealType?: string) => {
      const matches = favorites.filter(
        (meal) =>
          matchesFavoriteName(meal.name, name) && (!mealType || meal.mealType === mealType)
      );
      if (matches.length === 0) return true;
      const results = await Promise.all(matches.map((meal) => deleteFavoriteMeal(meal.id)));
      if (results.every(Boolean)) {
        const removed = new Set(matches.map((meal) => meal.id));
        setFavorites((current) => current.filter((meal) => !removed.has(meal.id)));
        return true;
      }
      await reload();
      return false;
    },
    [favorites, reload]
  );

  const removeFavouriteById = useCallback(async (id: string) => {
    const ok = await deleteFavoriteMeal(id);
    if (ok) {
      setFavorites((current) => current.filter((meal) => meal.id !== id));
    }
    return ok;
  }, []);

  const toggleFavouriteMeal = useCallback(
    async (payload: FavoriteMealWrite) => {
      if (isFavourite(payload.name, payload.mealType)) {
        return removeFavourite(payload.name, payload.mealType);
      }
      return addFavourite(payload);
    },
    [addFavourite, isFavourite, removeFavourite]
  );

  return {
    favorites,
    loading,
    isFavourite,
    addFavourite,
    removeFavourite,
    removeFavouriteById,
    toggleFavouriteMeal,
    reload,
  };
}
