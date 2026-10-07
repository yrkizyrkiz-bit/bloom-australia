import { PROGRAM_LABELS, type ProgramKey } from "@/lib/membership/keys";
import {
  bookingMatchesProgram,
  programKeyToConsultSlug,
} from "@/lib/portal/awaiting-consultation";
import { notifyMember } from "@/lib/notifications/member-notify";
import { prisma } from "@/lib/prisma";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { formatSydneyDate, formatSydneyTime } from "@/lib/sydney-time";

/** Booking notes that program portals use to attribute a staff-booked consult. */
export function portalProgramBookingNote(programKey: ProgramKey): string {
  const slug = programKeyToConsultSlug(programKey);
  switch (slug) {
    case "hair_loss":
      return "Hair Loss Program - Booked via care partner";
    case "mens_health":
      return "Men's Health Program - Booked via care partner";
    case "womens_health":
      return "Women's Health Program - Booked via care partner";
    case "weight_management":
      return "Weight Management Program - Booked via care partner";
    default:
      return `${PROGRAM_LABELS[programKey]} Program - Booked via care partner`;
  }
}

export function programDashboardPath(programKey: ProgramKey | null | undefined): string {
  if (!programKey) return "/dashboard";
  return (
    PROGRAM_CARDS.find((card) => card.key === programKey)?.dashboardRoute || "/dashboard"
  );
}

/**
 * Stamp the portal program onto a staff-created consult so hair/sexual/women's
 * portals can show the appointment (and clear the care-partner awaiting banner).
 */
export async function ensurePortalProgramBookingNotes(params: {
  bookingId: string;
  programKey: ProgramKey | null | undefined;
}): Promise<void> {
  if (!params.programKey) return;
  const marker = portalProgramBookingNote(params.programKey);
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: params.bookingId },
    select: { notes: true },
  });
  if (!booking) return;
  const existing = (booking.notes || "").trim();
  if (bookingMatchesProgram(existing, params.programKey)) {
    return;
  }
  await prisma.consultationBooking.update({
    where: { id: params.bookingId },
    data: {
      notes: existing ? `${existing}\n\n${marker}` : marker,
    },
  });
}

async function postCareChatAppointmentMessage(params: {
  userId: string;
  message: string;
}): Promise<void> {
  let session = await prisma.chatSession.findFirst({
    where: {
      memberId: params.userId,
      status: { in: ["WAITING", "ACTIVE", "AI_HANDLING"] },
    },
    select: { id: true },
    orderBy: { lastMessageAt: "desc" },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        memberId: params.userId,
        coachId: null,
        status: "AI_HANDLING",
        isAiHandled: true,
      },
      select: { id: true },
    });
  }

  const already = await prisma.chatMessage.findFirst({
    where: {
      sessionId: session.id,
      senderType: "SYSTEM",
      message: params.message,
    },
    select: { id: true },
  });
  if (already) return;

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      message: params.message,
    },
  });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { lastMessageAt: new Date() },
  });
}

/**
 * In-app notification + care chat message when care books/links a pre-triage consult.
 * Email defaults off when staff booking create already emailed the member.
 */
export async function notifyMemberOfPreTriageAppointment(params: {
  userId: string;
  bookingId: string;
  programKey?: ProgramKey | null;
  /**
   * When omitted, email is skipped for bookings created in the last 3 minutes
   * (staff create already emails). Link-to-existing still emails.
   */
  sendEmail?: boolean;
}): Promise<{ notified: boolean }> {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: params.bookingId },
    select: {
      id: true,
      userId: true,
      scheduledAt: true,
      doctorName: true,
      appointmentType: true,
      createdAt: true,
    },
  });
  if (!booking || booking.userId !== params.userId) {
    return { notified: false };
  }

  const whenDate = formatSydneyDate(booking.scheduledAt);
  const whenTime = formatSydneyTime(booking.scheduledAt);
  const doctor = booking.doctorName?.trim() || "your doctor";
  const programLabel = params.programKey
    ? PROGRAM_LABELS[params.programKey]
    : "your program";
  const title = "Your consultation is booked";
  const message = `Your ${programLabel} doctor consultation is set for ${whenDate} at ${whenTime} (Sydney time) with ${doctor}. We'll call you at that time — keep your phone nearby.`;
  const actionUrl = programDashboardPath(params.programKey);

  const freshlyCreatedMs = Date.now() - booking.createdAt.getTime();
  const sendEmail =
    params.sendEmail ?? freshlyCreatedMs > 3 * 60 * 1000;

  await notifyMember({
    userId: params.userId,
    intent: "PROGRAM_STEP",
    title,
    message,
    actionUrl,
    type: "SUCCESS",
    category: "SYSTEM",
    dedupeDays: 1,
    email: sendEmail,
  }).catch((err) => {
    console.error("[pre-triage] member notify failed:", err);
  });

  await postCareChatAppointmentMessage({
    userId: params.userId,
    message,
  }).catch((err) => {
    console.error("[pre-triage] care chat message failed:", err);
  });

  return { notified: true };
}
