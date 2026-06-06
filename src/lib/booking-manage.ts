import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  buildEventDescription,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import { CLINIC_TIMEZONE } from "@/lib/australia-timezone";
import { formatSydneyDate, formatSydneyTime } from "@/lib/sydney-time";

const FALLBACK_CALENDAR_ID = process.env.GOOGLE_CALENDAR_FALLBACK_ID || "primary";

export type BookingManageAction = "reschedule" | "cancel" | "update_status";

export interface StaffActor {
  userId: string;
  role: string;
}

function parseSlotToDate(slotId?: string, scheduledAt?: string): Date | null {
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (!slotId) return null;

  const unifiedMatch = slotId.match(/^slot_unified_([a-z0-9]+)$/);
  if (unifiedMatch) {
    return new Date(parseInt(unifiedMatch[1], 36));
  }

  const legacyMatch = slotId.match(/^slot_(.+)_([a-z0-9]+)$/);
  if (legacyMatch) {
    return new Date(parseInt(legacyMatch[2], 36));
  }

  return null;
}

export async function isSlotAvailable(
  scheduledAt: Date,
  excludeBookingId?: string
): Promise<{ available: boolean; reason?: string }> {
  const now = new Date();
  if (scheduledAt <= now) {
    return { available: false, reason: "Cannot book a time in the past" };
  }

  const doctorCount = await prisma.user.count({ where: { role: "DOCTOR" } });
  if (doctorCount === 0) {
    return { available: false, reason: "No doctors configured" };
  }

  const [existing, activeAppointments] = await Promise.all([
    prisma.consultationBooking.findMany({
      where: {
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        scheduledAt,
        OR: [
          { status: "BOOKING_CONFIRMED" },
          { status: "SLOT_HELD", holdExpiresAt: { gt: now } },
        ],
      },
      select: { doctorId: true },
    }),
    prisma.appointment.findMany({
      where: {
        scheduledAt,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      select: { doctorId: true },
    }),
  ]);

  const doctorBooked = new Set([
    ...existing.filter((b) => b.doctorId).map((b) => b.doctorId!),
    ...activeAppointments.filter((a) => a.doctorId).map((a) => a.doctorId!),
  ]);
  const unifiedCount =
    existing.filter((b) => !b.doctorId).length +
    activeAppointments.filter((a) => !a.doctorId).length;
  const available = doctorCount - doctorBooked.size - unifiedCount;

  if (available <= 0) {
    return { available: false, reason: "This time slot is no longer available" };
  }

  return { available: true };
}

function formatConsultationTime(date: Date): string {
  return `${formatSydneyDate(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} at ${formatSydneyTime(date)}`;
}

const SYSTEM_NOTE_TITLES = new Set([
  "Calendar Event Creation Failed",
]);

export function isSystemClinicalNote(title: string): boolean {
  return SYSTEM_NOTE_TITLES.has(title);
}

export async function getScheduleHistoryForBooking(bookingId: string) {
  return prisma.bookingChangeLog.findMany({
    where: {
      bookingId,
      action: { in: ["RESCHEDULED", "DOCTOR_ASSIGNED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      changedBy: {
        select: { firstName: true, lastName: true, role: true },
      },
    },
  });
}

export function formatScheduleHistoryEntry(log: {
  action: string;
  previousAt: Date | null;
  newAt: Date | null;
  reason: string | null;
  createdAt: Date;
  changedBy: { firstName: string; lastName: string; role: string };
}) {
  const by = `${log.changedBy.firstName} ${log.changedBy.lastName}`.trim();
  if (log.action === "RESCHEDULED" && log.previousAt && log.newAt) {
    return {
      action: "RESCHEDULED",
      summary: `Rescheduled from ${formatConsultationTime(log.previousAt)} → ${formatConsultationTime(log.newAt)}`,
      reason: log.reason,
      changedBy: by,
      changedAt: log.createdAt.toISOString(),
    };
  }
  if (log.action === "DOCTOR_ASSIGNED") {
    return {
      action: "DOCTOR_ASSIGNED",
      summary: log.reason || "Doctor assigned",
      reason: log.reason,
      changedBy: by,
      changedAt: log.createdAt.toISOString(),
    };
  }
  return {
    action: log.action,
    summary: log.reason || log.action,
    reason: log.reason,
    changedBy: by,
    changedAt: log.createdAt.toISOString(),
  };
}

export async function syncConsultationScheduleNoteForBooking(bookingId: string) {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: { userId: true, scheduledAt: true, doctorName: true, doctorId: true },
  });
  if (!booking?.userId) return;
  await syncConsultationScheduleNote(bookingId, booking.userId, booking);
}

