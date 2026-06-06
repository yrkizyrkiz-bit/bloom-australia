"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Apple, Coffee, Sun, Moon, Loader2, Trash2, Flame, Search, X, Sparkles, Utensils, Image, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FoodSearchDialog } from "@/components/weight-management/FoodSearchDialog";
import { FoodItem } from "@/data/foodDatabase";
import { getMealImage, getRandomMotivation } from "@/data/mealImages";
import { SuccessAnimation } from "@/components/weight-management/SuccessAnimation";
import { MealGallery, MealGalleryPreview } from "@/components/weight-management/MealGallery";

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

interface SelectedFood {
  food: FoodItem;
  portion: number;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
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
  MORNING_SNACK: "Morning Snack",
  LUNCH: "Lunch",
  AFTERNOON_SNACK: "Afternoon Snack",
  DINNER: "Dinner",
  EVENING_SNACK: "Evening Snack",
};

// Friendly meal time descriptions
const MEAL_DESCRIPTIONS: Record<string, string> = {
  BREAKFAST: "Start your day right",
  MORNING_SNACK: "A little energy boost",
  LUNCH: "Fuel for your afternoon",
  AFTERNOON_SNACK: "Keep going strong",
  DINNER: "Nourish and unwind",
  EVENING_SNACK: "A light finish",
};

