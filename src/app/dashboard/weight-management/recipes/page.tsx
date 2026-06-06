"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Search, Clock, Users, Flame, Heart, ChefHat, Filter, Sparkles, X, Play, ListChecks, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RECIPES, Recipe } from "@/data/recipes";
import { RECIPE_DETAILS } from "@/data/recipeDetails";

const MEAL_TYPES = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "BREAKFAST", label: "Breakfast", emoji: "🌅" },
  { id: "LUNCH", label: "Lunch", emoji: "☀️" },
  { id: "DINNER", label: "Dinner", emoji: "🌙" },
  { id: "SNACK", label: "Snacks", emoji: "🍎" },
  { id: "DESSERT", label: "Dessert", emoji: "🍰" },
];

const DIETARY_FILTERS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥬" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { id: "low-carb", label: "Low Carb", emoji: "🥩" },
  { id: "high-protein", label: "High Protein", emoji: "💪" },
  { id: "high-fiber", label: "High Fiber", emoji: "🥗" },
];

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMealType, setActiveMealType] = useState("all");
  const [activeDietary, setActiveDietary] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = RECIPES.filter((recipe) => {
    const matchesMeal = activeMealType === "all" || recipe.mealType === activeMealType;
    const matchesSearch = !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary = activeDietary.length === 0 ||
      activeDietary.every(d => recipe.dietaryTags.includes(d));

    return matchesMeal && matchesSearch && matchesDietary;
  });

  const toggleDietary = (filter: string) => {
    setActiveDietary(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleSave = (recipeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (savedRecipes.has(recipeId)) {
      setSavedRecipes(prev => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
      toast.success("Recipe removed from saved");
    } else {
      setSavedRecipes(prev => new Set(prev).add(recipeId));
      toast.success("Recipe saved!");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "MEDIUM": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "HARD": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveMealType("all");
    setActiveDietary([]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">Discover {RECIPES.length} healthy meals to support your journey</p>
        </div>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 border-0 text-white overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Chef&apos;s Collection</span>
            </div>
            <h2 className="text-xl font-bold mb-1">Nourishing recipes for every meal</h2>
            <p className="text-white/80 text-sm">Delicious, healthy meals curated by nutrition experts</p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Meal Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {MEAL_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={activeMealType === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveMealType(type.id)}
            className={`shrink-0 ${activeMealType === type.id ? "bg-orange-500 hover:bg-orange-600" : ""}`}
          >
            {type.emoji} {type.label}
          </Button>
        ))}
      </div>

      {/* Dietary Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {DIETARY_FILTERS.map((filter) => (
          <Badge
            key={filter.id}
            variant={activeDietary.includes(filter.id) ? "default" : "outline"}
            className={`cursor-pointer transition-all ${activeDietary.includes(filter.id) ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-muted"}`}
            onClick={() => toggleDietary(filter.id)}
          >
            {filter.emoji} {filter.label}
          </Badge>
        ))}
        {(activeDietary.length > 0 || searchQuery || activeMealType !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRecipes.length} of {RECIPES.length} recipes
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm"
                  onClick={(e) => toggleSave(recipe.id, e)}
                >
                  <Heart className={`w-5 h-5 ${savedRecipes.has(recipe.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>
                <Badge className={`absolute top-2 left-2 ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </Badge>
                {/* Meal type badge */}
                <Badge className="absolute bottom-2 left-2 bg-black/50 text-white border-0">
                  {MEAL_TYPES.find(m => m.id === recipe.mealType)?.emoji} {recipe.mealType}
                </Badge>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{recipe.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {recipe.prepTime + recipe.cookTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {recipe.servings}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" /> {recipe.calories} cal
                  </span>
                </div>

                {/* Tags */}
                <div className="flex gap-1 flex-wrap">
                  {recipe.dietaryTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
                  ))}
                  {recipe.dietaryTags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">+{recipe.dietaryTags.length - 3}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedRecipe && (
            <>
              {/* Hero Image */}
              <div className="aspect-video relative">
                <img
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                  onClick={(e) => toggleSave(selectedRecipe.id, e)}
                >
                  <Heart className={`w-5 h-5 ${savedRecipes.has(selectedRecipe.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className={`mb-2 ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                    {selectedRecipe.difficulty}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{selectedRecipe.title}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <p className="text-muted-foreground">{selectedRecipe.description}</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-bold">{selectedRecipe.calories}</p>
                    <p className="text-xs text-muted-foreground">calories</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                    <span className="text-blue-600 font-bold text-lg">P</span>
                    <p className="font-bold">{selectedRecipe.protein}g</p>
                    <p className="text-xs text-muted-foreground">protein</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                    <span className="text-amber-600 font-bold text-lg">C</span>
                    <p className="font-bold">{selectedRecipe.carbs}g</p>
                    <p className="text-xs text-muted-foreground">carbs</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                    <span className="text-purple-600 font-bold text-lg">F</span>
                    <p className="font-bold">{selectedRecipe.fat}g</p>
                    <p className="text-xs text-muted-foreground">fat</p>
                  </div>
                </div>

                {/* Time & Servings */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedRecipe.prepTime + selectedRecipe.cookTime} min</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedRecipe.prepTime}m prep + {selectedRecipe.cookTime}m cook
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedRecipe.servings} servings</p>
                      <p className="text-xs text-muted-foreground">per recipe</p>
                    </div>
                  </div>
                </div>

                {/* Dietary Tags */}
                <div>
                  <h3 className="font-semibold mb-2">Dietary Info</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.dietaryTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Video Tutorial */}
                {RECIPE_DETAILS[selectedRecipe.id]?.videoUrl && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5 text-red-500" /> Video Tutorial
                    </h3>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={RECIPE_DETAILS[selectedRecipe.id]?.videoUrl}
                        title={`How to make ${selectedRecipe.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                {RECIPE_DETAILS[selectedRecipe.id]?.ingredients && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-emerald-500" /> Ingredients
                    </h3>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4">
                      <ul className="space-y-2">
                        {RECIPE_DETAILS[selectedRecipe.id]?.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start gap-2">
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

                {/* Instructions */}
                {RECIPE_DETAILS[selectedRecipe.id]?.instructions && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-orange-500" /> Instructions
                    </h3>
                    <div className="space-y-3">
                      {RECIPE_DETAILS[selectedRecipe.id]?.instructions.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-relaxed pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {RECIPE_DETAILS[selectedRecipe.id]?.tips && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
                    <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">💡 Pro Tips</h4>
                    <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      {RECIPE_DETAILS[selectedRecipe.id]?.tips?.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href="/dashboard/weight-management/meal-plan" className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                      <Calendar className="w-5 h-5 mr-2" /> Add to Meal Plan
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" onClick={() => toast.success("Recipe saved!")}>
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
