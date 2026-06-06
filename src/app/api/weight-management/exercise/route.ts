import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const CALORIES_PER_MINUTE: Record<string, Record<string, number>> = {
  WALKING: { LIGHT: 3.5, MODERATE: 5, VIGOROUS: 7, MAXIMUM: 9 },
  RUNNING: { LIGHT: 8, MODERATE: 11, VIGOROUS: 14, MAXIMUM: 17 },
  CYCLING: { LIGHT: 5, MODERATE: 8, VIGOROUS: 11, MAXIMUM: 14 },
  SWIMMING: { LIGHT: 6, MODERATE: 9, VIGOROUS: 12, MAXIMUM: 15 },
  STRENGTH_TRAINING: { LIGHT: 4, MODERATE: 6, VIGOROUS: 8, MAXIMUM: 10 },
  YOGA: { LIGHT: 2.5, MODERATE: 4, VIGOROUS: 5.5, MAXIMUM: 7 },
  PILATES: { LIGHT: 3, MODERATE: 4.5, VIGOROUS: 6, MAXIMUM: 7.5 },
  HIIT: { LIGHT: 8, MODERATE: 12, VIGOROUS: 15, MAXIMUM: 18 },
  DANCE: { LIGHT: 4, MODERATE: 6, VIGOROUS: 9, MAXIMUM: 12 },
  SPORTS: { LIGHT: 5, MODERATE: 8, VIGOROUS: 11, MAXIMUM: 14 },
  STRETCHING: { LIGHT: 2, MODERATE: 3, VIGOROUS: 4, MAXIMUM: 5 },
  OTHER: { LIGHT: 4, MODERATE: 6, VIGOROUS: 8, MAXIMUM: 10 },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const days = parseInt(searchParams.get("days") || "30");

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exerciseLogs = await prisma.exerciseLog.findMany({
      where: { userId, loggedAt: { gte: startDate } },
      orderBy: { loggedAt: "desc" },
    });

    const exerciseByDate: Record<string, typeof exerciseLogs> = {};
    exerciseLogs.forEach((log) => {
      const dateKey = new Date(log.loggedAt).toISOString().split("T")[0];
      if (!exerciseByDate[dateKey]) exerciseByDate[dateKey] = [];
      exerciseByDate[dateKey].push(log);
    });

    const weeklySummary = {
      totalMinutes: exerciseLogs.reduce((sum, l) => sum + l.durationMinutes, 0),
      totalCalories: exerciseLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0),
      totalWorkouts: exerciseLogs.length,
      activeDays: Object.keys(exerciseByDate).length,
    };

    const activityBreakdown: Record<string, { count: number; totalMinutes: number; totalCalories: number }> = {};
    exerciseLogs.forEach((log) => {
      if (!activityBreakdown[log.activityType]) {
        activityBreakdown[log.activityType] = { count: 0, totalMinutes: 0, totalCalories: 0 };
      }
      activityBreakdown[log.activityType].count++;
      activityBreakdown[log.activityType].totalMinutes += log.durationMinutes;
      activityBreakdown[log.activityType].totalCalories += log.caloriesBurned || 0;
    });

    return NextResponse.json({ exerciseLogs, exerciseByDate, weeklySummary, activityBreakdown });
  } catch (error) {
    console.error("Error fetching exercise logs:", error);
    return NextResponse.json({ error: "Failed to fetch exercise logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, name, description, durationMinutes, intensity, caloriesBurned, distance, steps, heartRateAvg, loggedAt, notes, userId } = body;

    if (!activityType || !name || !durationMinutes) {
      return NextResponse.json({ error: "Activity type, name, and duration are required" }, { status: 400 });
    }

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;
    const calPerMin = CALORIES_PER_MINUTE[activityType]?.[intensity || "MODERATE"] || 6;
    const estimatedCalories = caloriesBurned || Math.round(calPerMin * durationMinutes);

    const exerciseLog = await prisma.exerciseLog.create({
      data: {
        userId: targetUserId,
        activityType,
        name,
        description: description || null,
        durationMinutes,
        intensity: intensity || "MODERATE",
        caloriesBurned: estimatedCalories,
        distance: distance || null,
        steps: steps || null,
        heartRateAvg: heartRateAvg || null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        notes: notes || null,
      },
    });

    try {
      const { completeExerciseTaskIfLogged } = await import("@/lib/program/complete-task");
      await completeExerciseTaskIfLogged(targetUserId);
    } catch {
      /* optional */
    }

    return NextResponse.json(exerciseLog, { status: 201 });
  } catch (error) {
    console.error("Error logging exercise:", error);
    return NextResponse.json({ error: "Failed to log exercise" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Exercise ID required" }, { status: 400 });
    }

    const log = await prisma.exerciseLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Exercise log not found" }, { status: 404 });
    }

    if (log.userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.exerciseLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