export default function MealsPage() {
  const [data, setData] = useState<MealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  const [mealType, setMealType] = useState("BREAKFAST");
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const res = await fetch("/api/weight-management/meals?days=7");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (food: FoodItem, portion: number, nutrition: SelectedFood["nutrition"]) => {
    setSelectedFoods([...selectedFoods, { food, portion, nutrition }]);
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const getTotalNutrition = () => {
    return selectedFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrition.calories,
        protein: acc.protein + item.nutrition.protein,
        carbs: acc.carbs + item.nutrition.carbs,
        fat: acc.fat + item.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFoods.length === 0 && !customName) {
      toast.error("Please add foods or enter a custom meal name");
      return;
    }

    setSubmitting(true);
    try {
      let mealName = customName;
      let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      if (selectedFoods.length > 0) {
        mealName = selectedFoods.map(f => `${f.food.name} (${f.portion}x)`).join(", ");
        nutrition = getTotalNutrition();
      } else if (customCalories) {
        nutrition.calories = parseInt(customCalories);
      }

      const res = await fetch("/api/weight-management/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          name: mealName,
          calories: nutrition.calories || null,
          protein: nutrition.protein || null,
          carbs: nutrition.carbs || null,
          fat: nutrition.fat || null,
        }),
      });

      if (res.ok) {
        // Show celebratory animation
        setSuccessMessage(getRandomMotivation("mealLogging"));
        setShowSuccess(true);
        resetForm();
        fetchMeals();
      }
    } catch (error) {
      toast.error("Failed to log meal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectFromGallery = (meal: { name: string; calories: number }) => {
    setCustomName(meal.name);
    setCustomCalories(meal.calories.toString());
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/weight-management/meals?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Meal removed");
        fetchMeals();
      }
    } catch (error) {
      toast.error("Failed to delete meal");
    }
  };

  const resetForm = () => {
    setCustomName("");
    setCustomCalories("");
    setSelectedFoods([]);
    setShowForm(false);
  };

  const todayKey = new Date().toISOString().split("T")[0];
  const todayMeals = data?.mealsByDate?.[todayKey] || [];
  const totalNutrition = getTotalNutrition();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        type="meal"
        subMessage={successMessage}
        onComplete={() => setShowSuccess(false)}
      />

      {/* Meal Gallery Dialog */}
      <MealGallery
        open={showGallery}
        onOpenChange={setShowGallery}
        onSelectMeal={handleSelectFromGallery}
      />

      {/* Header - Friendly */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Food Diary</h1>
          <p className="text-muted-foreground">What are you enjoying today?</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Log Meal
        </Button>
      </div>

      {/* Today's Summary - Celebratory */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-orange-800 dark:text-orange-200">Today&apos;s nourishment</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-2">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <p className="text-xl font-bold">{data?.todayTotals.calories || 0}</p>
              <p className="text-xs text-muted-foreground">calories</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold text-sm">P</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{data?.todayTotals.protein || 0}g</p>
              <p className="text-xs text-muted-foreground">protein</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2">
                <span className="text-amber-600 font-bold text-sm">C</span>
              </div>
              <p className="text-xl font-bold text-amber-600">{data?.todayTotals.carbs || 0}g</p>
              <p className="text-xs text-muted-foreground">carbs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-sm">F</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{data?.todayTotals.fat || 0}g</p>
              <p className="text-xs text-muted-foreground">fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Inspiration Gallery Preview */}
      <Card>
        <CardContent className="p-4">
          <MealGalleryPreview onViewAll={() => setShowGallery(true)} />
        </CardContent>
      </Card>

      {/* Add Meal Form - Friendly */}
      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              What did you have?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Meal type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {MEAL_ICONS[key]}
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{MEAL_DESCRIPTIONS[key]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Food Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Add foods</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowGallery(true)}
                    >
                      <Image className="w-4 h-4" /> Browse ideas
                    </Button>
                    <FoodSearchDialog
                      onSelectFood={handleAddFood}
                      trigger={
                        <Button type="button" variant="outline" size="sm" className="gap-2">
                          <Search className="w-4 h-4" /> Search foods
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* Selected Foods List */}
                {selectedFoods.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFoods.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <img
                          src={getMealImage(item.food.name)}
                          alt={item.food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.portion} serving{item.portion > 1 ? 's' : ''} • {item.nutrition.calories} cal
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden md:flex gap-1">
                            <Badge variant="outline" className="text-xs">P: {item.nutrition.protein}g</Badge>
                            <Badge variant="outline" className="text-xs">C: {item.nutrition.carbs}g</Badge>
                            <Badge variant="outline" className="text-xs">F: {item.nutrition.fat}g</Badge>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFood(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-orange-800 dark:text-orange-200">Total</span>
                        <div className="flex gap-2">
                          <Badge className="bg-orange-500">{totalNutrition.calories} cal</Badge>
                          <Badge variant="secondary">P: {Math.round(totalNutrition.protein)}g</Badge>
                          <Badge variant="secondary">C: {Math.round(totalNutrition.carbs)}g</Badge>
                          <Badge variant="secondary">F: {Math.round(totalNutrition.fat)}g</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg text-center">
                    <Apple className="w-10 h-10 mx-auto mb-3 text-orange-300" />
                    <p className="font-medium text-orange-800 dark:text-orange-200">Search our food database</p>
                    <p className="text-sm text-muted-foreground mt-1">Or enter a custom meal below</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or add custom</span>
                </div>
              </div>

              {/* Custom Meal Entry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meal name</Label>
                  <Input
                    placeholder="e.g., Homemade pasta"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={selectedFoods.length > 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated calories</Label>
                  <Input
                    type="number"
                    placeholder="450"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    disabled={selectedFoods.length > 0}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || (selectedFoods.length === 0 && !customName)} className="bg-orange-500 hover:bg-orange-600">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save meal
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Today's Meals - With Images */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today&apos;s meals</CardTitle>
        </CardHeader>
        <CardContent>
          {todayMeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Utensils className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="font-medium text-lg mb-1">No meals logged yet</h3>
              <p className="text-muted-foreground mb-4">What delicious food will you enjoy today?</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" /> Log your first meal
                </Button>
                <Button variant="outline" onClick={() => setShowGallery(true)}>
                  <Image className="w-4 h-4 mr-2" /> Get inspired
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                  {/* Meal Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={getMealImage(meal.name, meal.mealType)}
                      alt={meal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{meal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {MEAL_ICONS[meal.mealType]}
                        {MEAL_LABELS[meal.mealType]}
                      </span>
                      {meal.calories && (
                        <Badge variant="secondary" className="text-xs">{meal.calories} cal</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meal.protein && <Badge variant="outline" className="hidden md:flex text-xs">P: {meal.protein}g</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(meal.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </Button>
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