async function syncConsultationScheduleNote(
  bookingId: string,
  userId: string,
  booking: {
    scheduledAt: Date;
    doctorName: string | null;
    doctorId: string | null;
  }
) {
  const history = await getScheduleHistoryForBooking(bookingId);
  const historyLines = history.map((log) => {
    const entry = formatScheduleHistoryEntry(log);
    return `• ${entry.summary}${entry.reason ? ` — ${entry.reason}` : ""} (${entry.changedBy})`;
  });

  const content = `## Current appointment
${formatConsultationTime(booking.scheduledAt)} (Sydney)
Doctor: ${booking.doctorName || "To be assigned"}
Booking ID: ${bookingId}

${historyLines.length > 0 ? `## Schedule changes\n${historyLines.join("\n")}` : "No schedule changes recorded."}`;

  const existing = await prisma.internalNote.findFirst({
    where: { userId, title: "Consultation Schedule", category: "MEDICAL" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.internalNote.update({
      where: { id: existing.id },
      data: { content, isPinned: true },
    });
  } else {
    await prisma.internalNote.create({
      data: {
        userId,
        memberId: userId,
        authorId: userId,
        authorName: "System",
        createdBy: userId,
        category: "MEDICAL",
        title: "Consultation Schedule",
        content,
        isPinned: true,
      },
    });
  }
}

async function resolveCalendarIdForDoctor(doctorId: string | null): Promise<string> {
  if (!doctorId) return FALLBACK_CALENDAR_ID;
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { email: true },
  });
  return doctor?.email || FALLBACK_CALENDAR_ID;
}

async function syncCalendarEventForBooking(
  bookingId: string,
  options?: { scheduledAt?: Date }
): Promise<{ success: boolean; error?: string | null }> {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { firstName: true, lastName: true, phone: true } },
    },
  });

  if (!booking?.calendarEventId) {
    return { success: true };
  }

  const scheduledAt = options?.scheduledAt ?? booking.scheduledAt;
  const calendarId = await resolveCalendarIdForDoctor(booking.doctorId);
  const endTime = new Date(scheduledAt.getTime() + booking.duration * 60 * 1000);
  const patientName = booking.user
    ? `${booking.user.firstName} ${booking.user.lastName}`.trim()
    : "Patient";
  const history = await getScheduleHistoryForBooking(bookingId);
  const scheduleHistory = history.map(formatScheduleHistoryEntry);
  const description = buildEventDescription({
    patientName,
    patientPhone: booking.patientPhone || booking.user?.phone || null,
    selectedPlan: booking.selectedPlan,
    patientBmi: booking.patientBmi,
    riskFlags: booking.riskFlags,
    doctorBriefUrl: booking.doctorBriefUrl,
    paymentStatus: booking.paymentIntentId ? "PAID" : "PENDING",
    intakeId: booking.intakeId,
    appointmentType: booking.appointmentType,
    bookingId: booking.id,
    currentAppointmentTime: formatConsultationTime(scheduledAt),
    scheduleHistory,
  });

  return updateCalendarEvent(booking.calendarEventId, calendarId, {
    summary: `Sanative Consultation — ${patientName}`,
    description,
    start: { dateTime: scheduledAt.toISOString(), timeZone: CLINIC_TIMEZONE },
    end: { dateTime: endTime.toISOString(), timeZone: CLINIC_TIMEZONE },
  });
}

async function syncCalendarOnCancel(
  booking: { calendarEventId: string | null; doctorId: string | null }
): Promise<void> {
  if (!booking.calendarEventId) return;

  let calendarId = FALLBACK_CALENDAR_ID;
  if (booking.doctorId) {
    const doctor = await prisma.user.findUnique({
      where: { id: booking.doctorId },
      select: { email: true },
    });
    if (doctor?.email) calendarId = doctor.email;
  }

  await deleteCalendarEvent(booking.calendarEventId, calendarId);
}

async function notifyMember(
  email: string | null | undefined,
  firstName: string,
  subject: string,
  body: string
) {
  if (!email) return;
  await sendEmail(email, subject, body, body).catch((err) => {
    console.error("[BookingManage] Failed to send member notification:", err);
  });
}

