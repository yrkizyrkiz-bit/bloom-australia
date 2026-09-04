"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, X, Heart, Clock, Flame, ChevronLeft, Loader2, Users, ListChecks, ChefHat,
} from "lucide-react";
import {
  RECIPE_CATALOG,
  RECIPE_TO_DIARY_MEAL_TYPE,
  type CatalogRecipe,
  type RecipeCategory,
} from "@/lib/weight-management/recipe-catalog";
import { useRecipeFavourites } from "@/hooks/useRecipeFavourites";

const GALLERY_MEAL_TYPES: { value: string; label: string }[] = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "MORNING_SNACK", label: "Morning snack" },
  { value: "LUNCH", label: "Lunch" },
  { value: "AFTERNOON_SNACK", label: "Afternoon snack" },
  { value: "DINNER", label: "Dinner" },
  { value: "EVENING_SNACK", label: "Evening snack" },
];

const CATEGORIES: Array<"All" | RecipeCategory> = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Desserts",
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "EASY": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "MEDIUM": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "HARD": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default: return "bg-gray-100 text-gray-700";
  }
}

export type GalleryMealSelection = {
  name: string;
  calories: number;
  category?: string;
  mealType: string;
};

interface MealGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMeal?: (meal: GalleryMealSelection) => void | Promise<boolean | void>;
}

