"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Heart, Clock, Flame, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface MealGalleryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  calories: number;
  prepTime: string;
  tags: string[];
}

// Curated meal gallery with beautiful images
const MEAL_GALLERY: MealGalleryItem[] = [
  // Breakfast
  {
    id: "1",
    name: "Greek Yogurt Parfait",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop",
    category: "Breakfast",
    calories: 280,
    prepTime: "5 min",
    tags: ["high-protein", "quick"]
  },
  {
    id: "2",
    name: "Avocado Toast with Eggs",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop",
    category: "Breakfast",
    calories: 420,
    prepTime: "10 min",
    tags: ["healthy-fats", "filling"]
  },
  {
    id: "3",
    name: "Overnight Oats",
    image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&h=400&fit=crop",
    category: "Breakfast",
    calories: 350,
    prepTime: "5 min",
    tags: ["meal-prep", "fiber"]
  },
  {
    id: "4",
    name: "Smoothie Bowl",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop",
    category: "Breakfast",
    calories: 320,
    prepTime: "10 min",
    tags: ["antioxidants", "refreshing"]
  },
  // Lunch
  {
    id: "5",
    name: "Buddha Bowl",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    category: "Lunch",
    calories: 520,
    prepTime: "20 min",
    tags: ["balanced", "colorful"]
  },
  {
    id: "6",
    name: "Grilled Chicken Salad",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
    category: "Lunch",
    calories: 450,
    prepTime: "15 min",
    tags: ["high-protein", "low-carb"]
  },
  {
    id: "7",
    name: "Mediterranean Wrap",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop",
    category: "Lunch",
    calories: 480,
    prepTime: "10 min",
    tags: ["portable", "fresh"]
  },
  {
    id: "8",
    name: "Quinoa Power Bowl",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop",
    category: "Lunch",
    calories: 490,
    prepTime: "25 min",
    tags: ["complete-protein", "filling"]
  },
  // Dinner
  {
    id: "9",
    name: "Grilled Salmon",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
    category: "Dinner",
    calories: 480,
    prepTime: "25 min",
    tags: ["omega-3", "heart-healthy"]
  },
  {
    id: "10",
    name: "Stir-Fry Vegetables",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop",
    category: "Dinner",
    calories: 380,
    prepTime: "20 min",
    tags: ["quick", "vegetarian"]
  },
  {
    id: "11",
    name: "Grilled Steak",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=400&fit=crop",
    category: "Dinner",
    calories: 550,
    prepTime: "30 min",
    tags: ["high-protein", "iron"]
  },
  {
    id: "12",
    name: "Herb Roasted Chicken",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=400&fit=crop",
    category: "Dinner",
    calories: 420,
    prepTime: "45 min",
    tags: ["comfort-food", "family"]
  },
  // Snacks
  {
    id: "13",
    name: "Fresh Fruit Plate",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop",
    category: "Snacks",
    calories: 150,
    prepTime: "5 min",
    tags: ["vitamins", "refreshing"]
  },
  {
    id: "14",
    name: "Hummus & Veggies",
    image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&h=400&fit=crop",
    category: "Snacks",
    calories: 180,
    prepTime: "5 min",
    tags: ["fiber", "protein"]
  },
  {
    id: "15",
    name: "Protein Smoothie",
    image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&h=400&fit=crop",
    category: "Snacks",
    calories: 250,
    prepTime: "5 min",
    tags: ["post-workout", "energizing"]
  },
  {
    id: "16",
    name: "Mixed Nuts",
    image: "https://images.unsplash.com/photo-1606050627529-2f3c8c6b0b94?w=600&h=400&fit=crop",
    category: "Snacks",
    calories: 200,
    prepTime: "0 min",
    tags: ["healthy-fats", "portable"]
  },
];

interface MealGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMeal?: (meal: MealGalleryItem) => void;
}

export function MealGallery({ open, onOpenChange, onSelectMeal }: MealGalleryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState<MealGalleryItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snacks"];

  const filteredMeals = MEAL_GALLERY.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === "All" || meal.category === category;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const handleSelectMeal = (meal: MealGalleryItem) => {
    onSelectMeal?.(meal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Meal Inspiration Gallery
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Browse delicious, healthy meals for ideas and inspiration
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search meals or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Gallery grid */}
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
                    transition={{ delay: index * 0.03 }}
                    className="group relative rounded-xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setSelectedMeal(meal)}
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    {/* Favorite button */}
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(meal.id);
                      }}
                    >
                      <Heart
                        className={`w-4 h-4 ${favorites.has(meal.id) ? "fill-rose-500 text-rose-500" : "text-white"}`}
                      />
                    </button>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-medium text-sm line-clamp-1">{meal.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {meal.calories} cal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.prepTime}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredMeals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No meals found matching your search.</p>
                <Button variant="link" onClick={() => { setSearch(""); setCategory("All"); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Meal detail modal */}
        <AnimatePresence>
          {selectedMeal && (
            <motion.div
              className="absolute inset-0 bg-background z-10 flex flex-col"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25 }}
            >
              {/* Back button */}
              <div className="p-4 border-b">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMeal(null)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to gallery
                </Button>
              </div>

              {/* Meal detail content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  {/* Hero image */}
                  <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                    <img
                      src={selectedMeal.image}
                      alt={selectedMeal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title and badges */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between">
                      <h2 className="text-2xl font-bold">{selectedMeal.name}</h2>
                      <button
                        className="p-2 rounded-full hover:bg-muted"
                        onClick={() => toggleFavorite(selectedMeal.id)}
                      >
                        <Heart
                          className={`w-6 h-6 ${favorites.has(selectedMeal.id) ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`}
                        />
                      </button>
                    </div>
                    <Badge variant="secondary" className="mt-2">{selectedMeal.category}</Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                      <Flame className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{selectedMeal.calories}</p>
                        <p className="text-sm text-muted-foreground">calories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                      <Clock className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{selectedMeal.prepTime}</p>
                        <p className="text-sm text-muted-foreground">prep time</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleSelectMeal(selectedMeal)}
                  >
                    Log this meal
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

// Compact gallery preview for embedding in other pages
export function MealGalleryPreview({
  onViewAll
}: {
  onViewAll: () => void;
}) {
  const featuredMeals = MEAL_GALLERY.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Meal inspiration
        </h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {featuredMeals.map((meal) => (
          <div
            key={meal.id}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onViewAll}
          >
            <img
              src={meal.image}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
