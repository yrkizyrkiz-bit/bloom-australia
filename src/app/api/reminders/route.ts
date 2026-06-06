import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/reminders - Get user's reminders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const upcoming = searchParams.get("upcoming") === "true";
    const includeCompleted = searchParams.get("completed") === "true";

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, unknown> = { userId, isActive: true };
    if (!includeCompleted) where.isCompleted = false;
    if (upcoming) where.dueDate = { gte: new Date() };

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: "asc" },
      take: 50,
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, title, description, dueDate, frequency } = body;
    const userId = body.userId || session.user.id;

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!type || !title || !dueDate) {
      return NextResponse.json({ error: "type, title, and dueDate are required" }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        type: type.toUpperCase(),
        title,
        description,
        dueDate: new Date(dueDate),
        frequency: frequency?.toUpperCase() || "ONCE",
        isCompleted: false,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "REMINDER_CREATED", entity: "reminder", entityId: reminder.id },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/reminders - Update a reminder
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, description, dueDate, frequency, isCompleted, isActive } = body;

    if (!id) return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(frequency !== undefined && { frequency: frequency.toUpperCase() }),
        ...(isCompleted !== undefined && { isCompleted, completedAt: isCompleted ? new Date() : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/reminders - Delete a reminder
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
