import { unstable_cache } from "next/cache";
import { getUnifiedAvailability } from "@/lib/bookings/unified-availability";
import { LP_WM_APPOINTMENT_TYPE } from "@/lib/lp/weight-management-funnel";

export type LpWmAvailabilitySlot = {
  slotId: string;
  startTime: string;
  endTime: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
  availableDoctors: number;
};

async function loadLpWmAvailability(): Promise<LpWmAvailabilitySlot[]> {
  const result = await getUnifiedAvailability({
    appointmentType: LP_WM_APPOINTMENT_TYPE,
    daysAhead: 14,
    dayOffset: 0,
    windowDays: 7,
    staffMode: false,
    requestUserId: null,
  });
  return result.slots.map((slot) => ({
    slotId: slot.slotId,
    startTime: slot.startTime,
    endTime: slot.endTime,
    availabilityStatus: slot.availabilityStatus,
    availableDoctors: slot.availableDoctors,
  }));
}

export const getLpWmAvailability = unstable_cache(loadLpWmAvailability, ["lp-wm-availability-v1"], {
  revalidate: 30,
});
