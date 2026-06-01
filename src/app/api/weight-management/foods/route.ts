import { NextRequest, NextResponse } from "next/server";
import { searchFoods, getFoodsByCategory, getFoodById, FOOD_CATEGORIES, FoodCategory } from "@/data/foodDatabase";

// GET - Search foods or get by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") as FoodCategory | null;
    const id = searchParams.get("id");

    // Get food by ID
    if (id) {
      const food = getFoodById(id);
      if (!food) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }
      return NextResponse.json(food);
    }

    // Search or filter
    let foods;
    if (category && !query) {
      foods = getFoodsByCategory(category);
    } else {
      foods = searchFoods(query, category || undefined);
    }

    return NextResponse.json({
      foods,
      categories: FOOD_CATEGORIES,
      total: foods.length,
    });
  } catch (error) {
    console.error("Error searching foods:", error);
    return NextResponse.json({ error: "Failed to search foods" }, { status: 500 });
  }
}
