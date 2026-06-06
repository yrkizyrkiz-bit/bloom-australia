"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, ShoppingCart, Plus, Trash2, Share2,
  Download, RefreshCw, Check, Calendar, Sparkles
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RECIPES, Recipe } from "@/data/recipes";
import { RECIPE_DETAILS } from "@/data/recipeDetails";

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  checked: boolean;
  fromRecipe?: string;
}

interface MealPlanItem {
  id: string;
  recipe: Recipe;
  mealType: string;
}

interface DayPlan {
  date: string;
  meals: MealPlanItem[];
}

const INGREDIENT_CATEGORIES: Record<string, string[]> = {
  "Produce": ["spinach", "lettuce", "tomato", "cucumber", "avocado", "banana", "berries", "apple", "lemon", "garlic", "onion", "ginger", "carrot", "pepper", "broccoli", "asparagus", "sweet potato", "mango", "mushroom", "basil", "cilantro", "dill", "parsley", "mint", "greens"],
  "Proteins": ["chicken", "salmon", "beef", "shrimp", "tuna", "egg", "tofu", "turkey", "pork", "lamb"],
  "Dairy": ["yogurt", "milk", "cheese", "butter", "cream", "feta", "mozzarella", "parmesan"],
  "Grains & Bread": ["oats", "rice", "quinoa", "bread", "tortilla", "pasta", "bagel", "granola", "noodle"],
  "Pantry": ["olive oil", "honey", "maple syrup", "soy sauce", "vinegar", "tahini", "peanut butter", "almond butter", "coconut milk", "chickpeas", "beans", "lentils", "chia seeds", "protein powder"],
  "Spices & Seasonings": ["salt", "pepper", "cumin", "cinnamon", "paprika", "curry", "oregano", "thyme", "rosemary"],
  "Other": []
};

function categorizeIngredient(ingredient: string): string {
  const lowerIngredient = ingredient.toLowerCase();
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}

function parseIngredient(ingredient: string): { name: string; quantity?: string } {
  // Try to extract quantity (e.g., "2 cups spinach" -> quantity: "2 cups", name: "spinach")
  const match = ingredient.match(/^([\d\/\s]+(cup|tbsp|tsp|oz|lb|g|ml|bunch|can|slice|piece|clove)s?\s*)/i);
  if (match) {
    return {
      quantity: match[1].trim(),
      name: ingredient.slice(match[1].length).trim()
    };
  }
  return { name: ingredient };
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [mealPlan, setMealPlan] = useState<Record<string, DayPlan>>({});

  // Load meal plan from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mealPlan");
    if (saved) {
      setMealPlan(JSON.parse(saved));
    }

    const savedItems = localStorage.getItem("shoppingList");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // Save shopping list to localStorage
  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(items));
  }, [items]);

  const generateFromMealPlan = () => {
    const newItems: ShoppingItem[] = [];
    const seenIngredients = new Set<string>();

    Object.values(mealPlan).forEach(dayPlan => {
      dayPlan.meals.forEach(meal => {
        const details = RECIPE_DETAILS[meal.recipe.id];
        if (details?.ingredients) {
          details.ingredients.forEach(ingredient => {
            const parsed = parseIngredient(ingredient);
            const key = parsed.name.toLowerCase();

            if (!seenIngredients.has(key)) {
              seenIngredients.add(key);
              newItems.push({
                id: `${Date.now()}-${Math.random()}`,
                name: parsed.name,
                quantity: parsed.quantity,
                category: categorizeIngredient(ingredient),
                checked: false,
                fromRecipe: meal.recipe.title
              });
            }
          });
        }
      });
    });

    if (newItems.length === 0) {
      toast.error("No recipes with ingredients found in your meal plan");
      return;
    }

    setItems(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} ingredients from meal plan`);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    const parsed = parseIngredient(newItemName);
    const newItem: ShoppingItem = {
      id: `${Date.now()}`,
      name: parsed.name,
      quantity: parsed.quantity,
      category: categorizeIngredient(newItemName),
      checked: false
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName("");
    toast.success("Item added");
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearChecked = () => {
    setItems(prev => prev.filter(item => !item.checked));
    toast.success("Checked items cleared");
  };

  const clearAll = () => {
    setItems([]);
    toast.success("Shopping list cleared");
  };

  const copyToClipboard = () => {
    const text = Object.entries(groupedItems)
      .map(([category, categoryItems]) =>
        `${category}:\n${categoryItems.map(item =>
          `  ${item.checked ? '✓' : '○'} ${item.quantity ? item.quantity + ' ' : ''}${item.name}`
        ).join('\n')}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const plannedMeals = Object.values(mealPlan).reduce((acc, day) => acc + day.meals.length, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management/meal-plan">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Shopping List</h1>
          <p className="text-muted-foreground">
            {totalItems} items • {checkedItems} checked
          </p>
        </div>
      </div>

      {/* Generate from Meal Plan */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-200">
                  {plannedMeals} meals planned
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Generate ingredients from your meal plan
                </p>
              </div>
            </div>
            <Button
              onClick={generateFromMealPlan}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={items.length === 0}>
          <Share2 className="w-4 h-4 mr-1" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={clearChecked} disabled={checkedItems === 0}>
          <Check className="w-4 h-4 mr-1" /> Clear Checked
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll} disabled={items.length === 0}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear All
        </Button>
      </div>

      {/* Add Item */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add item (e.g., 2 cups spinach)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button onClick={addItem} className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List by Category */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Your shopping list is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add items manually or generate from your meal plan
            </p>
            <Link href="/dashboard/weight-management/meal-plan">
              <Button>
                <Calendar className="w-4 h-4 mr-2" /> Go to Meal Planner
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="secondary">{categoryItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        item.checked ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.quantity && <span className="text-emerald-600">{item.quantity} </span>}
                          {item.name}
                        </p>
                        {item.fromRecipe && (
                          <p className="text-xs text-muted-foreground">
                            From: {item.fromRecipe}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress */}
      {items.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Shopping Progress</span>
              <span className="text-sm text-muted-foreground">
                {checkedItems} of {totalItems} items
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
