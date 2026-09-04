export const OPEN_CONSULTATION_BOOKING_STATUSES = [
  "BOOKING_CONFIRMED",
  "BOOKING_RESCHEDULED",
  "SLOT_HELD",
] as const;

/** Journey statuses where the member is still waiting for the doctor call. */
export const JOURNEY_STATUSES_SHOWING_CONSULTATION_COUNTDOWN = new Set([
  "LEAD",
  "CONSENTED",
  "SURVEY_COMPLETED",
  "CONSULTATION_BOOKING_STARTED",
  "CONSULTATION_BOOKED",
  "CONSULTATION_PAID",
  "PRE_TRIAGE_PENDING",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
]);

export type PortalConsultation = {
  date: string;
  time: string;
  status: string;
  doctorName: string | null;
  completedAt: string | null;
};

export function isAwaitingDoctorConsultation(journeyStatus?: string | null): boolean {
  if (!journeyStatus) return true;
  return JOURNEY_STATUSES_SHOWING_CONSULTATION_COUNTDOWN.has(journeyStatus);
}

export function formatPortalConsultation(
  scheduledAt: Date,
  doctorName: string | null
): PortalConsultation {
  return {
    date: scheduledAt.toISOString(),
    time: scheduledAt.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    status: "BOOKING_CONFIRMED",
    doctorName,
    completedAt: null,
  };
}

export function resolveUpcomingConsultation(input: {
  journeyStatus?: string | null;
  openBooking?: { scheduledAt: Date; doctorName: string | null } | null;
  hasCompletedBooking?: boolean;
  intakeScheduledAt?: Date | null;
}): { scheduledAt: Date; doctorName: string | null } | null {
  if (!isAwaitingDoctorConsultation(input.journeyStatus)) {
    return null;
  }

  if (input.openBooking) {
    return {
      scheduledAt: input.openBooking.scheduledAt,
      doctorName: input.openBooking.doctorName,
    };
  }

  if (input.hasCompletedBooking) {
    return null;
  }

  if (input.intakeScheduledAt) {
    return { scheduledAt: input.intakeScheduledAt, doctorName: null };
  }

  return null;
}

export function toPortalConsultation(
  resolved: { scheduledAt: Date; doctorName: string | null } | null
): PortalConsultation | null {
  if (!resolved) return null;
  return formatPortalConsultation(resolved.scheduledAt, resolved.doctorName);
}
