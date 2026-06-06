import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GAP-026: Care partner pre-triage task queue API

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is care partner or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["CARE_PARTNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (assignedToMe) {
      where.assignedOwnerId = session.user.id;
    }

    const tasks = await prisma.preTriageTask.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: 100,
    });

    // Enrich with patient and booking info
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [patient, booking, assignedOwner] = await Promise.all([
          prisma.user.findUnique({
            where: { id: task.patientId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          }),
          task.bookingId
            ? prisma.consultationBooking.findUnique({
                where: { id: task.bookingId },
                select: {
                  scheduledAt: true,
                  doctorName: true,
                  selectedPlan: true,
                },
              })
            : null,
          task.assignedOwnerId
            ? prisma.user.findUnique({
                where: { id: task.assignedOwnerId },
                select: { firstName: true, lastName: true },
              })
            : null,
        ]);

        return {
          ...task,
          patient,
          booking,
          assignedOwner: assignedOwner
            ? `${assignedOwner.firstName} ${assignedOwner.lastName}`
            : null,
        };
      })
    );

    return NextResponse.json({
      tasks: enrichedTasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching pre-triage tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is care partner or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!user || !["CARE_PARTNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const {
      taskId,
      // Checklist items
      quizComplete,
      phoneConfirmed,
      appointmentConfirmed,
      medicationsChecked,
      allergiesChecked,
      riskFlagsChecked,
      bmiChecked,
      briefAttached,
      readyForDoctor,
      // Other fields
      notes,
      status,
      assignedOwnerId,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (quizComplete !== undefined) updateData.quizComplete = quizComplete;
    if (phoneConfirmed !== undefined) updateData.phoneConfirmed = phoneConfirmed;
    if (appointmentConfirmed !== undefined) updateData.appointmentConfirmed = appointmentConfirmed;
    if (medicationsChecked !== undefined) updateData.medicationsChecked = medicationsChecked;
    if (allergiesChecked !== undefined) updateData.allergiesChecked = allergiesChecked;
    if (riskFlagsChecked !== undefined) updateData.riskFlagsChecked = riskFlagsChecked;
    if (bmiChecked !== undefined) updateData.bmiChecked = bmiChecked;
    if (briefAttached !== undefined) updateData.briefAttached = briefAttached;
    if (readyForDoctor !== undefined) updateData.readyForDoctor = readyForDoctor;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (assignedOwnerId !== undefined) updateData.assignedOwnerId = assignedOwnerId;

    // If marking as completed
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const task = await prisma.preTriageTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // If task is now ready for doctor, update patient journey status
    if (readyForDoctor === true) {
      await prisma.user.update({
        where: { id: task.patientId },
        data: { journeyStatus: "PRE_TRIAGE_COMPLETE" },
      });
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error updating pre-triage task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// Complete a task with all required checks
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!user || !["CARE_PARTNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, notes } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Get current task
    const task = await prisma.preTriageTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate all checklist items are complete
    const checklist = [
      { key: "quizComplete", label: "Quiz completion" },
      { key: "phoneConfirmed", label: "Phone number" },
      { key: "appointmentConfirmed", label: "Appointment time" },
      { key: "medicationsChecked", label: "Medications/allergies" },
      { key: "riskFlagsChecked", label: "Risk flags" },
      { key: "bmiChecked", label: "BMI" },
      { key: "briefAttached", label: "Doctor brief" },
    ];

    const incomplete = checklist.filter(
      (item) => !(task as Record<string, unknown>)[item.key]
    );

    if (incomplete.length > 0) {
      return NextResponse.json({
        error: "Checklist incomplete",
        incomplete: incomplete.map((i) => i.label),
      }, { status: 400 });
    }

    // Complete the task
    const updatedTask = await prisma.preTriageTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        readyForDoctor: true,
        completedAt: new Date(),
        notes: notes || task.notes,
      },
    });

    // Update patient journey status
    await prisma.user.update({
      where: { id: task.patientId },
      data: { journeyStatus: "PRE_TRIAGE_COMPLETE" },
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: task.patientId,
        action: "PRE_TRIAGE_COMPLETED",
        entity: "pre_triage_task",
        entityId: taskId,
        details: {
          completedBy: `${user.firstName} ${user.lastName}`,
          completedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Pre-triage completed. Patient is ready for doctor call.",
    });
  } catch (error) {
    console.error("Error completing pre-triage task:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}
