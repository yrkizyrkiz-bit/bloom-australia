import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Fetch meal logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const days = parseInt(searchParams.get("days") || "7");
    const date = searchParams.get("date");

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let startDate: Date;
    let endDate: Date;

    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    }

    const mealLogs = await prisma.mealLog.findMany({
      where: {
        userId,
        loggedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { loggedAt: "desc" },
    });

    const mealsByDate: Record<string, typeof mealLogs> = {};
    mealLogs.forEach((meal) => {
      const dateKey = new Date(meal.loggedAt).toISOString().split("T")[0];
      if (!mealsByDate[dateKey]) mealsByDate[dateKey] = [];
      mealsByDate[dateKey].push(meal);
    });

    const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number; mealCount: number }> = {};
    Object.entries(mealsByDate).forEach(([dateKey, meals]) => {
      dailyTotals[dateKey] = {
        calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        protein: Math.round(meals.reduce((sum, m) => sum + (m.protein || 0), 0) * 10) / 10,
        carbs: Math.round(meals.reduce((sum, m) => sum + (m.carbs || 0), 0) * 10) / 10,
        fat: Math.round(meals.reduce((sum, m) => sum + (m.fat || 0), 0) * 10) / 10,
        mealCount: meals.length,
      };
    });

    const todayKey = new Date().toISOString().split("T")[0];
    const todayTotals = dailyTotals[todayKey] || { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };

    return NextResponse.json({ mealLogs, mealsByDate, dailyTotals, todayTotals });
  } catch (error) {
    console.error("Error fetching meal logs:", error);
    return NextResponse.json({ error: "Failed to fetch meal logs" }, { status: 500 });
  }
}

// POST - Log meal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealType, name, description, calories, protein, carbs, fat, fiber, portionSize, loggedAt, notes, tags, userId } = body;

    if (!mealType || !name) {
      return NextResponse.json({ error: "Meal type and name are required" }, { status: 400 });
    }

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;

    const meal = await prisma.mealLog.create({
      data: {
        userId: targetUserId,
        mealType,
        name,
        description: description || null,
        calories: calories || null,
        protein: protein || null,
        carbs: carbs || null,
        fat: fat || null,
        fiber: fiber || null,
        portionSize: portionSize || null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        notes: notes || null,
        tags: tags || [],
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Error logging meal:", error);
    return NextResponse.json({ error: "Failed to log meal" }, { status: 500 });
  }
}

// DELETE - Delete meal log
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Meal ID required" }, { status: 400 });
    }

    const meal = await prisma.mealLog.findUnique({ where: { id } });
    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    if (meal.userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.mealLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal:", error);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
