import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { appendReviewNote } from "@/lib/goal-review";

// POST /api/goals/[id]/review — mark achieved or schedule next review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, nextReviewDate, reviewNotes } = body as {
      action?: "achieve" | "continue";
      nextReviewDate?: string;
      reviewNotes?: string;
    };

    if (!action || !["achieve", "continue"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'achieve' or 'continue'" },
        { status: 400 }
      );
    }

    const existing = await prisma.healthGoal.findUnique({
      where: { id },
      include: {
        biomarker: { select: { name: true, shortName: true, category: true, unit: true } },
      },
    });

    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (existing.status === "ACHIEVED") {
      return NextResponse.json({ error: "Goal is already achieved" }, { status: 400 });
    }

    const updatedNotes = appendReviewNote(existing.notes, reviewNotes || "");

    const latestResult = await prisma.biomarkerResult.findFirst({
      where: { userId: existing.userId, biomarkerId: existing.biomarkerId },
      orderBy: { testedAt: "desc" },
      select: { value: true },
    });
    const syncedCurrentValue = latestResult?.value ?? existing.currentValue;

    if (action === "achieve") {
      const goal = await prisma.healthGoal.update({
        where: { id },
        data: {
          status: "ACHIEVED",
          completedAt: new Date(),
          currentValue: syncedCurrentValue,
          ...(updatedNotes && { notes: updatedNotes }),
        },
        include: {
          biomarker: { select: { name: true, shortName: true, category: true, unit: true } },
        },
      });

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

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "GOAL_ACHIEVED",
          entity: "health_goal",
          entityId: goal.id,
          details: { via: "review" },
        },
      });

      return NextResponse.json({ goal });
    }

    if (!nextReviewDate) {
      return NextResponse.json(
        { error: "nextReviewDate is required when continuing a goal" },
        { status: 400 }
      );
    }

    const goal = await prisma.healthGoal.update({
      where: { id },
      data: {
        targetDate: new Date(nextReviewDate),
        status: "IN_PROGRESS",
        currentValue: syncedCurrentValue,
        notes: updatedNotes || existing.notes,
      },
      include: {
        biomarker: { select: { name: true, shortName: true, category: true, unit: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "GOAL_REVIEWED",
        entity: "health_goal",
        entityId: goal.id,
        details: { nextReviewDate },
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error reviewing goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
