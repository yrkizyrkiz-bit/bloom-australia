import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    const weightLogs = await prisma.weightLog.findMany({
      where: { userId, measuredAt: { gte: startDate } },
      orderBy: { measuredAt: "desc" },
    });

    const currentWeight = weightLogs[0]?.weight || null;
    const startingWeight = weightLogs[weightLogs.length - 1]?.weight || currentWeight;
    const weightChange = currentWeight && startingWeight ? Math.round((currentWeight - startingWeight) * 10) / 10 : 0;

    const weeklyData: { week: string; avgWeight: number }[] = [];
    const groupedByWeek: Record<string, number[]> = {};

    weightLogs.forEach((log) => {
      const date = new Date(log.measuredAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!groupedByWeek[weekKey]) groupedByWeek[weekKey] = [];
      groupedByWeek[weekKey].push(log.weight);
    });

    Object.entries(groupedByWeek).sort(([a], [b]) => a.localeCompare(b)).forEach(([week, weights]) => {
      weeklyData.push({
        week,
        avgWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
      });
    });

    const activeGoal = await prisma.weightGoal.findFirst({
      where: { userId, status: "IN_PROGRESS" },
    });

    let goalProgress = null;
    if (activeGoal && currentWeight) {
      const totalToLose = activeGoal.startWeight - activeGoal.targetWeight;
      const actualLost = activeGoal.startWeight - currentWeight;
      goalProgress = {
        ...activeGoal,
        currentWeight,
        weightLost: Math.round(actualLost * 10) / 10,
        percentComplete: Math.min(100, Math.round((actualLost / totalToLose) * 100)),
        remainingWeight: Math.round((currentWeight - activeGoal.targetWeight) * 10) / 10,
      };
    }

    return NextResponse.json({
      weightLogs: weightLogs.reverse(),
      currentWeight,
      startingWeight,
      weightChange,
      weeklyData,
      activeGoal: goalProgress,
    });
  } catch (error) {
    console.error("Error fetching weight logs:", error);
    return NextResponse.json({ error: "Failed to fetch weight logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weight, waistCircumference, measuredAt, source, notes, userId } = body;

    if (!weight || weight <= 0) {
      return NextResponse.json({ error: "Valid weight is required" }, { status: 400 });
    }

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;

    const weightLog = await prisma.weightLog.create({
      data: {
        userId: targetUserId,
        weight,
        waistCircumference: waistCircumference || null,
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        source: source || "MANUAL",
        notes: notes || null,
      },
    });

    const activeGoal = await prisma.weightGoal.findFirst({
      where: { userId: targetUserId, status: "IN_PROGRESS" },
    });

    if (activeGoal) {
      await prisma.weightGoal.update({
        where: { id: activeGoal.id },
        data: {
          currentWeight: weight,
          ...(weight <= activeGoal.targetWeight && { status: "ACHIEVED", completedAt: new Date() }),
        },
      });
    }

    return NextResponse.json(weightLog, { status: 201 });
  } catch (error) {
    console.error("Error logging weight:", error);
    return NextResponse.json({ error: "Failed to log weight" }, { status: 500 });
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
      return NextResponse.json({ error: "Weight log ID required" }, { status: 400 });
    }

    const log = await prisma.weightLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Weight log not found" }, { status: 404 });
    }

    if (log.userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.weightLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting weight log:", error);
    return NextResponse.json({ error: "Failed to delete weight log" }, { status: 500 });
  }
}
