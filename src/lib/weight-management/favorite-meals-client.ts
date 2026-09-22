import type { PublicFavoriteMeal } from "@/lib/weight-management/favorite-meals";

export type FavoriteMealWrite = {
  name: string;
  mealType: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export async function fetchFavoriteMeals(signal?: AbortSignal): Promise<PublicFavoriteMeal[]> {
  const res = await fetch("/api/weight-management/favorite-meals", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return Array.isArray(payload.favorites) ? payload.favorites : [];
}

export async function postFavoriteMeal(payload: FavoriteMealWrite): Promise<PublicFavoriteMeal | null> {
  const res = await fetch("/api/weight-management/favorite-meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteFavoriteMeal(id: string): Promise<boolean> {
  const res = await fetch(`/api/weight-management/favorite-meals?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
    cache: "no-store",
  });
  return res.ok;
}
