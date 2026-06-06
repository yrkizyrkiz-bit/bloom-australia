"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Minus, Check, Apple, Loader2, X } from "lucide-react";
import { FoodItem, FoodCategory, FOOD_CATEGORIES, calculateNutrition } from "@/data/foodDatabase";

interface FoodSearchDialogProps {
  onSelectFood: (food: FoodItem, portion: number, nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => void;
  trigger?: React.ReactNode;
}

export function FoodSearchDialog({ onSelectFood, trigger }: FoodSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portion, setPortion] = useState(1);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFoods]);

  useEffect(() => {
    if (open) {
      searchFoods();
    }
  }, [open, searchFoods]);

  const handleSelectFood = () => {
    if (!selectedFood) return;

    const nutrition = calculateNutrition(selectedFood, portion);
    onSelectFood(selectedFood, portion, nutrition);

    // Reset state
    setSelectedFood(null);
    setPortion(1);
    setQuery("");
    setOpen(false);
  };

  const adjustPortion = (delta: number) => {
    const newPortion = Math.max(0.25, Math.min(10, portion + delta));
    setPortion(Math.round(newPortion * 4) / 4); // Round to nearest 0.25
  };

  const currentNutrition = selectedFood ? calculateNutrition(selectedFood, portion) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" /> Search Foods
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-orange-500" />
            Search Food Database
          </DialogTitle>
        </DialogHeader>

        {!selectedFood ? (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search foods... (e.g., chicken, rice, apple)"
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category Tabs */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
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
            </ScrollArea>

            {/* Results */}
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : foods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Apple className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No foods found. Try a different search term.</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {foods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className="w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {food.servingUnit} • {food.calories} cal
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-1.5 flex-wrap justify-end">
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
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          /* Selected Food - Portion Selection */
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFood(null)}
              className="gap-2"
            >
              <X className="w-4 h-4" /> Back to search
            </Button>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedFood.name}</h3>
              <p className="text-sm text-muted-foreground">
                Serving: {selectedFood.servingUnit} ({selectedFood.servingSize}g)
              </p>
            </div>

            {/* Portion Selector */}
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
                <div className="text-center min-w-[120px]">
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

              {/* Quick portion buttons */}
              <div className="flex justify-center gap-2 flex-wrap">
                {[0.5, 1, 1.5, 2].map((p) => (
                  <Button
                    key={p}
                    variant={portion === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPortion(p)}
                  >
                    {p}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Nutrition Preview */}
            {currentNutrition && (
              <div className="grid grid-cols-5 gap-2">
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                  <p className="text-lg font-bold text-orange-600">{currentNutrition.calories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-600">{currentNutrition.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                  <p className="text-lg font-bold text-amber-600">{currentNutrition.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                  <p className="text-lg font-bold text-purple-600">{currentNutrition.fat}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-600">{currentNutrition.fiber}g</p>
                  <p className="text-xs text-muted-foreground">Fiber</p>
                </div>
              </div>
            )}

            <Button onClick={handleSelectFood} className="w-full" size="lg">
              <Check className="w-4 h-4 mr-2" /> Add to Meal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
