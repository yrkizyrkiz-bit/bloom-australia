import { unstable_cache } from "next/cache";
import { getUnifiedAvailability } from "@/lib/bookings/unified-availability";
import {
  isLpWmHiddenWeekday,
  LP_WM_APPOINTMENT_TYPE,
  LP_WM_CALENDAR_HORIZON_DAYS,
} from "@/lib/lp/weight-management-funnel";

export type LpWmAvailabilitySlot = {
  slotId: string;
  startTime: string;
  endTime: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
  availableDoctors: number;
};

async function loadLpWmAvailability(): Promise<LpWmAvailabilitySlot[]> {
  const query = {
    appointmentType: LP_WM_APPOINTMENT_TYPE,
    daysAhead: LP_WM_CALENDAR_HORIZON_DAYS,
    windowDays: 7,
    staffMode: false as const,
    requestUserId: null,
  };
  const [first, second] = await Promise.all([
    getUnifiedAvailability({ ...query, dayOffset: 0 }),
    getUnifiedAvailability({ ...query, dayOffset: 7 }),
  ]);

  const seen = new Set<string>();
  const slots: LpWmAvailabilitySlot[] = [];
  for (const slot of [...first.slots, ...second.slots]) {
    if (seen.has(slot.slotId) || isLpWmHiddenWeekday(slot.startTime)) continue;
    seen.add(slot.slotId);
    slots.push({
      slotId: slot.slotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      availabilityStatus: slot.availabilityStatus,
      availableDoctors: slot.availableDoctors,
    });
  }
  return slots;
}

export const getLpWmAvailability = unstable_cache(loadLpWmAvailability, ["lp-wm-availability-v2"], {
  revalidate: 30,
});
