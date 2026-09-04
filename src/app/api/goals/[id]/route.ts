import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { normalizeHealthGoalStatus } from "@/lib/goal-deduplication";
import { hasReachedNumericTarget } from "@/lib/goal-display";

// GET /api/goals/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const goal = await prisma.healthGoal.findUnique({
      where: { id },
      include: { biomarker: { select: { name: true, shortName: true, category: true, unit: true, improvementTips: true } } },
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/goals/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { currentValue, targetValue, targetDate, status, notes } = body;

    const existing = await prisma.healthGoal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let normalizedStatus: ReturnType<typeof normalizeHealthGoalStatus> | undefined;
    if (status !== undefined) {
      try {
        normalizedStatus = normalizeHealthGoalStatus(status);
      } catch {
        return NextResponse.json({ error: "Invalid goal status" }, { status: 400 });
      }
    }

    const nextCurrent = currentValue ?? existing.currentValue;
    const nextTarget = targetValue ?? existing.targetValue;
    if (
      normalizedStatus === "ACHIEVED" &&
      !hasReachedNumericTarget(nextCurrent, nextTarget, existing.startValue)
    ) {
      return NextResponse.json(
        {
          error: `Goal is not complete yet. Current is ${nextCurrent}; target is ${nextTarget}.`,
        },
        { status: 400 }
      );
    }

    const goal = await prisma.healthGoal.update({
      where: { id },
      data: {
        ...(currentValue !== undefined && { currentValue }),
        ...(targetValue !== undefined && { targetValue }),
        ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
        ...(normalizedStatus !== undefined && { status: normalizedStatus }),
        ...(notes !== undefined && { notes }),
        ...(normalizedStatus === "ACHIEVED" && { completedAt: new Date() }),
      },
      include: { biomarker: { select: { name: true, shortName: true, category: true, unit: true } } },
    });

    if (normalizedStatus === "ACHIEVED") {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: "SUCCESS",
          title: "Goal Achieved!",
          message: `Congratulations! You've achieved your goal for ${goal.biomarker.name}.`,
          category: "GOAL",
          actionUrl: "/dashboard/goals",
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: normalizedStatus === "ACHIEVED" ? "GOAL_ACHIEVED" : "GOAL_UPDATED",
        entity: "health_goal",
        entityId: goal.id,
        details: { status: goal.status },
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/goals/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.healthGoal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.healthGoal.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "GOAL_DELETED", entity: "health_goal", entityId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
