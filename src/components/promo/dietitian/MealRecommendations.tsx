"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Flame, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

interface Meal {
  id: number;
  name: string;
  image: string;
  calories: number;
  protein: number;
  prepTime: number;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients: string[];
  tags: string[];
}

const meals: Meal[] = [
  // Breakfast (5)
  {
    id: 1,
    name: "Greek Yogurt Protein Bowl",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    calories: 320,
    protein: 28,
    prepTime: 5,
    category: "breakfast",
    ingredients: ["Greek yogurt", "Mixed berries", "Chia seeds", "Honey", "Almonds", "Granola"],
    tags: ["High protein", "Quick prep"],
  },
  {
    id: 2,
    name: "Spinach & Feta Egg White Omelette",
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80",
    calories: 245,
    protein: 26,
    prepTime: 10,
    category: "breakfast",
    ingredients: ["Egg whites", "Fresh spinach", "Feta cheese", "Cherry tomatoes", "Olive oil", "Fresh herbs"],
    tags: ["Low carb", "High protein"],
  },
  {
    id: 3,
    name: "Overnight Protein Oats",
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80",
    calories: 380,
    protein: 32,
    prepTime: 5,
    category: "breakfast",
    ingredients: ["Rolled oats", "Protein powder", "Almond milk", "Banana", "Peanut butter", "Cinnamon"],
    tags: ["Meal prep", "High protein"],
  },
  {
    id: 4,
    name: "Smoked Salmon Avocado Toast",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
    calories: 340,
    protein: 24,
    prepTime: 8,
    category: "breakfast",
    ingredients: ["Sourdough bread", "Smoked salmon", "Avocado", "Cream cheese", "Capers", "Dill"],
    tags: ["Omega-3 rich", "Satisfying"],
  },
  {
    id: 5,
    name: "Cottage Cheese Pancakes",
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=80",
    calories: 295,
    protein: 30,
    prepTime: 15,
    category: "breakfast",
    ingredients: ["Cottage cheese", "Eggs", "Oat flour", "Vanilla extract", "Mixed berries", "Maple syrup"],
    tags: ["High protein", "Low sugar"],
  },

  // Lunch (5)
  {
    id: 6,
    name: "Grilled Chicken Caesar Salad",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80",
    calories: 385,
    protein: 42,
    prepTime: 15,
    category: "lunch",
    ingredients: ["Chicken breast", "Romaine lettuce", "Parmesan", "Caesar dressing", "Croutons", "Lemon"],
    tags: ["Classic", "High protein"],
  },
  {
    id: 7,
    name: "Tuna Poke Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    calories: 420,
    protein: 38,
    prepTime: 20,
    category: "lunch",
    ingredients: ["Fresh tuna", "Sushi rice", "Edamame", "Cucumber", "Avocado", "Sesame seeds", "Soy sauce"],
    tags: ["Japanese inspired", "Fresh"],
  },
  {
    id: 8,
    name: "Turkey & Quinoa Stuffed Peppers",
    image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&q=80",
    calories: 355,
    protein: 34,
    prepTime: 35,
    category: "lunch",
    ingredients: ["Bell peppers", "Ground turkey", "Quinoa", "Black beans", "Corn", "Cheese", "Salsa"],
    tags: ["Meal prep friendly", "Filling"],
  },
  {
    id: 9,
    name: "Asian Chicken Lettuce Wraps",
    image: "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&q=80",
    calories: 280,
    protein: 32,
    prepTime: 15,
    category: "lunch",
    ingredients: ["Ground chicken", "Butter lettuce", "Water chestnuts", "Hoisin sauce", "Ginger", "Green onions"],
    tags: ["Low carb", "Fresh"],
  },
  {
    id: 10,
    name: "Mediterranean Chickpea Bowl",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    calories: 395,
    protein: 18,
    prepTime: 15,
    category: "lunch",
    ingredients: ["Chickpeas", "Cucumber", "Tomatoes", "Red onion", "Feta cheese", "Olive oil", "Lemon"],
    tags: ["Plant-based", "Mediterranean"],
  },

  // Dinner (7)
  {
    id: 11,
    name: "Herb-Crusted Salmon",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    calories: 410,
    protein: 44,
    prepTime: 25,
    category: "dinner",
    ingredients: ["Salmon fillet", "Fresh herbs", "Garlic", "Lemon", "Asparagus", "Olive oil"],
    tags: ["Omega-3 rich", "Heart healthy"],
  },
  {
    id: 12,
    name: "Lean Beef Stir-Fry",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
    calories: 380,
    protein: 36,
    prepTime: 20,
    category: "dinner",
    ingredients: ["Lean beef strips", "Broccoli", "Bell peppers", "Snap peas", "Garlic", "Soy sauce", "Ginger"],
    tags: ["Quick cook", "High protein"],
  },
  {
    id: 13,
    name: "Grilled Chicken with Roasted Vegetables",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80",
    calories: 365,
    protein: 40,
    prepTime: 30,
    category: "dinner",
    ingredients: ["Chicken breast", "Zucchini", "Bell peppers", "Red onion", "Cherry tomatoes", "Herbs", "Olive oil"],
    tags: ["Simple", "Wholesome"],
  },
  {
    id: 14,
    name: "Shrimp & Cauliflower Rice",
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80",
    calories: 295,
    protein: 32,
    prepTime: 20,
    category: "dinner",
    ingredients: ["Prawns", "Cauliflower rice", "Garlic", "Lemon", "Parsley", "Chilli flakes", "Olive oil"],
    tags: ["Low carb", "Keto friendly"],
  },
  {
    id: 15,
    name: "Turkey Meatballs with Zoodles",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80",
    calories: 340,
    protein: 38,
    prepTime: 30,
    category: "dinner",
    ingredients: ["Ground turkey", "Zucchini noodles", "Marinara sauce", "Parmesan", "Italian herbs", "Garlic"],
    tags: ["Low carb", "Family friendly"],
  },
  {
    id: 16,
    name: "Baked Cod with Lemon Butter",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
    calories: 285,
    protein: 36,
    prepTime: 20,
    category: "dinner",
    ingredients: ["Cod fillet", "Butter", "Lemon", "Capers", "Dill", "Green beans"],
    tags: ["Light", "Elegant"],
  },
  {
    id: 17,
    name: "Chicken Tikka with Raita",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
    calories: 395,
    protein: 42,
    prepTime: 35,
    category: "dinner",
    ingredients: ["Chicken thighs", "Greek yogurt", "Tikka spices", "Cucumber", "Mint", "Basmati rice"],
    tags: ["Indian inspired", "Flavourful"],
  },

  // Snacks (3)
  {
    id: 18,
    name: "Protein Energy Balls",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80",
    calories: 145,
    protein: 8,
    prepTime: 15,
    category: "snack",
    ingredients: ["Oats", "Protein powder", "Peanut butter", "Honey", "Dark chocolate chips", "Chia seeds"],
    tags: ["No bake", "Portable"],
  },
  {
    id: 19,
    name: "Cottage Cheese & Fruit",
    image: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&q=80",
    calories: 180,
    protein: 18,
    prepTime: 3,
    category: "snack",
    ingredients: ["Cottage cheese", "Peaches", "Honey", "Cinnamon", "Walnuts"],
    tags: ["Quick", "High protein"],
  },
  {
    id: 20,
    name: "Edamame & Hummus Plate",
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80",
    calories: 220,
    protein: 14,
    prepTime: 5,
    category: "snack",
    ingredients: ["Edamame", "Hummus", "Carrot sticks", "Cucumber", "Cherry tomatoes", "Pita crisps"],
    tags: ["Plant-based", "Satisfying"],
  },
];

