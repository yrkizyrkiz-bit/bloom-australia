"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Minus, Check, Apple, Loader2, X, Heart } from "lucide-react";
import { FoodItem, FoodCategory, FOOD_CATEGORIES, calculateNutrition } from "@/data/foodDatabase";
import { combineFoodSelection, formatFoodLine } from "@/lib/weight-management/combine-food-selection";

const SEARCH_MEAL_TYPES: { value: string; label: string }[] = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "MORNING_SNACK", label: "Morning snack" },
  { value: "LUNCH", label: "Lunch" },
  { value: "AFTERNOON_SNACK", label: "Afternoon snack" },
  { value: "DINNER", label: "Dinner" },
  { value: "EVENING_SNACK", label: "Evening snack" },
];

type PickedFood = {
  food: FoodItem;
  portion: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
};

export type CombinedFoodMeal = {
  mealType: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saveAsFavourite: boolean;
};

interface FoodSearchDialogProps {
  onSaveMeal: (meal: CombinedFoodMeal) => Promise<boolean>;
  trigger?: React.ReactNode;
  defaultMealType?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function FoodSearchDialog({
  onSaveMeal,
  trigger,
  defaultMealType = "LUNCH",
  open: openProp,
  onOpenChange,
  defaultOpen = false,
}: FoodSearchDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState(defaultMealType);
  const [pickedFoods, setPickedFoods] = useState<PickedFood[]>([]);
  const [saveAsFavourite, setSaveAsFavourite] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "all") params.set("category", category);

