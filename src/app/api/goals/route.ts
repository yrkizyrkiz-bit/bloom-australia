import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { BLOCKING_GOAL_STATUSES } from "@/lib/goal-deduplication";
import {
  attachLatestResultsToGoals,
  indexLatestResultsByBiomarker,
} from "@/lib/goal-latest-values";
import type { GoalStatus } from "@prisma/client";

// GET /api/goals - Get user's health goals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const status = searchParams.get("status");

    // Non-admins can only view their own goals
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const goals = await prisma.healthGoal.findMany({
      where,
      include: {
        biomarker: {
          select: {
            name: true,
            shortName: true,
            category: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const biomarkerIds = [...new Set(goals.map(g => g.biomarkerId))];
    const latestResults =
      biomarkerIds.length > 0
        ? await prisma.biomarkerResult.findMany({
            where: { userId, biomarkerId: { in: biomarkerIds } },
            orderBy: { testedAt: "desc" },
            select: {
              biomarkerId: true,
              value: true,
              testedAt: true,
              status: true,
            },
          })
        : [];

    const latestByBiomarker = indexLatestResultsByBiomarker(latestResults);
    const enrichedGoals = attachLatestResultsToGoals(goals, latestByBiomarker);

    // Keep stored currentValue in sync for active goals when newer labs exist
    await Promise.all(
      enrichedGoals
        .filter(
          g =>
            g.status === "IN_PROGRESS" &&
            g.latestResult &&
            g.latestResult.value !== g.currentValue
        )
        .map(g =>
          prisma.healthGoal.update({
            where: { id: g.id },
            data: { currentValue: g.latestResult!.value },
          })
        )
    );

    return NextResponse.json({ goals: enrichedGoals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/goals - Create a new health goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      biomarkerId,
      targetValue,
      currentValue,
      startValue,
      startDate,
      targetDate,
      notes,
    } = body;

    // Use session user if userId not provided
    const targetUserId = userId || session.user.id;

    // Non-admins can only create goals for themselves
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!biomarkerId || targetValue === undefined) {
      return NextResponse.json(
        { error: "biomarkerId and targetValue are required" },
        { status: 400 }
      );
    }

    // Verify biomarker exists
    const biomarker = await prisma.biomarkerDefinition.findUnique({
      where: { biomarkerId },
    });
    if (!biomarker) {
      return NextResponse.json({ error: "Biomarker not found" }, { status: 404 });
    }

    const latestResult = await prisma.biomarkerResult.findFirst({
      where: { userId: targetUserId, biomarkerId },
      orderBy: { testedAt: "desc" },
      select: { value: true },
    });

    const resolvedCurrent =
      currentValue ?? startValue ?? latestResult?.value ?? 0;
    const resolvedStart =
      startValue ?? currentValue ?? latestResult?.value ?? resolvedCurrent;

    const existingGoal = await prisma.healthGoal.findFirst({
      where: {
        userId: targetUserId,
        biomarkerId,
        status: { in: [...BLOCKING_GOAL_STATUSES] as GoalStatus[] },
      },
      include: {
        biomarker: {
          select: {
            name: true,
            shortName: true,
            category: true,
            unit: true,
          },
        },
      },
    });

    if (existingGoal) {
      return NextResponse.json(
        {
          error: `An active goal already exists for ${biomarker.name}`,
          code: "DUPLICATE_GOAL",
          existingGoal,
        },
        { status: 409 }
      );
    }

    const goal = await prisma.healthGoal.create({
      data: {
        userId: targetUserId,
        biomarkerId,
        targetValue,
        currentValue: resolvedCurrent,
        startValue: resolvedStart,
        startDate: startDate ? new Date(startDate) : new Date(),
        targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
        status: "IN_PROGRESS",
        notes,
      },
      include: {
        biomarker: {
          select: {
            name: true,
            shortName: true,
            category: true,
            unit: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "GOAL_CREATED",
        entity: "health_goal",
        entityId: goal.id,
        details: { biomarkerId, targetValue },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "SUCCESS",
        title: "New Health Goal Set",
        message: `You've set a new goal for ${biomarker.name}: target ${targetValue} ${biomarker.unit}`,
        category: "GOAL",
        actionUrl: "/dashboard/goals",
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/goals - Update a goal
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, currentValue, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const existingGoal = await prisma.healthGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Non-admins can only update their own goals
    if (existingGoal.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await prisma.healthGoal.update({
      where: { id },
      data: {
        ...(currentValue !== undefined && { currentValue }),
        ...(status && { status: status.toUpperCase() }),
        ...(notes !== undefined && { notes }),
        ...(status === "ACHIEVED" && { completedAt: new Date() }),
      },
      include: {
        biomarker: {
          select: {
            name: true,
            shortName: true,
            category: true,
            unit: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "GOAL_UPDATED",
        entity: "health_goal",
        entityId: goal.id,
        details: { status: goal.status },
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
