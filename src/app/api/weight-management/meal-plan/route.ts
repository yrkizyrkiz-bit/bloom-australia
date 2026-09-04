import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWeightManagementUser } from "@/lib/wm/is-wm-user";
import { completeProgramTaskForToday } from "@/lib/program/complete-task";
import { parseWeekStartParam } from "@/lib/weight-management/meal-plan-week";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isWeightManagementUser(session.user.id))) {
      return NextResponse.json({ error: "Not a weight management member" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = parseWeekStartParam(searchParams.get("weekStart"));

    const row = await prisma.wmMealPlanWeek.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        weekStart: weekStart.toISOString(),
        planData: row?.planData ?? null,
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("[meal-plan GET]", error);
    return NextResponse.json({ error: "Failed to load meal plan" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isWeightManagementUser(session.user.id))) {
      return NextResponse.json({ error: "Not a weight management member" }, { status: 403 });
    }

    const { weekStart: weekStartRaw, planData } = await request.json();
    if (planData === undefined || planData === null || typeof planData !== "object") {
      return NextResponse.json({ error: "planData required" }, { status: 400 });
    }

    const weekStart = parseWeekStartParam(
      typeof weekStartRaw === "string" ? weekStartRaw : null
    );

    const row = await prisma.wmMealPlanWeek.upsert({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart,
        },
      },
      create: {
        userId: session.user.id,
        weekStart,
        planData,
      },
      update: { planData },
    });

    const today = new Date().toISOString().split("T")[0];
    const todayMeals = (planData as Record<string, { meals?: unknown[] }>)?.[today]?.meals;
    if (todayMeals && todayMeals.length > 0) {
      await completeProgramTaskForToday(session.user.id, "MEAL_LOG");
    }

    return NextResponse.json({ success: true, id: row.id, weekStart: weekStart.toISOString() });
  } catch (error) {
    console.error("[meal-plan POST]", error);
    return NextResponse.json({ error: "Failed to save meal plan" }, { status: 500 });
  }
}