      const res = await fetch(`/api/weight-management/foods?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data.foods);
      }
    } catch (error) {
      console.error("Error searching foods:", error);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  // Search only while the dialog is open (debounced). Opening alone is enough — no separate open fetch.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      searchFoods();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFoods, open]);

  useEffect(() => {
    if (open) setMealType(defaultMealType);
  }, [open, defaultMealType]);

  const addFood = (food: FoodItem, servings: number) => {
    setPickedFoods((current) => {
      const existing = current.findIndex((item) => item.food.id === food.id);
      if (existing === -1) {
        return [...current, { food, portion: servings, nutrition: calculateNutrition(food, servings) }];
      }
      const next = [...current];
      const nextPortion = Math.round((next[existing].portion + servings) * 4) / 4;
      next[existing] = {
        food,
        portion: nextPortion,
        nutrition: calculateNutrition(food, nextPortion),
      };
      return next;
    });
  };

  const removeFood = (foodId: string) => {
    setPickedFoods((current) => current.filter((item) => item.food.id !== foodId));
  };

  const handleAddFromPortion = () => {
    if (!selectedFood) return;
    addFood(selectedFood, portion);
    setSelectedFood(null);
    setPortion(1);
  };

  const combined = useMemo(
    () =>
      combineFoodSelection(
        pickedFoods.map((item) => ({
          name: item.food.name,
          portion: item.portion,
          calories: item.nutrition.calories,
          protein: item.nutrition.protein,
          carbs: item.nutrition.carbs,
          fat: item.nutrition.fat,
        }))
      ),
    [pickedFoods]
  );

  const handleSaveMeal = async () => {
    if (pickedFoods.length === 0) return;
    setSaving(true);
    try {
      const saved = await onSaveMeal({
        mealType,
        name: combined.name,
        calories: combined.calories,
        protein: combined.protein,
        carbs: combined.carbs,
        fat: combined.fat,
        saveAsFavourite,
      });
      if (saved) {
        setPickedFoods([]);
        setSaveAsFavourite(false);
        setSelectedFood(null);
        setPortion(1);
        setQuery("");
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const adjustPortion = (delta: number) => {
    const next = Math.max(0.25, Math.min(10, portion + delta));
    setPortion(Math.round(next * 4) / 4);
  };

  const currentNutrition = selectedFood ? calculateNutrition(selectedFood, portion) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" /> Search Foods
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="flex h-[min(90vh,720px)] max-h-[90vh] max-w-2xl flex-col gap-4 overflow-hidden p-6 sm:rounded-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-orange-500" />
            Search Food Database
          </DialogTitle>
        </DialogHeader>

        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Label>Meal type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_MEAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Get cooking</Label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <Checkbox
                  checked={saveAsFavourite}
                  onCheckedChange={(checked) => setSaveAsFavourite(checked === true)}
                  aria-label="Save in favourites"
                />
                <Heart
                  className={`h-3.5 w-3.5 ${
                    saveAsFavourite ? "fill-rose-500 text-rose-500" : "text-rose-400"
                  }`}
                />
                <span className="text-xs font-medium">Save in favourites</span>
              </label>
            </div>
            <div className="min-h-[4.25rem] max-h-24 overflow-y-auto rounded-md border bg-background px-2 py-1.5 text-xs">
              {pickedFoods.length === 0 ? (
                <p className="text-muted-foreground">Tap + to add foods here</p>
              ) : (
                <div className="space-y-1">
                  {pickedFoods.map((item) => (
                    <div key={item.food.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">
                        {formatFoodLine(item.food.name, item.portion)}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{item.nutrition.calories} cal</span>
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={() => removeFood(item.food.id)}
                        aria-label={`Remove ${item.food.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!selectedFood ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search foods... (e.g., coffee, beer, protein shake)"
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="shrink-0 overflow-x-auto pb-1">
              <div className="flex w-max gap-2">
                <Button
                  variant={category === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory("all")}
                  className="shrink-0"
                >
                  All
                </Button>
                {FOOD_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat.id)}
                    className="shrink-0"
                  >
                    {cat.icon} {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : foods.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Apple className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p>No foods found. Try a different search term.</p>
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {foods.map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center gap-2 rounded-lg border bg-card p-3"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFood(food)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate font-medium">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.servingUnit} • {food.calories} cal
                        </p>
                      </button>
                      <div className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex">
                        <Badge variant="secondary" className="text-xs">
                          P: {food.protein}g
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          C: {food.carbs}g
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          F: {food.fat}g
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => addFood(food, 1)}
                        aria-label={`Add ${food.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFood(null)}
              className="gap-2"
            >
              <X className="w-4 h-4" /> Back to search
            </Button>

            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="text-lg font-semibold">{selectedFood.name}</h3>
              <p className="text-sm text-muted-foreground">
                Serving: {selectedFood.servingUnit} ({selectedFood.servingSize}g)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Portion Size</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustPortion(-0.25)}
                  disabled={portion <= 0.25}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="min-w-[120px] text-center">
                  <span className="text-3xl font-bold">{portion}</span>
                  <p className="text-sm text-muted-foreground">
                    {portion === 1 ? "serving" : "servings"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({Math.round(selectedFood.servingSize * portion)}g)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustPortion(0.25)}
                  disabled={portion >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[0.5, 1, 1.5, 2].map((value) => (
                  <Button
                    key={value}
                    variant={portion === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPortion(value)}
                  >
                    {value}x
                  </Button>
                ))}
              </div>
            </div>

            {currentNutrition ? (
              <div className="grid grid-cols-5 gap-2">
                <div className="rounded-lg bg-orange-50 p-3 text-center dark:bg-orange-950/30">
                  <p className="text-lg font-bold text-orange-600">{currentNutrition.calories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/30">
                  <p className="text-lg font-bold text-blue-600">{currentNutrition.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                  <p className="text-lg font-bold text-amber-600">{currentNutrition.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-950/30">
                  <p className="text-lg font-bold text-purple-600">{currentNutrition.fat}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950/30">
                  <p className="text-lg font-bold text-green-600">{currentNutrition.fiber}g</p>
                  <p className="text-xs text-muted-foreground">Fiber</p>
                </div>
              </div>
            ) : null}

            <Button onClick={handleAddFromPortion} className="w-full" size="lg">
              <Check className="mr-2 h-4 w-4" /> Add to meal
            </Button>
          </div>
        )}

        <div className="shrink-0 space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Meal total</span>
            <Badge className="bg-orange-500">{combined.calories} cal</Badge>
          </div>
          <Button
            type="button"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={saving || pickedFoods.length === 0}
            onClick={handleSaveMeal}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save meal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
