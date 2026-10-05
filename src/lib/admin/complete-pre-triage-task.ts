import { prisma } from "@/lib/prisma";

export type CompletePreTriageHandoffResult = {
  taskId: string;
  completedTaskIds: string[];
  journeyStatusUpdated: boolean;
};

/**
 * Mark a Pre-Triage task ready for the doctor and remove it from the queue.
 * When a bookingId is set, also completes other open tasks linked to the same
 * consult (e.g. Hair + Women's Wellness sharing one appointment).
 */
export async function completePreTriageHandoff(input: {
  taskId: string;
  bookingId?: string | null;
  completeSiblingsOnSameBooking?: boolean;
}): Promise<CompletePreTriageHandoffResult> {
  const task = await prisma.preTriageTask.findUnique({
    where: { id: input.taskId },
    select: { id: true, patientId: true, bookingId: true, status: true },
  });
  if (!task) {
    throw new Error("Pre-triage task not found");
  }

  const bookingId = input.bookingId || task.bookingId || null;
  const now = new Date();
  const completedTaskIds: string[] = [];

  await prisma.preTriageTask.update({
    where: { id: task.id },
    data: {
      status: "COMPLETED",
      readyForDoctor: true,
      completedAt: now,
      appointmentConfirmed: true,
      ...(bookingId ? { bookingId } : {}),
    },
  });
  completedTaskIds.push(task.id);

  if (
    input.completeSiblingsOnSameBooking !== false &&
    bookingId
  ) {
    const siblings = await prisma.preTriageTask.findMany({
      where: {
        patientId: task.patientId,
        bookingId,
        status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED"] },
        id: { not: task.id },
      },
      select: { id: true },
    });
    if (siblings.length > 0) {
      await prisma.preTriageTask.updateMany({
        where: { id: { in: siblings.map((s) => s.id) } },
        data: {
          status: "COMPLETED",
          readyForDoctor: true,
          completedAt: now,
          appointmentConfirmed: true,
        },
      });
      completedTaskIds.push(...siblings.map((s) => s.id));
    }
  }

  await prisma.user.update({
    where: { id: task.patientId },
    data: { journeyStatus: "AWAITING_DOCTOR_DECISION" },
  });

  return {
    taskId: task.id,
    completedTaskIds,
    journeyStatusUpdated: true,
  };
}

export async function bookingHasAssignedDoctor(bookingId: string): Promise<boolean> {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: { doctorId: true, doctorName: true },
  });
  return Boolean(booking?.doctorId || booking?.doctorName?.trim());
}