export function MealGallery({ open, onOpenChange, onSelectMeal }: MealGalleryProps) {
  const { savedRecipes, toggleFavourite, loadFavourites, userId } = useRecipeFavourites();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [showFavourites, setShowFavourites] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<CatalogRecipe | null>(null);
  const [galleryMealType, setGalleryMealType] = useState("LUNCH");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userId) loadFavourites(userId);
  }, [open, userId, loadFavourites]);

  const query = search.toLowerCase().trim();
  const filteredMeals = RECIPE_CATALOG.filter((meal) => {
    const matchesSearch =
      !query ||
      meal.title.toLowerCase().includes(query) ||
      meal.description.toLowerCase().includes(query) ||
      meal.dietaryTags.some((tag) => tag.toLowerCase().includes(query));
    const matchesCategory = category === "All" || meal.category === category;
    const matchesFavourites = !showFavourites || savedRecipes.has(meal.id);
    return matchesSearch && matchesCategory && matchesFavourites;
  });

  const openMeal = (meal: CatalogRecipe) => {
    setSelectedMeal(meal);
    setGalleryMealType(RECIPE_TO_DIARY_MEAL_TYPE[meal.mealType]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedMeal(null);
      setSaving(false);
      setShowFavourites(false);
    }
    onOpenChange(next);
  };

  const handleSaveMeal = async (meal: CatalogRecipe) => {
    setSaving(true);
    try {
      const result = await onSelectMeal?.({
        name: meal.title,
        calories: meal.calories,
        category: meal.category,
        mealType: galleryMealType,
      });
      if (result === false) return;
      setSelectedMeal(null);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Browse meals</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {RECIPE_CATALOG.length} recipes from our collection. Choose a meal and a type, then save it to your diary.
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-40 shrink-0 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 pr-8 text-sm"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <Tabs value={category} onValueChange={(value) => setCategory(value as (typeof CATEGORIES)[number])}>
              <TabsList className="flex-wrap h-auto">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Badge
              variant={showFavourites ? "default" : "outline"}
              className={`cursor-pointer transition-all ${showFavourites ? "bg-rose-500 hover:bg-rose-600" : "hover:bg-muted"}`}
              onClick={() => setShowFavourites((current) => !current)}
            >
              <Heart className={`w-3 h-3 mr-1 inline ${showFavourites || savedRecipes.size > 0 ? "fill-current" : ""}`} />
              Favourites{savedRecipes.size > 0 ? ` (${savedRecipes.size})` : ""}
            </Badge>
          </div>

          <div className="overflow-y-auto max-h-[50vh] pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMeals.map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index, 12) * 0.02 }}
                    className="group relative rounded-xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => openMeal(meal)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={meal.imageUrl}
                        alt={meal.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(meal.id);
                      }}
                    >
                      <Heart
                        className={`w-4 h-4 ${savedRecipes.has(meal.id) ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
                      />
                    </button>
                    <div className="absolute bottom-0 left-0 right-10 p-3 text-white">
                      <p className="font-medium text-sm line-clamp-1">{meal.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {meal.calories} cal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.prepTime + meal.cookTime} min
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredMeals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  {showFavourites && savedRecipes.size === 0
                    ? "No favourite meals yet"
                    : "No meals found matching your search."}
                </p>
                <p className="mt-1 text-sm">
                  {showFavourites && savedRecipes.size === 0
                    ? "Tap the heart on a meal photo to add it to Favourites."
                    : null}
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setShowFavourites(false);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedMeal && (
            <motion.div
              className="absolute inset-0 bg-background z-10 flex flex-col"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMeal(null)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to gallery
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="space-y-1.5">
                    <Label>Meal type</Label>
                    <Select value={galleryMealType} onValueChange={setGalleryMealType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GALLERY_MEAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="aspect-video relative rounded-2xl overflow-hidden">
                    <img
                      src={selectedMeal.imageUrl}
                      alt={selectedMeal.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <button
                      className="absolute bottom-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white z-10"
                      onClick={() => toggleFavourite(selectedMeal.id)}
                    >
                      <Heart
                        className={`w-5 h-5 ${savedRecipes.has(selectedMeal.id) ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
                      />
                    </button>
                    <div className="absolute bottom-4 left-4 right-16">
                      <Badge className={`mb-2 ${getDifficultyColor(selectedMeal.difficulty)}`}>
                        {selectedMeal.difficulty}
                      </Badge>
                      <h2 className="text-2xl font-bold text-white">{selectedMeal.title}</h2>
                    </div>
                  </div>

                  <p className="text-muted-foreground">{selectedMeal.description}</p>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                      <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                      <p className="font-bold">{selectedMeal.calories}</p>
                      <p className="text-xs text-muted-foreground">calories</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                      <span className="text-blue-600 font-bold text-lg">P</span>
                      <p className="font-bold">{selectedMeal.protein}g</p>
                      <p className="text-xs text-muted-foreground">protein</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                      <span className="text-amber-600 font-bold text-lg">C</span>
                      <p className="font-bold">{selectedMeal.carbs}g</p>
                      <p className="text-xs text-muted-foreground">carbs</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                      <span className="text-purple-600 font-bold text-lg">F</span>
                      <p className="font-bold">{selectedMeal.fat}g</p>
                      <p className="text-xs text-muted-foreground">fat</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedMeal.prepTime + selectedMeal.cookTime} min</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedMeal.prepTime}m prep + {selectedMeal.cookTime}m cook
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedMeal.servings} servings</p>
                        <p className="text-xs text-muted-foreground">per recipe</p>
                      </div>
                    </div>
                  </div>

                  {selectedMeal.dietaryTags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Dietary Info</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMeal.dietaryTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMeal.ingredients.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-emerald-500" /> Ingredients
                      </h3>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4">
                        <ul className="space-y-2">
                          {selectedMeal.ingredients.map((ingredient, index) => (
                            <li key={`${ingredient}-${index}`} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span>{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {selectedMeal.instructions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-orange-500" /> Instructions
                      </h3>
                      <div className="space-y-3">
                        {selectedMeal.instructions.map((step, index) => (
                          <div key={`${step}-${index}`} className="flex gap-3">
                            <span className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-relaxed pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMeal.tips && selectedMeal.tips.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
                      <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Pro Tips</h4>
                      <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                        {selectedMeal.tips.map((tip, index) => (
                          <li key={`${tip}-${index}`}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={saving}
                    onClick={() => handleSaveMeal(selectedMeal)}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save meal
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export function MealGalleryPreview({
  onViewAll
}: {
  onViewAll: () => void;
}) {
  const featuredMeals = RECIPE_CATALOG.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {featuredMeals.map((meal) => (
          <div
            key={meal.id}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onViewAll}
          >
            <img
              src={meal.imageUrl}
              alt={meal.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={onViewAll}>
        Select a preset meal
      </Button>
    </div>
  );
}
