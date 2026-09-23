"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, Apple, Coffee, Sun, Moon, Loader2, Trash2, Flame,
  Search, X, Sparkles, Utensils, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Heart,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Recipe } from "@/data/recipes";
import type { CombinedFoodMeal } from "@/components/weight-management/FoodSearchDialog";
import { getMealImage, getRandomMotivation } from "@/data/mealImages";
import { useAuth } from "@/contexts/AuthContext";
import { matchesFavoriteName } from "@/lib/weight-management/favorite-meals";

const FoodSearchDialog = dynamic(
  () =>
    import("@/components/weight-management/FoodSearchDialog").then(
      (mod) => mod.FoodSearchDialog
    ),
  {
    ssr: false,
    loading: () => (
      <Button type="button" variant="outline" className="w-full gap-2" disabled>
        <Search className="h-4 w-4" /> Search our food database
      </Button>
    ),
  }
);

const MealGallery = dynamic(
  () =>
    import("@/components/weight-management/MealGallery").then((mod) => mod.MealGallery),
  { ssr: false }
);

const MealGalleryPreview = dynamic(
  () =>
    import("@/components/weight-management/MealGallery").then(
      (mod) => mod.MealGalleryPreview
    ),
  {
    ssr: false,
    loading: () => <div className="h-[7.5rem] animate-pulse rounded-lg bg-muted/40" />,
  }
);

const SuccessAnimation = dynamic(
  () =>
    import("@/components/weight-management/SuccessAnimation").then(
      (mod) => mod.SuccessAnimation
    ),
  { ssr: false }
);

interface MealLog {
  id: string;
  mealType: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  loggedAt: string;
}

interface MealData {
  mealLogs: MealLog[];
  todayTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealCount: number;
  };
  mealsByDate: Record<string, MealLog[]>;
}

interface PlannedMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipe: Recipe;
}

interface FavoriteMeal {
  id: string;
  name: string;
  mealType: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

const MEAL_ICONS: Record<string, React.ReactNode> = {
  BREAKFAST: <Coffee className="w-4 h-4" />,
  MORNING_SNACK: <Apple className="w-4 h-4" />,
  LUNCH: <Sun className="w-4 h-4" />,
  AFTERNOON_SNACK: <Apple className="w-4 h-4" />,
  DINNER: <Moon className="w-4 h-4" />,
  EVENING_SNACK: <Apple className="w-4 h-4" />,
};

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  MORNING_SNACK: "Morning snack",
  LUNCH: "Lunch",
  AFTERNOON_SNACK: "Afternoon snack",
  DINNER: "Dinner",
  EVENING_SNACK: "Evening snack",
};

const MEAL_TYPE_ORDER = Object.keys(MEAL_LABELS);

const PLANNER_TO_LOG: Record<string, string> = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  snack: "AFTERNOON_SNACK",
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftDate(key: string, days: number): string {
  const next = parseLocalDate(key);
  next.setDate(next.getDate() + days);
  return localDateKey(next);
}

