import { describe, it, expect } from "vitest";
import { journeyStatusAfterSlotHold } from "@/lib/funnel/booking-hold-journey";

describe("journeyStatusAfterSlotHold", () => {
  it("advances early funnel statuses to CONSULTATION_BOOKING_STARTED", () => {
    expect(journeyStatusAfterSlotHold("LEAD")).toBe("CONSULTATION_BOOKING_STARTED");
    expect(journeyStatusAfterSlotHold("SURVEY_COMPLETED")).toBe(
      "CONSULTATION_BOOKING_STARTED"
    );
    expect(journeyStatusAfterSlotHold("CONSULTATION_BOOKED")).toBe(
      "CONSULTATION_BOOKING_STARTED"
    );
    expect(journeyStatusAfterSlotHold(null)).toBe("CONSULTATION_BOOKING_STARTED");
  });

  it("does not regress post-payment or triage statuses", () => {
    expect(journeyStatusAfterSlotHold("CONSULTATION_PAID")).toBeNull();
    expect(journeyStatusAfterSlotHold("PRE_TRIAGE_PENDING")).toBeNull();
    expect(journeyStatusAfterSlotHold("PRE_TRIAGE_COMPLETE")).toBeNull();
    expect(journeyStatusAfterSlotHold("AWAITING_DOCTOR_DECISION")).toBeNull();
    expect(journeyStatusAfterSlotHold("ACTIVE")).toBeNull();
  });
});