const categories = [
  { id: "all", label: "All Meals" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snacks" },
];

export function MealRecommendations() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const filteredMeals = activeCategory === "all"
    ? meals
    : meals.filter(meal => meal.category === activeCategory);

  const toggleMeal = (id: number) => {
    setExpandedMeal(expandedMeal === id ? null : id);
  };

  return (
    <section id="meals" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#e6ebe3] to-transparent" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#5c7a52]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            Sample meal{" "}
            <span className="text-[#5c7a52] italic">recommendations</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Protein-rich, nutritionally balanced meals designed to support your weight management goals without sacrificing taste.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${activeCategory === category.id
                  ? "bg-[#34412f] text-white shadow-lg"
                  : "bg-[#e6ebe3] text-[#5c7a52] hover:bg-[#cdd8c6]"
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Meals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMeals.map((meal) => (
            <div
              key={meal.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e6ebe3] hover:shadow-xl hover:border-[#cdd8c6] transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={meal.image}
                  alt={meal.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-[#34412f] capitalize">
                    {meal.category}
                  </span>
                </div>

                {/* Tags */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                  {meal.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#5c7a52]/90 text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-serif text-[#2c3628] mb-3 leading-snug">
                  {meal.name}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Flame className="w-4 h-4 text-[#c17a58]" />
                    <span className="text-[#5c7a52]">{meal.calories} cal</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Dumbbell className="w-4 h-4 text-[#5c7a52]" />
                    <span className="text-[#5c7a52]">{meal.protein}g protein</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-[#7e9a72]" />
                    <span className="text-[#5c7a52]">{meal.prepTime}m</span>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => toggleMeal(meal.id)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[#f4f7f2] hover:bg-[#e6ebe3] transition-colors text-sm text-[#5c7a52]"
                >
                  <span>View ingredients</span>
                  {expandedMeal === meal.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Expanded Ingredients */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${expandedMeal === meal.id ? "max-h-48 mt-4" : "max-h-0"}
                  `}
                >
                  <div className="p-3 bg-[#f4f7f2] rounded-xl">
                    <p className="text-xs font-medium text-[#34412f] mb-2">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="px-2 py-1 rounded-lg text-xs bg-white text-[#5c7a52] border border-[#e6ebe3]"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#7e9a72]">
            These are sample recommendations. Your dietitian will create a personalised meal plan based on your specific needs, preferences, and health goals.
          </p>
        </div>
      </div>
    </section>
  );
}
