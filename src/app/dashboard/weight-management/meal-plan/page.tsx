"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Plus, Calendar, CalendarDays, ChevronLeft, ChevronRight,
  X, Flame, Clock, ShoppingCart, Trash2, Sparkles
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RECIPES, Recipe } from "@/data/recipes";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDays,
  localDateKey,
  mealPlanWeekStats,
  programWeekProgress,
  startOfWeekSunday,
  weekDatesFromSunday,
} from "@/lib/weight-management/meal-plan-week";

interface MealPlanItem {
  id: string;
  recipe: Recipe;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

interface DayPlan {
  date: string;
  meals: MealPlanItem[];
}

const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast", icon: "🌅", time: "7:00 AM" },
  { id: "lunch", label: "Lunch", icon: "☀️", time: "12:00 PM" },
  { id: "dinner", label: "Dinner", icon: "🌙", time: "6:00 PM" },
  { id: "snack", label: "Snack", icon: "🍎", time: "3:00 PM" },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function persistMealPlan(
  weekStart: string,
  plan: Record<string, DayPlan>,
  options?: { allowEmpty?: boolean }
) {
  if (!options?.allowEmpty && Object.keys(plan).length === 0) return;
  fetch("/api/weight-management/meal-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weekStart, planData: plan }),
  }).catch(() => {});
}

