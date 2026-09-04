import { describe, expect, it } from "vitest";
import { getConsultationCountdown } from "@/lib/program-journey/timeline";
import {
  resolveUpcomingConsultation,
  toPortalConsultation,
} from "@/lib/program-journey/upcoming-consultation";

describe("consultation countdown visibility", () => {
  const future = new Date("2026-09-10T02:00:00.000Z");
  const later = new Date("2026-09-12T04:00:00.000Z");

  it("hides the countdown after the doctor completes the call early", () => {
    expect(
      resolveUpcomingConsultation({
        journeyStatus: "AWAITING_DOCTOR_DECISION",
        openBooking: { scheduledAt: future, doctorName: "Dr Lee" },
      })
    ).toBeNull();

    expect(
      resolveUpcomingConsultation({
        journeyStatus: "AWAITING_DOCTOR_CALL",
        openBooking: null,
        hasCompletedBooking: true,
        intakeScheduledAt: future,
      })
    ).toBeNull();
  });

  it("uses the rescheduled booking time instead of a stale intake date", () => {
    const resolved = resolveUpcomingConsultation({
      journeyStatus: "AWAITING_DOCTOR_CALL",
      openBooking: { scheduledAt: later, doctorName: "Dr Lee" },
      intakeScheduledAt: future,
    });
    expect(resolved?.scheduledAt).toEqual(later);
    expect(toPortalConsultation(resolved)?.date).toBe(later.toISOString());
  });

  it("still counts down while the member is waiting for the call", () => {
    const resolved = resolveUpcomingConsultation({
      journeyStatus: "PRE_TRIAGE_COMPLETE",
      openBooking: { scheduledAt: later, doctorName: "Dr Lee" },
    });
    expect(resolved).not.toBeNull();
    expect(getConsultationCountdown(later.toISOString())).not.toBeNull();
  });
});
