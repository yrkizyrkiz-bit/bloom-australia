"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Plus, Calendar, ChevronLeft, ChevronRight,
  X, Flame, Clock, ShoppingCart, Trash2, Copy, Sparkles
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RECIPES, Recipe } from "@/data/recipes";

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

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function MealPlanPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, DayPlan>>({});
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMealType, setFilterMealType] = useState<string>("all");

  useEffect(() => {
    setWeekDates(getWeekDates(currentWeekStart));
  }, [currentWeekStart]);

  const weekStartIso = weekDates[0] ? formatDate(weekDates[0]) : null;

  // Load: server first, then localStorage fallback
  useEffect(() => {
    if (!weekStartIso) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/weight-management/meal-plan?weekStart=${weekStartIso}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.planData && Object.keys(data.planData).length > 0) {
            setMealPlan(data.planData);
            return;
          }
        }
      } catch {
        /* use local */
      }
      const saved = localStorage.getItem("mealPlan");
      if (!cancelled && saved) {
        setMealPlan(JSON.parse(saved));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weekStartIso]);

  // Save: localStorage + debounced server sync
  useEffect(() => {
    if (Object.keys(mealPlan).length === 0) return;
    localStorage.setItem("mealPlan", JSON.stringify(mealPlan));

    if (!weekStartIso) return;
    const t = setTimeout(() => {
      fetch("/api/weight-management/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weekStartIso,
          planData: mealPlan,
        }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [mealPlan, weekStartIso]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
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
      delete newPlan[formatDate(date)];
    });
    setMealPlan(newPlan);
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

  const getWeekTotals = () => {
    let calories = 0;
    let protein = 0;
    let mealCount = 0;

    weekDates.forEach(date => {
      const dayPlan = mealPlan[formatDate(date)];
      dayPlan?.meals.forEach(meal => {
        calories += meal.recipe.calories;
        protein += meal.recipe.protein;
        mealCount++;
      });
    });

    return { calories, protein, mealCount };
  };

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

  const totals = getWeekTotals();
  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

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
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
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
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
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
            <p className="text-xl font-bold">{totals.calories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Calories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-blue-600 font-bold text-lg">P</span>
            <p className="text-xl font-bold">{totals.protein}g</p>
            <p className="text-xs text-muted-foreground">Total Protein</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold">{totals.mealCount}</p>
            <p className="text-xs text-muted-foreground">Meals Planned</p>
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
            key={formatDate(date)}
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
                const meal = getMealForSlot(formatDate(date), slot.id);
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
                          onClick={() => removeMeal(formatDate(date), meal.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full h-12 border-2 border-dashed border-muted-foreground/20 hover:border-emerald-300 hover:bg-emerald-50/50"
                        onClick={() => openRecipeSelector(formatDate(date), slot.id)}
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
