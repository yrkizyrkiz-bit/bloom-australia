import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get("mealType");
    const dietary = searchParams.get("dietary");
    const search = searchParams.get("q");
    const featured = searchParams.get("featured") === "true";

    const where: Record<string, unknown> = { isPublished: true };

    if (mealType) where.mealType = mealType;
    if (featured) where.isFeatured = true;
    if (dietary) where.dietaryTags = { has: dietary };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    // Group by meal type for easy display
    const byMealType = {
      BREAKFAST: recipes.filter(r => r.mealType === "BREAKFAST"),
      LUNCH: recipes.filter(r => r.mealType === "LUNCH"),
      DINNER: recipes.filter(r => r.mealType === "DINNER"),
      DESSERT: recipes.filter(r => r.mealType === "DESSERT"),
      SNACK: recipes.filter(r => r.mealType === "SNACK"),
    };

    return NextResponse.json({ recipes, byMealType, total: recipes.length });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, imageUrl, mealType, dietaryTags, prepTime, cookTime, servings, difficulty, calories, protein, carbs, fat, ingredients, instructions, tips } = body;

    if (!title || !description || !mealType || !ingredients || !instructions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        mealType,
        dietaryTags: dietaryTags || [],
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        difficulty: difficulty || "EASY",
        calories: calories || null,
        protein: protein || null,
        carbs: carbs || null,
        fat: fat || null,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        tips: tips || null,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