export async function rescheduleConsultationBooking(
  bookingId: string,
  actor: StaffActor,
  options: {
    scheduledAt?: string;
    slotId?: string;
    reason: string;
    notifyMember?: boolean;
  }
) {
  const newScheduledAt = parseSlotToDate(options.slotId, options.scheduledAt);
  if (!newScheduledAt) {
    throw new Error("Valid scheduledAt or slotId is required");
  }

  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["BOOKING_CONFIRMED", "SLOT_HELD", "BOOKING_RESCHEDULED"].includes(booking.status)) {
    throw new Error(`Cannot reschedule booking with status ${booking.status}`);
  }

  const slotCheck = await isSlotAvailable(newScheduledAt, bookingId);
  if (!slotCheck.available) {
    throw new Error(slotCheck.reason || "Slot not available");
  }

  const previousAt = booking.scheduledAt;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.consultationBooking.update({
      where: { id: bookingId },
      data: {
        scheduledAt: newScheduledAt,
        status: "BOOKING_CONFIRMED",
        holdExpiresAt: null,
      },
    });

    if (booking.intakeId) {
      await tx.weightManagementIntake.updateMany({
        where: { bookingId },
        data: { scheduledAt: newScheduledAt, bookingStatus: "CONFIRMED" },
      });
    }

    await tx.preTriageTask.updateMany({
      where: { bookingId },
      data: { dueDate: new Date(newScheduledAt.getTime() - 24 * 60 * 60 * 1000) },
    });

    await tx.bookingChangeLog.create({
      data: {
        bookingId,
        action: "RESCHEDULED",
        previousAt,
        newAt: newScheduledAt,
        previousDoctorId: booking.doctorId,
        newDoctorId: booking.doctorId,
        previousStatus: booking.status,
        newStatus: "BOOKING_CONFIRMED",
        reason: options.reason,
        changedByUserId: actor.userId,
        changedByRole: actor.role,
      },
    });

    return result;
  });

  const calendarResult = await syncCalendarEventForBooking(bookingId, {
    scheduledAt: newScheduledAt,
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.userId,
      action: "BOOKING_RESCHEDULED",
      entity: "consultation_booking",
      entityId: bookingId,
      details: {
        reason: options.reason,
        previousAt: previousAt.toISOString(),
        newAt: newScheduledAt.toISOString(),
        changedByRole: actor.role,
        calendarSync: calendarResult,
      },
    },
  });

  if (options.notifyMember !== false && booking.user?.email) {
    const name = booking.user.firstName || "there";
    await notifyMember(
      booking.user.email,
      name,
      "Your Sanative consultation has been rescheduled",
      `<p>Hi ${name},</p>
       <p>Your consultation has been rescheduled by our care team.</p>
       <p><strong>New time:</strong> ${formatConsultationTime(newScheduledAt)} (Sydney time)</p>
       <p><strong>Previous time:</strong> ${formatConsultationTime(previousAt)}</p>
       ${options.reason ? `<p><strong>Note:</strong> ${options.reason}</p>` : ""}
       <p>We'll call you at your appointment time. If you have questions, reply to this email or contact your care partner.</p>`
    );
  }

  if (booking.userId) {
    const refreshed = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      select: { scheduledAt: true, doctorName: true, doctorId: true },
    });
    if (refreshed) {
      await syncConsultationScheduleNote(bookingId, booking.userId, refreshed);
    }
  }

  return updated;
}

export async function cancelConsultationBooking(
  bookingId: string,
  actor: StaffActor,
  options: { reason: string; notifyMember?: boolean }
) {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (["BOOKING_CANCELLED", "BOOKING_COMPLETED"].includes(booking.status)) {
    throw new Error(`Cannot cancel booking with status ${booking.status}`);
  }

  await syncCalendarOnCancel(booking);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.consultationBooking.update({
      where: { id: bookingId },
      data: {
        status: "BOOKING_CANCELLED",
        cancelledAt: new Date(),
      },
    });

    if (booking.intakeId) {
      await tx.weightManagementIntake.updateMany({
        where: { bookingId },
        data: { bookingStatus: "CANCELLED" },
      });
    }

    await tx.bookingChangeLog.create({
      data: {
        bookingId,
        action: "CANCELLED",
        previousAt: booking.scheduledAt,
        previousStatus: booking.status,
        newStatus: "BOOKING_CANCELLED",
        reason: options.reason,
        changedByUserId: actor.userId,
        changedByRole: actor.role,
      },
    });

    return result;
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.userId,
      action: "BOOKING_CANCELLED",
      entity: "consultation_booking",
      entityId: bookingId,
      details: {
        reason: options.reason,
        previousAt: booking.scheduledAt.toISOString(),
        changedByRole: actor.role,
      },
    },
  });

  if (options.notifyMember !== false && booking.user?.email) {
    const name = booking.user.firstName || "there";
    await notifyMember(
      booking.user.email,
      name,
      "Your Sanative consultation has been cancelled",
      `<p>Hi ${name},</p>
       <p>Your consultation scheduled for ${formatConsultationTime(booking.scheduledAt)} has been cancelled by our care team.</p>
       ${options.reason ? `<p><strong>Reason:</strong> ${options.reason}</p>` : ""}
       <p>Please contact us if you'd like to book a new time.</p>`
    );
  }

  return updated;
}

