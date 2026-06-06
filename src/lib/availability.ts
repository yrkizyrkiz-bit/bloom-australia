// GAP-009: Availability logic - DEPRECATED
// This file is deprecated in favor of /api/bookings/availability
// The API uses database-backed doctor roster and proper slot hold/expiry
//
// IMPORTANT: Do NOT use generateAvailableDates() or generateTimeSlots()
// from this file in production. Use the API endpoint instead.

export interface TimeSlot {
  time: string;
  available: boolean;
  slotId?: string;
  doctorId?: string;
  doctorName?: string;
}

export interface AvailableDate {
  date: Date;
  available: boolean;
  reason?: string;
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

// Format full date for display
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Get day name
export function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek];
}

// Check if a date is available for booking
export function isDateAvailable(date: Date, availableDates: AvailableDate[]): boolean {
  const dateString = date.toDateString();
  const found = availableDates.find(d => d.date.toDateString() === dateString);
  return found?.available || false;
}

// ============================================
// DEPRECATED FUNCTIONS - DO NOT USE IN PRODUCTION
// These are kept for backward compatibility only
// Use /api/bookings/availability instead
// ============================================

// GAP-009: DEPRECATED - Use /api/bookings/availability instead
// This function used to generate random/fake availability
// Now just returns empty array to prevent accidental use
export function generateAvailableDates(daysToShow: number = 14): AvailableDate[] {
  console.warn("[DEPRECATED] generateAvailableDates() is deprecated. Use /api/bookings/availability instead.");

  // Return empty to prevent fake booking - use API instead
  const dates: AvailableDate[] = [];
  const today = new Date();

  for (let i = 1; i <= daysToShow; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Mark all as unavailable - real availability comes from API
    dates.push({
      date,
      available: false,
      reason: "Please use the booking system to view available slots",
    });
  }

  return dates;
}

// GAP-009: DEPRECATED - Use /api/bookings/availability instead
// This function used to generate RANDOM slot availability using Math.random()
// Now returns empty array to prevent fake/random bookings
export function generateTimeSlots(date: Date): TimeSlot[] {
  console.warn("[DEPRECATED] generateTimeSlots() is deprecated. Use /api/bookings/availability instead.");

  // Return empty - real slots come from API with proper double-booking prevention
  return [];
}

// ============================================
// NEW: Fetch availability from API
// ============================================

export interface ApiSlot {
  slotId: string;
  doctorId: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  timezone: string;
  appointmentType: string;
  availabilityStatus: "AVAILABLE" | "HELD" | "BOOKED";
}

// Fetch real availability from the API
export async function fetchAvailability(appointmentType: string = "PHONE_CONSULT"): Promise<ApiSlot[]> {
  try {
    const response = await fetch(`/api/bookings/availability?appointmentType=${appointmentType}`);
    if (!response.ok) {
      console.error("[Availability] Failed to fetch from API:", response.status);
      return [];
    }
    const data = await response.json();
    return data.slots || [];
  } catch (error) {
    console.error("[Availability] Error fetching availability:", error);
    return [];
  }
}

// Group slots by day for UI display
export function groupSlotsByDay(slots: ApiSlot[]): Map<string, ApiSlot[]> {
  const grouped = new Map<string, ApiSlot[]>();

  for (const slot of slots) {
    const date = new Date(slot.startTime);
    const dateKey = date.toDateString();

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(slot);
  }

  return grouped;
}

// Format slot time for display
export function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Sydney",
  });
}