export default function MealPlanPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [weekSunday, setWeekSunday] = useState(() => startOfWeekSunday());
  const weekDates = weekDatesFromSunday(weekSunday);
  const weekStartIso = localDateKey(weekDates[0] ?? weekSunday);
  const [mealPlan, setMealPlan] = useState<Record<string, DayPlan>>({});
  const [hydrated, setHydrated] = useState(false);
  const [planUserId, setPlanUserId] = useState<string | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMealType, setFilterMealType] = useState<string>("all");
  const [programSpan, setProgramSpan] = useState<{ start: Date; end: Date } | null>(null);
  const mealPlanRef = useRef(mealPlan);
  mealPlanRef.current = mealPlan;

  useEffect(() => {
    try {
      localStorage.removeItem("mealPlan");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    setHydrated(false);
    setPlanUserId(null);
    setMealPlan({});

    (async () => {
      try {
        const res = await fetch(
          `/api/weight-management/meal-plan?weekStart=${weekStartIso}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (cancelled) return;
        const plan =
          data.planData && typeof data.planData === "object" && !Array.isArray(data.planData)
            ? (data.planData as Record<string, DayPlan>)
            : {};
        setMealPlan(plan);
      } catch {
        if (!cancelled) setMealPlan({});
      } finally {
        if (!cancelled) {
          setPlanUserId(user.id);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, weekStartIso, authLoading]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const [todayRes, goalsRes] = await Promise.all([
          fetch("/api/program/today", { cache: "no-store" }),
          fetch("/api/weight-management/goals", { cache: "no-store" }),
        ]);
        const today = todayRes.ok ? await todayRes.json() : null;
        const goals = goalsRes.ok ? await goalsRes.json() : null;
        if (cancelled) return;

        const startedAt = today?.program?.startedAt
          ? new Date(today.program.startedAt)
          : goals?.activeGoal?.startDate
            ? new Date(goals.activeGoal.startDate)
            : new Date();
        const targetDate = goals?.activeGoal?.targetDate
          ? new Date(goals.activeGoal.targetDate)
          : addDays(startedAt, 12 * 7 - 1);
        setProgramSpan({ start: startedAt, end: targetDate });
      } catch {
        if (!cancelled) {
          const start = new Date();
          setProgramSpan({ start, end: addDays(start, 12 * 7 - 1) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!hydrated || planUserId !== user?.id || !weekStartIso) return;
    const t = setTimeout(() => persistMealPlan(weekStartIso, mealPlan), 800);
    return () => clearTimeout(t);
  }, [mealPlan, weekStartIso, hydrated, user?.id, planUserId]);

  const flushCurrentWeek = () => {
    if (hydrated && planUserId === user?.id && weekStartIso) {
      persistMealPlan(weekStartIso, mealPlanRef.current);
    }
  };

  const navigateWeek = (direction: number) => {
    flushCurrentWeek();
    setHydrated(false);
    setPlanUserId(null);
    setMealPlan({});
    setWeekSunday((prev) => addDays(startOfWeekSunday(prev), direction * 7));
  };

  const goToToday = () => {
    flushCurrentWeek();
    setHydrated(false);
    setPlanUserId(null);
    setMealPlan({});
    setWeekSunday(startOfWeekSunday());
  };

  const openRecipeSelector = (date: string, mealType: string) => {
    setSelectedSlot({ date, mealType });
    setShowRecipeDialog(true);
  };

  const addRecipeToSlot = (recipe: Recipe) => {
    if (!selectedSlot) return;

    const { date, mealType } = selectedSlot;
    const newItem: MealPlanItem = {
      id: `${date}-${mealType}-${Date.now()}`,
      recipe,
      mealType: mealType as MealPlanItem["mealType"],
    };

    setMealPlan(prev => {
      const dayPlan = prev[date] || { date, meals: [] };
      return {
        ...prev,
        [date]: {
          ...dayPlan,
          meals: [...dayPlan.meals.filter(m => m.mealType !== mealType), newItem],
        },
      };
    });

    setShowRecipeDialog(false);
    toast.success(`Added ${recipe.title} to ${mealType}`);
  };

  const removeMeal = (date: string, mealId: string) => {
    setMealPlan(prev => {
      const dayPlan = prev[date];
      if (!dayPlan) return prev;
      return {
        ...prev,
        [date]: {
          ...dayPlan,
          meals: dayPlan.meals.filter(m => m.id !== mealId),
        },
      };
    });
    toast.success("Meal removed");
  };

  const clearWeek = () => {
    const newPlan = { ...mealPlan };
    weekDates.forEach(date => {
      delete newPlan[localDateKey(date)];
    });
    setMealPlan(newPlan);
    persistMealPlan(weekStartIso, newPlan, { allowEmpty: true });
    toast.success("Week cleared");
  };

  const copyDayPlan = (fromDate: string, toDate: string) => {
    const fromPlan = mealPlan[fromDate];
    if (!fromPlan) return;

    setMealPlan(prev => ({
      ...prev,
      [toDate]: {
        date: toDate,
        meals: fromPlan.meals.map(m => ({
          ...m,
          id: `${toDate}-${m.mealType}-${Date.now()}`,
        })),
      },
    }));
    toast.success("Day copied");
  };

  const getMealForSlot = (date: string, mealType: string): MealPlanItem | undefined => {
    const dayPlan = mealPlan[date];
    return dayPlan?.meals.find(m => m.mealType === mealType);
  };

  const stats = mealPlanWeekStats(weekDates, mealPlan);
  const programWeek = programSpan
    ? programWeekProgress(weekSunday, programSpan.start, programSpan.end)
    : { weekNumber: 1, totalWeeks: 12 };

  const filteredRecipes = RECIPES.filter(recipe => {
    const matchesSearch = !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterMealType === "all" ||
      (filterMealType === "breakfast" && recipe.mealType === "BREAKFAST") ||
      (filterMealType === "lunch" && recipe.mealType === "LUNCH") ||
      (filterMealType === "dinner" && recipe.mealType === "DINNER") ||
      (filterMealType === "snack" && recipe.mealType === "SNACK");
    return matchesSearch && matchesType;
  });

  const isToday = (date: Date) => localDateKey(date) === localDateKey(new Date());

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Meal Planner</h1>
          <p className="text-muted-foreground">Plan your meals for the week</p>
        </div>
        <Link href="/dashboard/weight-management/shopping-list">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Shopping List
          </Button>
        </Link>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => navigateWeek(-1)}>
              <span className="sr-only">Previous week</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {weekDates[0]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - {weekDates[6]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <Button variant="link" size="sm" onClick={goToToday} className="text-emerald-600">
                Go to today
              </Button>
            </div>
            <Button variant="outline" size="icon" aria-label="Next week" onClick={() => navigateWeek(1)}>
              <span className="sr-only">Next week</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Week Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{stats.avgCalories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Avg calories per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold">Week {programWeek.weekNumber}</p>
            <p className="text-xs text-muted-foreground">
              of your {programWeek.totalWeeks} week program
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold">{stats.daysPlanned}</p>
            <p className="text-xs text-muted-foreground">Days planned</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clearWeek}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear Week
        </Button>
      </div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date, index) => (
          <Card
            key={localDateKey(date)}
            className={`${isToday(date) ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className={isToday(date) ? 'text-emerald-600' : ''}>
                  {DAYS_OF_WEEK[date.getDay()].slice(0, 3)}
                </span>
                <span className={`text-lg ${isToday(date) ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                  {date.getDate()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {MEAL_SLOTS.map(slot => {
                const meal = getMealForSlot(localDateKey(date), slot.id);
                return (
                  <div key={slot.id} className="relative">
                    {meal ? (
                      <div className="group relative p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <img
                            src={meal.recipe.imageUrl}
                            alt={meal.recipe.title}
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-1">{meal.recipe.title}</p>
                            <p className="text-[10px] text-muted-foreground">{meal.recipe.calories} cal</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm"
                          onClick={() => removeMeal(localDateKey(date), meal.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full h-12 border-2 border-dashed border-muted-foreground/20 hover:border-emerald-300 hover:bg-emerald-50/50"
                        onClick={() => openRecipeSelector(localDateKey(date), slot.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        <span className="text-xs">{slot.icon} {slot.label}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Selection Dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Choose a Recipe
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterMealType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMealType("all")}
            >
              All
            </Button>
            {selectedSlot && (
              <Button
                variant={filterMealType === selectedSlot.mealType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMealType(selectedSlot.mealType)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Suggested for {selectedSlot.mealType}
              </Button>
            )}
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="grid grid-cols-2 gap-3 p-1">
              {filteredRecipes.map(recipe => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => addRecipeToSlot(recipe)}
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{recipe.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          <Flame className="w-3 h-3 mr-1" />{recipe.calories}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="w-3 h-3 mr-1" />{recipe.prepTime + recipe.cookTime}m
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