function formatDayHeading(key: string): string {
  const today = localDateKey(new Date());
  if (key === today) return "Today";
  if (key === shiftDate(today, -1)) return "Yesterday";
  if (key === shiftDate(today, 1)) return "Tomorrow";
  return parseLocalDate(key).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function noonIsoForDate(key: string): string {
  const date = parseLocalDate(key);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function weekStartQuery(dateKey: string): string {
  const sunday = parseLocalDate(dateKey);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return localDateKey(sunday);
}

function MealThumb({
  name,
  mealType,
  className,
}: {
  name: string;
  mealType?: string;
  className?: string;
}) {
  const src = getMealImage(name, mealType);
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-orange-50 dark:bg-orange-950/30 ${className ?? ""}`}>
        <Utensils className="h-6 w-6 text-orange-400" />
      </div>
    );
  }
  return <img src={src} alt="" className={`object-cover ${className ?? ""}`} />;
}

function dayTotals(meals: MealLog[]) {
  return {
    calories: meals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
    protein: Math.round(meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) * 10) / 10,
    carbs: Math.round(meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) * 10) / 10,
    fat: Math.round(meals.reduce((sum, meal) => sum + (meal.fat || 0), 0) * 10) / 10,
  };
}

export default function MealsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [data, setData] = useState<MealData | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingPlannerId, setLoggingPlannerId] = useState<string | null>(null);
  const [loggingAllPlanner, setLoggingAllPlanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  const [mealType, setMealType] = useState("BREAKFAST");
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [saveAsFavourite, setSaveAsFavourite] = useState(false);
  const [showCustomMealDialog, setShowCustomMealDialog] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [loggingFavoriteId, setLoggingFavoriteId] = useState<string | null>(null);
  const [togglingLogFavouriteId, setTogglingLogFavouriteId] = useState<string | null>(null);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

  const todayKey = localDateKey(new Date());
  const isToday = Boolean(selectedDate) && selectedDate === todayKey;
  const canGoForward = Boolean(selectedDate) && selectedDate < todayKey;
  const loggedMeals = useMemo(() => {
    const meals = data?.mealLogs ?? [];
    return [...meals].sort((a, b) => {
      const aIndex = MEAL_TYPE_ORDER.indexOf(a.mealType);
      const bIndex = MEAL_TYPE_ORDER.indexOf(b.mealType);
      const aOrder = aIndex === -1 ? MEAL_TYPE_ORDER.length : aIndex;
      const bOrder = bIndex === -1 ? MEAL_TYPE_ORDER.length : bIndex;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime();
    });
  }, [data?.mealLogs]);
  const totals = dayTotals(loggedMeals);

  const fetchMeals = useCallback(async (dateKey: string) => {
    try {
      const res = await fetch(`/api/weight-management/meals?date=${dateKey}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id) {
      setFavorites([]);
      return;
    }
    try {
      const res = await fetch("/api/weight-management/favorite-meals", {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      if (!res.ok) {
        if (!signal?.aborted) setFavorites([]);
        return;
      }
      const payload = await res.json();
      if (signal?.aborted) return;
      setFavorites(Array.isArray(payload.favorites) ? payload.favorites : []);
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      setFavorites([]);
    }
  }, [user?.id]);

  const fetchPlanner = useCallback(async (dateKey: string) => {
    setPlannerLoading(true);
    try {
      const res = await fetch(
        `/api/weight-management/meal-plan?weekStart=${weekStartQuery(dateKey)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setPlannedMeals([]);
        return;
      }
      const payload = await res.json();
      const planData = (payload.planData ?? {}) as Record<string, { meals?: PlannedMeal[] }>;
      const day = planData[dateKey];
      setPlannedMeals(day?.meals ?? []);
    } catch {
      setPlannedMeals([]);
    } finally {
      setPlannerLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadCalorieGoal = async () => {
      try {
        const prefsRes = await fetch("/api/weight-management/preferences");
        if (prefsRes.ok) {
          const prefs = await prefsRes.json();
          if (prefs.dailyCalorieGoal) {
            setCalorieGoal(prefs.dailyCalorieGoal);
            return;
          }
        }
        const ringsRes = await fetch("/api/weight-management/rings", { cache: "no-store" });
        if (ringsRes.ok) {
          const rings = await ringsRes.json();
          if (rings.ringWeek?.dailyCalorieGoal) {
            setCalorieGoal(rings.ringWeek.dailyCalorieGoal);
          }
        }
      } catch {
        /* keep unset */
      }
    };
    void loadCalorieGoal();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setListLoading(true);
    setShowGallery(false);
    fetchMeals(selectedDate);
    fetchPlanner(selectedDate);
  }, [selectedDate, fetchMeals, fetchPlanner]);

  useEffect(() => {
    setFavorites([]);
    if (!user?.id) return;
    const controller = new AbortController();
    void fetchFavorites(controller.signal);
    return () => controller.abort();
  }, [user?.id, fetchFavorites]);

  const saveFavouriteMeal = async (
    payload: {
      mealType: string;
      name: string;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fat?: number | null;
    },
    options?: { errorMessage?: string }
  ) => {
    const favRes = await fetch("/api/weight-management/favorite-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    if (favRes.ok) {
      await fetchFavorites();
      return true;
    }
    toast.error(options?.errorMessage ?? "Meal logged, but it could not be saved to favourites");
    return false;
  };

  const logMeal = async (
    payload: {
      mealType: string;
      name: string;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fat?: number | null;
    },
    options?: { silent?: boolean }
  ) => {
    if (selectedDate !== localDateKey(new Date())) {
      toast.error("You can only log meals for today");
      return false;
    }
    const res = await fetch("/api/weight-management/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        loggedAt: noonIsoForDate(selectedDate),
      }),
    });
    if (!res.ok) {
      toast.error("Failed to log meal");
      return false;
    }
    if (!options?.silent) {
      setSuccessMessage(getRandomMotivation("mealLogging"));
      setShowSuccess(true);
      fetchMeals(selectedDate);
    }
    return true;
  };

  const handleCustomSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customName.trim()) {
      toast.error("Enter a meal name");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        mealType,
        name: customName.trim(),
        calories: customCalories ? parseInt(customCalories, 10) : null,
        protein: customProtein ? parseFloat(customProtein) : null,
        carbs: customCarbs ? parseFloat(customCarbs) : null,
        fat: customFat ? parseFloat(customFat) : null,
      };
      const saved = await logMeal(payload);
      if (saved) {
        if (saveAsFavourite) {
          await saveFavouriteMeal(payload);
        }
        setCustomName("");
        setCustomCalories("");
        setCustomProtein("");
        setCustomCarbs("");
        setCustomFat("");
        setSaveAsFavourite(false);
        setShowCustomMealDialog(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDatabaseMeal = async (meal: CombinedFoodMeal) => {
    const payload = {
      mealType: meal.mealType,
      name: meal.name,
      calories: meal.calories || null,
      protein: meal.protein || null,
      carbs: meal.carbs || null,
      fat: meal.fat || null,
    };
    const saved = await logMeal(payload);
    if (saved && meal.saveAsFavourite) {
      await saveFavouriteMeal(payload);
    }
    return saved;
  };

  const plannerPayload = (meal: PlannedMeal) => ({
    mealType: PLANNER_TO_LOG[meal.mealType] || "LUNCH",
    name: meal.recipe.title,
    calories: meal.recipe.calories ?? null,
    protein: meal.recipe.protein ?? null,
    carbs: meal.recipe.carbs ?? null,
    fat: meal.recipe.fat ?? null,
  });

  const handleFavoriteAdd = async (meal: FavoriteMeal) => {
    setLoggingFavoriteId(meal.id);
    try {
      await logMeal({
        mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });
    } finally {
      setLoggingFavoriteId(null);
    }
  };

  const handleToggleLoggedFavourite = async (meal: MealLog) => {
    setTogglingLogFavouriteId(meal.id);
    try {
      const existing = favorites.filter((favourite) => matchesFavoriteName(favourite.name, meal.name));
      if (existing.length > 0) {
        const results = await Promise.all(
          existing.map((favourite) =>
            fetch(`/api/weight-management/favorite-meals?id=${favourite.id}`, {
              method: "DELETE",
              credentials: "same-origin",
            })
          )
        );
        if (results.some((res) => !res.ok)) {
          toast.error("Could not update favourites");
          return;
        }
        const removed = new Set(existing.map((favourite) => favourite.id));
        setFavorites((current) => current.filter((favourite) => !removed.has(favourite.id)));
        toast.success("Removed from favourites");
        return;
      }
      const saved = await saveFavouriteMeal(
        {
          mealType: meal.mealType,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        },
        { errorMessage: "Could not add to favourites" }
      );
      if (saved) toast.success("Added to favourites");
    } finally {
      setTogglingLogFavouriteId(null);
    }
  };

  const handleFavoriteRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/weight-management/favorite-meals?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Could not remove favourite");
        return;
      }
      setFavorites((current) => current.filter((meal) => meal.id !== id));
    } catch {
      toast.error("Could not remove favourite");
    }
  };

  const handlePlannerAdd = async (meal: PlannedMeal) => {
    setLoggingPlannerId(meal.id);
    try {
      await logMeal(plannerPayload(meal));
    } finally {
      setLoggingPlannerId(null);
    }
  };

  const handlePlannerAddAll = async () => {
    if (plannedMeals.length === 0) return;
    setLoggingAllPlanner(true);
    try {
      let added = 0;
      for (const meal of plannedMeals) {
        const saved = await logMeal(plannerPayload(meal), { silent: true });
        if (saved) added += 1;
      }
      if (added > 0) {
        setSuccessMessage(getRandomMotivation("mealLogging"));
        setShowSuccess(true);
        fetchMeals(selectedDate);
      }
    } finally {
      setLoggingAllPlanner(false);
    }
  };

  const handleSelectFromGallery = async (meal: {
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealType: string;
    saveAsFavourite?: boolean;
  }) => {
    const payload = {
      mealType: meal.mealType,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein ?? null,
      carbs: meal.carbs ?? null,
      fat: meal.fat ?? null,
    };
    const saved = await logMeal(payload);
    if (saved && meal.saveAsFavourite) {
      await saveFavouriteMeal(payload);
    }
    return saved;
  };

  const handleDelete = async (id: string) => {
    if (selectedDate !== localDateKey(new Date())) {
      toast.error("Past days are read only");
      return;
    }
    try {
      const res = await fetch(`/api/weight-management/meals?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Meal removed");
        fetchMeals(selectedDate);
      }
    } catch {
      toast.error("Failed to delete meal");
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {showSuccess ? (
        <SuccessAnimation
          show={showSuccess}
          type="george"
          subMessage={successMessage}
          onComplete={() => setShowSuccess(false)}
        />
      ) : null}

      <MealGallery
        open={showGallery}
        onOpenChange={(open) => {
          setShowGallery(open);
          if (!open) void fetchFavorites();
        }}
        onSelectMeal={handleSelectFromGallery}
      />

      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Food Diary</h1>
          <p className="text-muted-foreground">Log what you ate, from a plan or from inspiration.</p>
        </div>
      </div>

      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-950/30 dark:to-amber-950/30">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous day</span>
            </Button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 shrink-0 text-orange-500" />
              <span className="truncate text-center font-medium text-orange-800 dark:text-orange-200">
                {isToday ? "Today's nourishment" : `Nourishment · ${formatDayHeading(selectedDate)}`}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 shrink-0 ${canGoForward ? "" : "grayscale opacity-40"}`}
              disabled={!canGoForward}
              onClick={() => {
                if (!canGoForward) return;
                setSelectedDate((current) => shiftDate(current, 1));
              }}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next day</span>
            </Button>
          </div>
          {!isToday ? (
            <div className="-mt-2 mb-4 text-center">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(localDateKey(new Date()))}>
                Back to today
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <p className="text-xl font-bold leading-tight">
                {totals.calories}
                {calorieGoal ? (
                  <span className="text-sm font-medium text-muted-foreground">/{calorieGoal}</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">calories</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <span className="text-sm font-bold text-blue-600">P</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{totals.protein}g</p>
              <p className="text-xs text-muted-foreground">protein</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <span className="text-sm font-bold text-amber-600">C</span>
              </div>
              <p className="text-xl font-bold text-amber-600">{totals.carbs}g</p>
              <p className="text-xs text-muted-foreground">carbs</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <span className="text-sm font-bold text-purple-600">F</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{totals.fat}g</p>
              <p className="text-xs text-muted-foreground">fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isToday ? (
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="space-y-1 pb-3 lg:min-h-[4.75rem]">
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-4 w-4 text-orange-500" />
              Add custom meal
            </CardTitle>
            <p className="text-sm text-muted-foreground lg:invisible">Already in planner</p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3">
            <div className="space-y-1.5">
              <Label>Meal type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {MEAL_ICONS[key]}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Favourites
              </p>
              {favorites.length === 0 ? (
                <div className="flex flex-1 flex-col justify-center rounded-lg border border-dashed px-4 py-8 text-center">
                  <Heart className="mx-auto mb-2 h-6 w-6 text-rose-300" />
                  <p className="text-sm text-muted-foreground">No favourite meals yet</p>
                </div>
              ) : (
                <div className="max-h-72 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 lg:max-h-none">
                  {favorites.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2"
                    >
                      <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-500 text-rose-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.calories != null ? `${meal.calories} cal` : "Calories not set"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleFavoriteRemove(meal.id)}
                        aria-label={`Remove ${meal.name} from favourites`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        disabled={loggingFavoriteId === meal.id}
                        onClick={() => handleFavoriteAdd(meal)}
                        aria-label={`Add ${meal.name} to today`}
                      >
                        {loggingFavoriteId === meal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              className="mt-auto w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowCustomMealDialog(true)}
            >
              Add custom meal
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showCustomMealDialog} onOpenChange={setShowCustomMealDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add custom meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Meal name</Label>
                <Input
                  placeholder="e.g. Homemade pasta"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated calories</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  max={9999}
                  placeholder="450"
                  className="h-9 w-[4.5rem] px-2 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={customCalories}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCustomCalories(next);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Protein, carbs & fat</Label>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                    Optional
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Protein g"
                    className="h-9"
                    aria-label="Protein grams, optional"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Carbs g"
                    className="h-9"
                    aria-label="Carbs grams, optional"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Fat g"
                    className="h-9"
                    aria-label="Fat grams, optional"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 dark:border-rose-900/60 dark:bg-rose-950/20">
                <Checkbox
                  checked={saveAsFavourite}
                  onCheckedChange={(checked) => setSaveAsFavourite(checked === true)}
                  aria-label="Save in favourites"
                />
                <Heart
                  className={`h-4 w-4 ${
                    saveAsFavourite ? "fill-rose-500 text-rose-500" : "text-rose-400"
                  }`}
                />
                <span className="text-sm font-medium">Save in favourites</span>
              </label>
              <Button
                type="submit"
                disabled={submitting || !customName.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save meal
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex h-full flex-col gap-4">
        <Card className="flex flex-1 flex-col">
          <CardHeader className="space-y-1 pb-3 lg:min-h-[4.75rem]">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-teal-600" />
              Add daily meals
            </CardTitle>
            <p className="text-sm text-muted-foreground">Already in planner</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-3">
            {plannerLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : plannedMeals.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center rounded-lg border border-dashed px-4 py-8 text-center">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {isToday
                    ? "No meals in the planner for today"
                    : `No meals in the planner for ${formatDayHeading(selectedDate)}`}
                </p>
                <Button asChild variant="link" size="sm" className="mt-1">
                  <Link href="/dashboard/weight-management/meal-plan">Open planner</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col space-y-2">
                <div className="space-y-2">
                {plannedMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 rounded-lg bg-muted/40 p-2.5">
                    <img
                      src={meal.recipe.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{meal.recipe.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {MEAL_LABELS[PLANNER_TO_LOG[meal.mealType]] || meal.mealType}
                        {meal.recipe.calories ? ` · ${meal.recipe.calories} cal` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loggingAllPlanner || loggingPlannerId === meal.id}
                      onClick={() => handlePlannerAdd(meal)}
                    >
                      {loggingPlannerId === meal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span className="ml-1">Add</span>
                    </Button>
                  </div>
                ))}
                </div>
                <Button
                  type="button"
                  className="mt-auto w-full bg-teal-600 hover:bg-teal-700"
                  disabled={loggingAllPlanner || Boolean(loggingPlannerId)}
                  onClick={handlePlannerAddAll}
                >
                  {loggingAllPlanner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add all meals
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="space-y-1 pb-3 lg:min-h-[4.75rem]">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Add from our meals collection
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <MealGalleryPreview onViewAll={() => setShowGallery(true)} />
            <p className="text-center text-sm font-medium text-muted-foreground">or</p>
            <div className="mt-auto space-y-2">
            <FoodSearchDialog
              defaultMealType={mealType}
              onSaveMeal={handleSaveDatabaseMeal}
              trigger={
                <Button type="button" variant="outline" className="w-full gap-2">
                  <Search className="h-4 w-4" /> Search our food database
                </Button>
              }
            />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <div className="min-w-0 text-center">
            <CardTitle className="text-lg">{formatDayHeading(selectedDate)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {loggedMeals.length} meal{loggedMeals.length === 1 ? "" : "s"} logged
              {!isToday ? " · Read only" : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loggedMeals.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Utensils className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="mb-1 font-medium">No meals logged</h3>
              <p className="text-sm text-muted-foreground">
                Nothing recorded for {formatDayHeading(selectedDate).toLowerCase()}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {loggedMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                  <MealThumb
                    name={meal.name}
                    mealType={meal.mealType}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{meal.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatEntryDate(meal.loggedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {MEAL_ICONS[meal.mealType]}
                        {MEAL_LABELS[meal.mealType]}
                      </span>
                      {meal.calories ? (
                        <Badge variant="secondary" className="text-xs">{meal.calories} cal</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-0.5 sm:flex-row sm:gap-1">
                    {meal.protein ? (
                      <Badge variant="outline" className="hidden text-xs md:flex">P: {meal.protein}g</Badge>
                    ) : null}
                    {(() => {
                      const isFavourite = favorites.some((favourite) =>
                        matchesFavoriteName(favourite.name, meal.name)
                      );
                      return (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={togglingLogFavouriteId === meal.id}
                          onClick={() => void handleToggleLoggedFavourite(meal)}
                          aria-label={
                            isFavourite
                              ? `Remove ${meal.name} from favourites`
                              : `Add ${meal.name} to favourites`
                          }
                        >
                          {togglingLogFavouriteId === meal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart
                              className={`h-4 w-4 ${
                                isFavourite
                                  ? "fill-rose-500 text-rose-500"
                                  : "text-muted-foreground hover:text-rose-500"
                              }`}
                            />
                          )}
                        </Button>
                      );
                    })()}
                    {isToday ? (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(meal.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
