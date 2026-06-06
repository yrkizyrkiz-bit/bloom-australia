import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Fetch comprehensive progress data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const days = parseInt(searchParams.get("days") || "90");

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all data in parallel
    const [weightLogs, exerciseLogs, mealLogs, checkIns, activeGoal] = await Promise.all([
      prisma.weightLog.findMany({
        where: { userId, measuredAt: { gte: startDate } },
        orderBy: { measuredAt: "asc" },
      }),
      prisma.exerciseLog.findMany({
        where: { userId, loggedAt: { gte: startDate } },
        orderBy: { loggedAt: "desc" },
      }),
      prisma.mealLog.findMany({
        where: { userId, loggedAt: { gte: startDate } },
        orderBy: { loggedAt: "desc" },
      }),
      prisma.weeklyCheckIn.findMany({
        where: { userId },
        orderBy: { weekNumber: "desc" },
        take: 12,
      }),
      prisma.weightGoal.findFirst({
        where: { userId, status: "IN_PROGRESS" },
      }),
    ]);

    // Weight progress
    const currentWeight = weightLogs[weightLogs.length - 1]?.weight || null;
    const startWeight = weightLogs[0]?.weight || currentWeight;
    const weightChange = currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0;

    // Weekly weight averages for chart
    const weeklyWeights: { week: string; avgWeight: number; minWeight: number; maxWeight: number }[] = [];
    const weightsByWeek: Record<string, number[]> = {};

    weightLogs.forEach((log) => {
      const date = new Date(log.measuredAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!weightsByWeek[weekKey]) weightsByWeek[weekKey] = [];
      weightsByWeek[weekKey].push(log.weight);
    });

    Object.entries(weightsByWeek).forEach(([week, weights]) => {
      weeklyWeights.push({
        week,
        avgWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
        minWeight: Math.min(...weights),
        maxWeight: Math.max(...weights),
      });
    });

    // Exercise summary
    const totalExerciseMinutes = exerciseLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalCaloriesBurned = exerciseLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);
    const exerciseDays = new Set(exerciseLogs.map(l => new Date(l.loggedAt).toISOString().split("T")[0])).size;

    // Nutrition summary
    const totalMeals = mealLogs.length;
    const avgDailyCalories = mealLogs.length > 0
      ? Math.round(mealLogs.reduce((sum, m) => sum + (m.calories || 0), 0) / days)
      : 0;

    // Check-in trends
    const checkInTrends = checkIns.map(c => ({
      week: c.weekNumber,
      feeling: c.overallFeeling,
      energy: c.energyLevel,
      sleep: c.sleepQuality,
      stress: c.stressLevel,
    })).reverse();

    // Goal progress
    let goalProgress = null;
    if (activeGoal && currentWeight) {
      const totalToLose = activeGoal.startWeight - activeGoal.targetWeight;
      const actualLost = activeGoal.startWeight - currentWeight;
      goalProgress = {
        ...activeGoal,
        currentWeight,
        totalToLose: Math.round(totalToLose * 10) / 10,
        actualLost: Math.round(actualLost * 10) / 10,
        percentComplete: Math.min(100, Math.max(0, Math.round((actualLost / totalToLose) * 100))),
        remainingToLose: Math.round(Math.max(0, currentWeight - activeGoal.targetWeight) * 10) / 10,
      };
    }

    // Calculate consistency score (0-100)
    const weightLogDays = new Set(weightLogs.map(l => new Date(l.measuredAt).toISOString().split("T")[0])).size;
    const consistencyScore = Math.round(((weightLogDays / days) * 40) + ((exerciseDays / days) * 40) + (checkIns.length >= 4 ? 20 : checkIns.length * 5));

    return NextResponse.json({
      summary: {
        currentWeight,
        startWeight,
        weightChange,
        totalExerciseMinutes,
        totalCaloriesBurned,
        exerciseDays,
        totalMeals,
        avgDailyCalories,
        consistencyScore: Math.min(100, consistencyScore),
        daysTracked: days,
      },
      weightProgress: {
        logs: weightLogs,
        weeklyAverages: weeklyWeights,
      },
      exerciseProgress: {
        totalWorkouts: exerciseLogs.length,
        totalMinutes: totalExerciseMinutes,
        caloriesBurned: totalCaloriesBurned,
      },
      checkInTrends,
      goalProgress,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
