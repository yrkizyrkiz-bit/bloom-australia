import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { hasReachedNumericTarget } from "@/lib/goal-display";
import { overlayGoalWithActivePlan } from "@/lib/weight-management/apply-weight-plan";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [goals, latestWeight, activePlan] = await Promise.all([
      prisma.weightGoal.findMany({
        where: { userId, ...(includeCompleted ? {} : { status: "IN_PROGRESS" }) },
        orderBy: { createdAt: "desc" },
      }),
      prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.weightManagementPlan.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { version: "desc" },
      }),
    ]);

    const goalsWithProgress = goals.map((raw) => {
      const goal = overlayGoalWithActivePlan(raw, activePlan);
      const currentWeight = latestWeight?.weight || goal.currentWeight;
      const totalToLose = goal.startWeight - goal.targetWeight;
      const actualLost = goal.startWeight - currentWeight;
      const percentComplete = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((actualLost / totalToLose) * 100))) : 0;
      const daysRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const remainingToLose = Math.max(0, currentWeight - goal.targetWeight);
      const requiredWeeklyLoss = daysRemaining > 0 ? Math.round((remainingToLose / (daysRemaining / 7)) * 10) / 10 : 0;

      return {
        ...goal,
        currentWeight,
        actualLost: Math.round(actualLost * 10) / 10,
        percentComplete,
        remainingToLose: Math.round(remainingToLose * 10) / 10,
        daysRemaining,
        requiredWeeklyLoss,
        isOnTrack: requiredWeeklyLoss <= (goal.weeklyTargetLoss * 1.2),
      };
    });

    return NextResponse.json({
      goals: goalsWithProgress,
      activeGoal: goalsWithProgress.find(g => g.status === "IN_PROGRESS") || null,
    });
  } catch (error) {
    console.error("Error fetching weight goals:", error);
    return NextResponse.json({ error: "Failed to fetch weight goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startWeight, targetWeight, targetDate, weeklyTargetLoss, notes, userId } = body;

    if (!startWeight || !targetWeight || !targetDate) {
      return NextResponse.json({ error: "Start weight, target weight, and target date are required" }, { status: 400 });
    }

    if (targetWeight >= startWeight) {
      return NextResponse.json({ error: "Target weight must be less than start weight" }, { status: 400 });
    }

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;

    const existingGoal = await prisma.weightGoal.findFirst({
      where: { userId: targetUserId, status: "IN_PROGRESS" },
    });

    if (existingGoal) {
      await prisma.weightGoal.update({
        where: { id: existingGoal.id },
        data: { status: "PAUSED" },
      });
    }

    const totalToLose = startWeight - targetWeight;
    const milestones = [];
    for (let percent = 5; percent < 100; percent += 5) {
      milestones.push({
        weight: Math.round((startWeight - (totalToLose * percent / 100)) * 10) / 10,
        percent,
        reached: false,
        reachedAt: null,
      });
    }

    const goal = await prisma.weightGoal.create({
      data: {
        userId: targetUserId,
        startWeight,
        targetWeight,
        currentWeight: startWeight,
        targetDate: new Date(targetDate),
        weeklyTargetLoss: weeklyTargetLoss || 0.5,
        milestones: JSON.stringify(milestones),
        notes: notes || null,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating weight goal:", error);
    return NextResponse.json({ error: "Failed to create weight goal" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, targetWeight, targetDate, weeklyTargetLoss, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    const goal = await prisma.weightGoal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const latestWeight = await prisma.weightLog.findFirst({
      where: { userId: goal.userId },
      orderBy: { measuredAt: "desc" },
    });
    const currentWeight = latestWeight?.weight ?? goal.currentWeight;
    const nextTarget = targetWeight ?? goal.targetWeight;

    if (status === "ACHIEVED") {
      if (!hasReachedNumericTarget(currentWeight, nextTarget, goal.startWeight)) {
        return NextResponse.json(
          {
            error: `Goal is not complete yet. Current weight is ${currentWeight} kg; target is ${nextTarget} kg.`,
          },
          { status: 400 }
        );
      }
    }

    if (status === "IN_PROGRESS") {
      await prisma.weightGoal.updateMany({
        where: { userId: goal.userId, status: "IN_PROGRESS", id: { not: id } },
        data: { status: "PAUSED" },
      });
    }

    const updateData: Record<string, unknown> = { currentWeight };
    if (status) updateData.status = status;
    if (targetWeight) updateData.targetWeight = targetWeight;
    if (targetDate) updateData.targetDate = new Date(targetDate);
    if (weeklyTargetLoss) updateData.weeklyTargetLoss = weeklyTargetLoss;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "ACHIEVED") updateData.completedAt = new Date();

    const updatedGoal = await prisma.weightGoal.update({ where: { id }, data: updateData });
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating weight goal:", error);
    return NextResponse.json({ error: "Failed to update weight goal" }, { status: 500 });
  }
}
