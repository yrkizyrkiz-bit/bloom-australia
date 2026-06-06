import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SYDNEY_TZ,
  addSydneyDays,
  getSydneyDateKey,
  getSydneyDayOfWeek,
  getSydneyYmd,
  sydneyLocalToUtc,
  sydneyYmdToKey,
  toSydneyISO,
} from "@/lib/sydney-time";

// GAP-009: Real availability from doctor roster/calendar
// UNIFIED CALENDAR: Shows one slot per time (not per doctor)
// Doctor assignment happens during triage by care partner

const TIMEZONE = SYDNEY_TZ;

// Generate unified slot ID from time (doctor-agnostic)
function generateUnifiedSlotId(startTime: Date): string {
  const timestamp = startTime.getTime().toString(36);
  return `slot_unified_${timestamp}`;
}

// Parse time string "HH:MM" to hours and minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

// Unified slot interface - doctor-agnostic for booking
export interface UnifiedSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  appointmentType: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
  availableDoctors: number; // How many doctors are available at this time
}

// Internal tracking of which doctors are available at each time
interface TimeSlotCapacity {
  timestamp: number;
  startTime: Date;
  availableDoctorIds: string[];
}

/** Checkout window: member flow starts tomorrow; staffMode includes today */
function getWindowBounds(
  now: Date,
  dayOffset: number,
  windowDays: number,
  staffMode = false
): { windowStart: Date; windowEnd: Date; firstBookableDay: number } {
  const firstBookableDay = staffMode ? dayOffset : 1 + dayOffset;
  const windowStartDay = addSydneyDays(getSydneyYmd(now), firstBookableDay);
  const windowStart = sydneyLocalToUtc(
    windowStartDay.year,
    windowStartDay.month,
    windowStartDay.day,
    0,
    0
  );
  const afterWindow = addSydneyDays(windowStartDay, windowDays);
  const windowEnd = sydneyLocalToUtc(afterWindow.year, afterWindow.month, afterWindow.day, 0, 0);
  return { windowStart, windowEnd, firstBookableDay };
}

