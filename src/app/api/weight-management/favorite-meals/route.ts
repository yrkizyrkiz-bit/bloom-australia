import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  favoriteMealOwnerWhere,
  normalizeFavoriteMeal,
  toPublicFavoriteMeal,
} from "@/lib/weight-management/favorite-meals";

const noStore = { "Cache-Control": "no-store" };

async function requireMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

export async function GET() {
  try {
    const auth = await requireMember();
    if (auth.error) return auth.error;

    const favorites = await prisma.favoriteMeal.findMany({
      where: favoriteMealOwnerWhere(auth.userId),
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(
      { favorites: favorites.map(toPublicFavoriteMeal) },
      { headers: noStore }
    );
  } catch (error) {
    console.error("[favorite-meals GET]", error);
    return NextResponse.json({ error: "Failed to load favourites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMember();
    if (auth.error) return auth.error;

    const body = (await request.json()) as Record<string, unknown>;
    const meal = normalizeFavoriteMeal({
      name: body.name,
      mealType: body.mealType,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
    });
    if (!meal) {
      return NextResponse.json({ error: "Meal name and type are required" }, { status: 400 });
    }

    const favorite = await prisma.favoriteMeal.upsert({
      where: {
        userId_nameKey_mealType: {
          userId: auth.userId,
          nameKey: meal.nameKey,
          mealType: meal.mealType,
        },
      },
      create: {
        userId: auth.userId,
        name: meal.name,
        nameKey: meal.nameKey,
        mealType: meal.mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      update: {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
    });

    return NextResponse.json(toPublicFavoriteMeal(favorite), { status: 201, headers: noStore });
  } catch (error) {
    console.error("[favorite-meals POST]", error);
    return NextResponse.json({ error: "Failed to save favourite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireMember();
    if (auth.error) return auth.error;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Favourite ID required" }, { status: 400 });
    }

    const removed = await prisma.favoriteMeal.deleteMany({
      where: favoriteMealOwnerWhere(auth.userId, id),
    });
    if (removed.count === 0) {
      return NextResponse.json({ error: "Favourite not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (error) {
    console.error("[favorite-meals DELETE]", error);
    return NextResponse.json({ error: "Failed to remove favourite" }, { status: 500 });
  }
}
