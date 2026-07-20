/**
 * Journey statuses where holding a consult slot is part of checkout (pre-payment).
 * Do not regress members who have already paid or entered triage.
 */
const SLOT_HOLD_ELIGIBLE_STATUSES = new Set([
  "LEAD",
  "CONSENTED",
  "SURVEY_COMPLETED",
  "CONSULTATION_BOOKING_STARTED",
  "CONSULTATION_BOOKED",
]);

/** Returns CONSULTATION_BOOKING_STARTED when safe, or null to leave journey unchanged. */
export function journeyStatusAfterSlotHold(
  currentStatus: string | null | undefined
): "CONSULTATION_BOOKING_STARTED" | null {
  const status = currentStatus ?? "LEAD";
  if (!SLOT_HOLD_ELIGIBLE_STATUSES.has(status)) {
    return null;
  }
  return "CONSULTATION_BOOKING_STARTED";
}
