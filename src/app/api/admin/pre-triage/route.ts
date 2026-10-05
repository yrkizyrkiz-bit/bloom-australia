import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  bookingHasAssignedDoctor,
  completePreTriageHandoff,
} from "@/lib/admin/complete-pre-triage-task";

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
      bookingId,
      complete,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Build update data (non-completion fields first)
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
    if (status !== undefined && status !== "COMPLETED") updateData.status = status;
    if (assignedOwnerId !== undefined) updateData.assignedOwnerId = assignedOwnerId;
    if (bookingId !== undefined) updateData.bookingId = bookingId || null;

    const explicitComplete =
      complete === true || status === "COMPLETED" || readyForDoctor === true;

    // Apply link / checklist updates before handoff completion.
    let task = await prisma.preTriageTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // When linking an existing consult, note the program on the booking for the doctor.
    if (typeof bookingId === "string" && bookingId) {
      const appendNote =
        typeof body.appendBookingNote === "string" ? body.appendBookingNote.trim() : "";
      if (appendNote) {
        const booking = await prisma.consultationBooking.findUnique({
          where: { id: bookingId },
          select: { notes: true },
        });
        if (booking) {
          const existing = (booking.notes || "").trim();
          const marker = `[Pre-triage] ${appendNote}`;
          if (!existing.includes(marker)) {
            await prisma.consultationBooking.update({
              where: { id: bookingId },
              data: {
                notes: existing ? `${existing}\n\n${marker}` : marker,
              },
            });
          }
        }
      }
    }

    const linkedBookingId =
      (typeof bookingId === "string" && bookingId) || task.bookingId || null;
    const linkingBookingNow = typeof bookingId === "string" && Boolean(bookingId);

    // Auto-complete only when this request links a consult that already has a doctor.
    // (Avoid completing on unrelated checklist PATCHes.)
    let autoCompleted = false;
    if (!explicitComplete && linkingBookingNow && linkedBookingId) {
      autoCompleted = await bookingHasAssignedDoctor(linkedBookingId);
    }

    let completedTaskIds: string[] = [];
    if (explicitComplete || autoCompleted) {
      if (explicitComplete && !linkedBookingId && complete === true) {
        return NextResponse.json(
          { error: "Link or book an appointment before marking Pre-Triage complete" },
          { status: 400 }
        );
      }

      const handoff = await completePreTriageHandoff({
        taskId,
        bookingId: linkedBookingId,
      });
      completedTaskIds = handoff.completedTaskIds;
      task = await prisma.preTriageTask.findUniqueOrThrow({ where: { id: taskId } });
    }

    return NextResponse.json({
      success: true,
      task,
      completed: completedTaskIds.length > 0,
      autoCompleted,
      completedTaskIds,
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

    if (notes) {
      await prisma.preTriageTask.update({
        where: { id: taskId },
        data: { notes },
      });
    }

    const handoff = await completePreTriageHandoff({
      taskId,
      bookingId: task.bookingId,
    });

    const updatedTask = await prisma.preTriageTask.findUniqueOrThrow({
      where: { id: taskId },
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
          completedTaskIds: handoff.completedTaskIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      completedTaskIds: handoff.completedTaskIds,
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