const STATUS_MAP: Record<string, string> = {
  CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  CANCELLED: "BOOKING_CANCELLED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  COMPLETED: "BOOKING_COMPLETED",
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  NO_SHOW: "BOOKING_NO_SHOW",
  BOOKING_NO_SHOW: "BOOKING_NO_SHOW",
  SLOT_HELD: "SLOT_HELD",
  SCHEDULED: "BOOKING_CONFIRMED",
};

export async function updateConsultationBookingStatus(
  bookingId: string,
  actor: StaffActor,
  options: { status: string; reason?: string }
) {
  const mappedStatus = STATUS_MAP[options.status] || options.status;

  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const updateData: Record<string, unknown> = { status: mappedStatus };
  if (mappedStatus === "BOOKING_CANCELLED") updateData.cancelledAt = new Date();
  if (mappedStatus === "BOOKING_COMPLETED") updateData.completedAt = new Date();
  if (mappedStatus === "BOOKING_CONFIRMED") updateData.confirmedAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.consultationBooking.update({
      where: { id: bookingId },
      data: updateData,
    });

    await tx.bookingChangeLog.create({
      data: {
        bookingId,
        action: "STATUS_CHANGED",
        previousStatus: booking.status,
        newStatus: mappedStatus,
        reason: options.reason,
        changedByUserId: actor.userId,
        changedByRole: actor.role,
      },
    });

    return result;
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.userId,
      action: "BOOKING_STATUS_CHANGED",
      entity: "consultation_booking",
      entityId: bookingId,
      details: {
        previousStatus: booking.status,
        newStatus: mappedStatus,
        reason: options.reason,
        changedByRole: actor.role,
      },
    },
  });

  return updated;
}

export async function getBookingChangeHistory(bookingId: string) {
  return prisma.bookingChangeLog.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    include: {
      changedBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
}

export async function assignDoctorToConsultationBooking(
  bookingId: string,
  doctorId: string,
  actor?: StaffActor
) {
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId, role: "DOCTOR" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      scheduledAt: true,
      doctorId: true,
      doctorName: true,
      status: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["SLOT_HELD", "BOOKING_CONFIRMED"].includes(booking.status)) {
    throw new Error(`Cannot assign doctor to booking with status ${booking.status}`);
  }

  const existingDoctorBooking = await prisma.consultationBooking.findFirst({
    where: {
      scheduledAt: booking.scheduledAt,
      doctorId,
      status: { in: ["SLOT_HELD", "BOOKING_CONFIRMED"] },
      id: { not: bookingId },
    },
  });

  if (existingDoctorBooking) {
    throw new Error(
      `Dr. ${doctor.firstName} ${doctor.lastName} is already booked at this time`
    );
  }

  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const updated = await prisma.consultationBooking.update({
    where: { id: bookingId },
    data: { doctorId, doctorName },
  });

  if (actor) {
    await prisma.bookingChangeLog.create({
      data: {
        bookingId,
        action: "DOCTOR_ASSIGNED",
        previousDoctorId: booking.doctorId,
        newDoctorId: doctorId,
        reason: `Assigned ${doctorName}`,
        changedByUserId: actor.userId,
        changedByRole: actor.role,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: actor.userId,
        action: "BOOKING_DOCTOR_ASSIGNED",
        entity: "consultation_booking",
        entityId: bookingId,
        details: {
          previousDoctorId: booking.doctorId,
          newDoctorId: doctorId,
          doctorName,
          changedByRole: actor.role,
        },
      },
    });
  }

  if (booking.userId) {
    await syncConsultationScheduleNoteForBooking(bookingId);
  }

  await syncCalendarEventForBooking(bookingId);

  return updated;
}

/** Assign doctor to a patient's active consultation booking by userId */
export async function assignDoctorToPatientBooking(
  userId: string,
  doctorId: string,
  actor?: StaffActor
) {
  const booking = await prisma.consultationBooking.findFirst({
    where: {
      userId,
      status: { in: ["SLOT_HELD", "BOOKING_CONFIRMED"] },
    },
    orderBy: { scheduledAt: "desc" },
    select: { id: true },
  });

  if (!booking) {
    throw new Error("No active consultation booking found for this patient");
  }

  return assignDoctorToConsultationBooking(booking.id, doctorId, actor);
}

export async function findBookingById(bookingId: string) {
  const consultation = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, scheduledAt: true },
  });
  if (consultation) return { source: "consultation" as const, booking: consultation };

  const appointment = await prisma.appointment.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, scheduledAt: true },
  });
  if (appointment) return { source: "appointment" as const, booking: appointment };

  return null;
}