function isSlotInWindow(slotTime: Date, windowStart: Date, windowEnd: Date): boolean {
  return slotTime >= windowStart && slotTime < windowEnd;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentType = searchParams.get("appointmentType") || "PHONE_CONSULT";
    const daysAhead = parseInt(searchParams.get("days") || "14", 10);
    const dayOffset = Math.max(0, parseInt(searchParams.get("dayOffset") || "0", 10));
    const windowDays = Math.min(7, Math.max(1, parseInt(searchParams.get("windowDays") || "2", 10)));
    const staffMode = searchParams.get("staffMode") === "true";

    const now = new Date();
    const { windowStart, windowEnd, firstBookableDay } = getWindowBounds(
      now,
      dayOffset,
      windowDays,
      staffMode
    );
    const scheduleStartDay = staffMode ? 0 : 1;
    const unifiedSlots: UnifiedSlot[] = [];

    // GAP-009: Fetch doctors with their availability from roster
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (doctors.length === 0) {
      console.warn("[Availability] No doctors found in database");
      return NextResponse.json({
        slots: [],
        timezone: TIMEZONE,
        generatedAt: new Date().toISOString(),
        totalSlots: 0,
        totalDoctors: 0,
        warning: "No doctors available. Please configure doctor roster.",
      });
    }

    // GAP-009: Fetch doctor availability schedules from roster
    const doctorAvailability = await prisma.doctorAvailability.findMany({
      where: {
        status: { in: ["AVAILABLE", "LIMITED"] },
        OR: [
          { isRecurring: true },
          { specificDate: { gte: now } },
        ],
      },
    });

    // GAP-009: Fetch blocked dates
    const blockedDates = await prisma.doctorBlockedDate.findMany({
      where: {
        blockedDate: {
          gte: now,
          lte: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Create lookup for blocked dates by doctor
    const blockedDatesByDoctor = new Map<string, Set<string>>();
    for (const blocked of blockedDates) {
      const key = blocked.doctorId;
      if (!blockedDatesByDoctor.has(key)) {
        blockedDatesByDoctor.set(key, new Set());
      }
      blockedDatesByDoctor.get(key)!.add(blocked.blockedDate.toISOString().split("T")[0]);
    }

    // GAP-009: Get all existing bookings/holds that are active
    const existingBookings = await prisma.consultationBooking.findMany({
      where: {
        scheduledAt: {
          gte: now,
        },
        OR: [
          { status: "SLOT_HELD", holdExpiresAt: { gt: now } },
          { status: "BOOKING_CONFIRMED" },
        ],
      },
      select: {
        scheduledAt: true,
        doctorId: true,
        status: true,
      },
    });

    // Track booked slots by doctor and time
    const bookedSlotsByDoctor = new Map<string, Set<number>>();
    // Track UNIFIED booked slots (slots booked without specific doctor - assigned during triage)
    const unifiedBookedTimes = new Set<number>();

    for (const booking of existingBookings) {
      const timeKey = booking.scheduledAt.getTime();

      if (booking.doctorId) {
        // Doctor-specific booking
        if (!bookedSlotsByDoctor.has(booking.doctorId)) {
          bookedSlotsByDoctor.set(booking.doctorId, new Set());
        }
        bookedSlotsByDoctor.get(booking.doctorId)!.add(timeKey);
      } else {
        // Unified booking (no doctor assigned yet) - blocks one doctor slot
        unifiedBookedTimes.add(timeKey);
      }
    }

    // Legacy appointments also block capacity when active (cancelled = released)
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      select: { scheduledAt: true, doctorId: true },
    });

    for (const appt of activeAppointments) {
      const timeKey = appt.scheduledAt.getTime();
      if (appt.doctorId) {
        if (!bookedSlotsByDoctor.has(appt.doctorId)) {
          bookedSlotsByDoctor.set(appt.doctorId, new Set());
        }
        bookedSlotsByDoctor.get(appt.doctorId)!.add(timeKey);
      } else {
        unifiedBookedTimes.add(timeKey);
      }
    }

    // Track capacity at each time slot
    const timeSlotCapacity = new Map<number, TimeSlotCapacity>();

    // Ensure a grid cell exists (used to surface BOOKED times in checkout)
    const ensureSlotCell = (slotTime: Date) => {
      const timestamp = slotTime.getTime();
      if (!timeSlotCapacity.has(timestamp)) {
        timeSlotCapacity.set(timestamp, {
          timestamp,
          startTime: new Date(slotTime),
          availableDoctorIds: [],
        });
      }
    };

    // Helper to add doctor availability to a time slot
    const addDoctorToSlot = (slotTime: Date, doctorId: string) => {
      const timestamp = slotTime.getTime();
      ensureSlotCell(slotTime);

      const slot = timeSlotCapacity.get(timestamp)!;

      // Check if this doctor is already booked at this time
      const doctorBookedTimes = bookedSlotsByDoctor.get(doctorId);
      if (doctorBookedTimes?.has(timestamp)) {
        return; // Doctor is already booked
      }

      // Add doctor to available list if not already there
      if (!slot.availableDoctorIds.includes(doctorId)) {
        slot.availableDoctorIds.push(doctorId);
      }
    };

    // Seed full 8am–8pm grid for checkout window (default Thu/Fri/Sat schedule)
    const seedDefaultGridForWindow = () => {
      for (let d = 0; d < windowDays; d++) {
        const ymd = addSydneyDays(getSydneyYmd(now), firstBookableDay + d);
        const sydneyDateStr = sydneyYmdToKey(ymd);
        const tempDate = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
        const sydneyDayOfWeek = getSydneyDayOfWeek(tempDate);
        if (![4, 5, 6].includes(sydneyDayOfWeek)) continue;

        for (let hour = 8; hour <= 20; hour++) {
          const minutes = hour === 20 ? [0] : [0, 30];
          for (const minute of minutes) {
            const slotTime = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, hour, minute);
            if (slotTime <= now) continue;
            ensureSlotCell(slotTime);
            for (const doctor of doctors) {
              if (blockedDatesByDoctor.get(doctor.id)?.has(sydneyDateStr)) continue;
              addDoctorToSlot(slotTime, doctor.id);
            }
          }
        }
      }
    };

    // If no roster configured, use default availability (Thu/Fri/Sat 8am-8pm Sydney time)
    if (doctorAvailability.length === 0) {
      console.warn("[Availability] No roster configured, using default schedule (Thu/Fri/Sat 8am-8pm AEST/AEDT)");

      // Generate default slots for next 14 days
      for (let dayOffset = scheduleStartDay; dayOffset <= daysAhead; dayOffset++) {
        const ymd = addSydneyDays(getSydneyYmd(now), dayOffset);
        const sydneyDateStr = sydneyYmdToKey(ymd);
        const tempDate = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
        const sydneyDayOfWeek = getSydneyDayOfWeek(tempDate);

        // Default: Thu=4, Fri=5, Sat=6
        if (![4, 5, 6].includes(sydneyDayOfWeek)) continue;

        for (let hour = 8; hour <= 20; hour++) {
          const minutes = hour === 20 ? [0] : [0, 30];
          for (const minute of minutes) {
            const slotTime = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, hour, minute);

            if (slotTime <= now) continue;

            for (const doctor of doctors) {
              if (blockedDatesByDoctor.get(doctor.id)?.has(sydneyDateStr)) continue;

              addDoctorToSlot(slotTime, doctor.id);
            }
          }
        }
      }
    } else {
      // GAP-009: Use roster-based availability (with Sydney timezone)
      for (let dayOffset = scheduleStartDay; dayOffset <= daysAhead; dayOffset++) {
        const ymd = addSydneyDays(getSydneyYmd(now), dayOffset);
        const sydneyDateStr = sydneyYmdToKey(ymd);
        const tempDate = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
        const sydneyDayOfWeek = getSydneyDayOfWeek(tempDate);

        for (const avail of doctorAvailability) {
          if (avail.isRecurring) {
            if (avail.dayOfWeek !== sydneyDayOfWeek) continue;
          } else {
            if (avail.specificDate) {
              const specificKey = getSydneyDateKey(avail.specificDate);
              if (specificKey !== sydneyDateStr) continue;
            }
          }

          if (blockedDatesByDoctor.get(avail.doctorId)?.has(sydneyDateStr)) continue;

          const start = parseTime(avail.startTime);
          const end = parseTime(avail.endTime);
          const slotDuration = avail.slotDuration || 30;

          let currentHour = start.hours;
          let currentMinute = start.minutes;

          while (currentHour < end.hours || (currentHour === end.hours && currentMinute < end.minutes)) {
            const slotTime = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, currentHour, currentMinute);

            if (slotTime > now) {
              addDoctorToSlot(slotTime, avail.doctorId);
            }

            currentMinute += slotDuration;
            if (currentMinute >= 60) {
              currentHour += Math.floor(currentMinute / 60);
              currentMinute = currentMinute % 60;
            }
          }
        }
      }
    }

    // Count how many unified bookings exist (to reduce available capacity)
    const unifiedBookingCounts = new Map<number, number>();
    for (const timeKey of unifiedBookedTimes) {
      unifiedBookingCounts.set(timeKey, (unifiedBookingCounts.get(timeKey) || 0) + 1);
    }

    // Ensure checkout window has full grid (shows BOOKED times)
    if (doctorAvailability.length === 0) {
      seedDefaultGridForWindow();
    }

    // Convert capacity map to unified slots (includes BOOKED)
    for (const [timestamp, capacity] of timeSlotCapacity) {
      if (!isSlotInWindow(capacity.startTime, windowStart, windowEnd)) {
        continue;
      }

      let availableDoctors = capacity.availableDoctorIds.length;
      const unifiedBookingsAtTime = unifiedBookingCounts.get(timestamp) || 0;
      availableDoctors = Math.max(0, availableDoctors - unifiedBookingsAtTime);

      const hadCapacity = capacity.availableDoctorIds.length > 0 || unifiedBookingsAtTime > 0;
      if (!hadCapacity && doctorAvailability.length > 0) {
        continue;
      }

      const endTime = new Date(capacity.startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const availabilityStatus: UnifiedSlot["availabilityStatus"] =
        availableDoctors <= 0
          ? "BOOKED"
          : availableDoctors >= 2
            ? "AVAILABLE"
            : "LIMITED";

      unifiedSlots.push({
        slotId: generateUnifiedSlotId(capacity.startTime),
        startTime: toSydneyISO(capacity.startTime),
        endTime: toSydneyISO(endTime),
        timezone: TIMEZONE,
        appointmentType,
        availabilityStatus,
        availableDoctors,
      });
    }

    // Staff mode: surface exact times freed by cancelled bookings (e.g. non :00/:30 slots)
    if (staffMode) {
      const existingTimestamps = new Set(
        unifiedSlots.map((s) => new Date(s.startTime).getTime())
      );

      const freedFrom = now > windowStart ? now : windowStart;
      const [cancelledBookings, cancelledAppointments] = await Promise.all([
        prisma.consultationBooking.findMany({
          where: {
            status: "BOOKING_CANCELLED",
            scheduledAt: { gte: freedFrom, lt: windowEnd },
          },
          select: { scheduledAt: true },
        }),
        prisma.appointment.findMany({
          where: {
            status: "CANCELLED",
            scheduledAt: { gte: freedFrom, lt: windowEnd },
          },
          select: { scheduledAt: true },
        }),
      ]);

      for (const freed of [...cancelledBookings, ...cancelledAppointments]) {
        const ts = freed.scheduledAt.getTime();
        if (existingTimestamps.has(ts)) continue;

        const timeKey = ts;
        let availableDoctors = doctors.length;
        for (const [, times] of bookedSlotsByDoctor) {
          if (times.has(timeKey)) availableDoctors -= 1;
        }
        const unifiedAtTime = [...unifiedBookedTimes].filter((t) => t === timeKey).length;
        availableDoctors = Math.max(0, availableDoctors - unifiedAtTime);
        if (availableDoctors <= 0) continue;

        const endTime = new Date(freed.scheduledAt);
        endTime.setMinutes(endTime.getMinutes() + 30);

        unifiedSlots.push({
          slotId: generateUnifiedSlotId(freed.scheduledAt),
          startTime: toSydneyISO(freed.scheduledAt),
          endTime: toSydneyISO(endTime),
          timezone: TIMEZONE,
          appointmentType,
          availabilityStatus: availableDoctors >= 2 ? "AVAILABLE" : "LIMITED",
          availableDoctors,
        });
        existingTimestamps.add(ts);
      }
    }

    // Sort slots by time
    unifiedSlots.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    const maxDayOffset = Math.max(0, daysAhead - windowDays);

    return NextResponse.json({
      slots: unifiedSlots,
      timezone: TIMEZONE,
      generatedAt: new Date().toISOString(),
      totalSlots: unifiedSlots.length,
      totalDoctors: doctors.length,
      hasRoster: doctorAvailability.length > 0,
      unifiedCalendar: true,
      staffMode,
      dayOffset,
      windowDays,
      canGoBack: dayOffset > 0,
      canGoForward: dayOffset + windowDays < daysAhead,
      maxDayOffset,
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    return NextResponse.json(
      { error: "Failed to get available slots" },
      { status: 500 }
    );
  }
}
