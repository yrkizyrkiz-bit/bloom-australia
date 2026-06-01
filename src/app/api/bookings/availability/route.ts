import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GAP-009: Real availability from doctor roster/calendar
// UNIFIED CALENDAR: Shows one slot per time (not per doctor)
// Doctor assignment happens during triage by care partner

// GAP-011: Use IANA timezone for proper DST handling
const TIMEZONE = "Australia/Sydney";

// Generate unified slot ID from time (doctor-agnostic)
function generateUnifiedSlotId(startTime: Date): string {
  const timestamp = startTime.getTime().toString(36);
  return `slot_unified_${timestamp}`;
}

// GAP-011: Get Sydney timezone offset dynamically (handles AEST/AEDT)
function getSydneyOffset(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find(p => p.type === "timeZoneName");
  if (offsetPart?.value) {
    const match = offsetPart.value.match(/GMT([+-])(\d+)/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, "0");
      return `${sign}${hours}:00`;
    }
  }
  // Fallback
  const sydneyDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const diffHours = (sydneyDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  const sign = diffHours >= 0 ? "+" : "-";
  const absHours = Math.abs(Math.round(diffHours)).toString().padStart(2, "0");
  return `${sign}${absHours}:00`;
}

// GAP-011: Convert to ISO with dynamic Sydney timezone offset
function toSydneyISO(date: Date): string {
  const offset = getSydneyOffset(date);
  const isoString = date.toISOString();
  return isoString.replace("Z", offset);
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentType = searchParams.get("appointmentType") || "PHONE_CONSULT";
    const daysAhead = parseInt(searchParams.get("days") || "14", 10);

    const now = new Date();
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

    // Track capacity at each time slot
    const timeSlotCapacity = new Map<number, TimeSlotCapacity>();

    // Helper to add doctor availability to a time slot
    const addDoctorToSlot = (slotTime: Date, doctorId: string) => {
      const timestamp = slotTime.getTime();

      if (!timeSlotCapacity.has(timestamp)) {
        timeSlotCapacity.set(timestamp, {
          timestamp,
          startTime: new Date(slotTime),
          availableDoctorIds: [],
        });
      }

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

    // If no roster configured, use default availability (Thu/Fri/Sat 9am-7pm)
    if (doctorAvailability.length === 0) {
      console.warn("[Availability] No roster configured, using default schedule (Thu/Fri/Sat 9am-7pm)");

      // Generate default slots for next 14 days
      for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        date.setHours(0, 0, 0, 0);

        const dayOfWeek = date.getDay();
        // Default: Thu=4, Fri=5, Sat=6
        if (![4, 5, 6].includes(dayOfWeek)) continue;

        const dateStr = date.toISOString().split("T")[0];

        // Generate slots from 9am to 7pm (30-min intervals)
        for (let hour = 9; hour < 19; hour++) {
          for (const minute of [0, 30]) {
            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);

            // Skip past slots
            if (slotTime <= now) continue;

            // Add each available doctor to this slot
            for (const doctor of doctors) {
              // Check if blocked
              if (blockedDatesByDoctor.get(doctor.id)?.has(dateStr)) continue;

              addDoctorToSlot(slotTime, doctor.id);
            }
          }
        }
      }
    } else {
      // GAP-009: Use roster-based availability
      for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        date.setHours(0, 0, 0, 0);

        const dayOfWeek = date.getDay();
        const dateStr = date.toISOString().split("T")[0];

        // Find applicable availability for this day
        for (const avail of doctorAvailability) {
          // Check if this availability applies to this day
          if (avail.isRecurring) {
            if (avail.dayOfWeek !== dayOfWeek) continue;
          } else {
            if (avail.specificDate && avail.specificDate.toISOString().split("T")[0] !== dateStr) continue;
          }

          // Check if blocked
          if (blockedDatesByDoctor.get(avail.doctorId)?.has(dateStr)) continue;

          // Parse start/end times
          const start = parseTime(avail.startTime);
          const end = parseTime(avail.endTime);
          const slotDuration = avail.slotDuration || 30;

          // Generate slots based on roster
          let currentHour = start.hours;
          let currentMinute = start.minutes;

          while (currentHour < end.hours || (currentHour === end.hours && currentMinute < end.minutes)) {
            const slotTime = new Date(date);
            slotTime.setHours(currentHour, currentMinute, 0, 0);

            // Skip past slots
            if (slotTime > now) {
              addDoctorToSlot(slotTime, avail.doctorId);
            }

            // Advance to next slot
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

    // Convert capacity map to unified slots
    for (const [timestamp, capacity] of timeSlotCapacity) {
      // Calculate effective available doctors
      let availableDoctors = capacity.availableDoctorIds.length;

      // Subtract unified bookings (bookings without assigned doctor)
      const unifiedBookingsAtTime = unifiedBookingCounts.get(timestamp) || 0;
      availableDoctors = Math.max(0, availableDoctors - unifiedBookingsAtTime);

      // Only include slots with at least one available doctor
      if (availableDoctors > 0) {
        const endTime = new Date(capacity.startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        unifiedSlots.push({
          slotId: generateUnifiedSlotId(capacity.startTime),
          startTime: toSydneyISO(capacity.startTime),
          endTime: toSydneyISO(endTime),
          timezone: TIMEZONE,
          appointmentType,
          availabilityStatus: availableDoctors >= 2 ? "AVAILABLE" : "LIMITED",
          availableDoctors,
        });
      }
    }

    // Sort slots by time
    unifiedSlots.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return NextResponse.json({
      slots: unifiedSlots,
      timezone: TIMEZONE,
      generatedAt: new Date().toISOString(),
      totalSlots: unifiedSlots.length,
      totalDoctors: doctors.length,
      hasRoster: doctorAvailability.length > 0,
      // Note: Doctor assignment happens during triage by care partner
      unifiedCalendar: true,
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    return NextResponse.json(
      { error: "Failed to get available slots" },
      { status: 500 }
    );
  }
}
