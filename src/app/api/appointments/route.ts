import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const upcoming = searchParams.get("upcoming") === "true";
    const status = searchParams.get("status");

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status.toUpperCase();
    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ["SCHEDULED", "CONFIRMED"] };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
      take: 50,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, title, description, scheduledAt, duration, location, notes } = body;
    const userId = body.userId || session.user.id;

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!type || !title || !scheduledAt) {
      return NextResponse.json({ error: "type, title, and scheduledAt are required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        type: type.toUpperCase(),
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        location,
        status: "SCHEDULED",
        notes,
      },
    });

    // Create reminder for appointment
    const reminderDate = new Date(scheduledAt);
    reminderDate.setDate(reminderDate.getDate() - 1);
    if (reminderDate > new Date()) {
      await prisma.reminder.create({
        data: {
          userId,
          type: "APPOINTMENT",
          title: `Reminder: ${title}`,
          description: `Upcoming appointment: ${title}`,
          dueDate: reminderDate,
          frequency: "ONCE",
          isCompleted: false,
          isActive: true,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId,
        type: "INFO",
        title: "Appointment Scheduled",
        message: `${title} scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        category: "APPOINTMENT",
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/appointments
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, description, scheduledAt, duration, location, status, notes } = body;

    if (!id) return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(duration !== undefined && { duration }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status: status.toUpperCase() }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/appointments
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
