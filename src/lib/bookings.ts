import { prisma } from "@/lib/prisma";

// Booking types - maintains backward compatibility with existing code
export interface Booking {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  dateOfBirth: string;
  consultationType: "initial" | "followUp";
  category: string;
  date: string;
  time: string;
  status: "confirmed" | "cancelled" | "completed" | "rescheduled";
  paymentIntentId: string;
  amount: number;
  concerns?: string;
  createdAt: string;
  updatedAt: string;
  calendarEventId?: string;
  // GAP-007: Additional fields for clinical workflow
  userId?: string;
  intakeId?: string;
  doctorId?: string;
  doctorName?: string;
}

// GAP-007: Map legacy status to BookingStatus enum
function mapStatusToEnum(status: Booking["status"]): "SLOT_HELD" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_COMPLETED" | "BOOKING_RESCHEDULED" {
  switch (status) {
    case "confirmed": return "BOOKING_CONFIRMED";
    case "cancelled": return "BOOKING_CANCELLED";
    case "completed": return "BOOKING_COMPLETED";
    case "rescheduled": return "BOOKING_RESCHEDULED";
    default: return "BOOKING_CONFIRMED";
  }
}

// GAP-007: Map BookingStatus enum to legacy status
function mapEnumToStatus(status: string): Booking["status"] {
  switch (status) {
    case "SLOT_HELD": return "confirmed";
    case "BOOKING_CONFIRMED": return "confirmed";
    case "BOOKING_CANCELLED": return "cancelled";
    case "BOOKING_COMPLETED": return "completed";
    case "BOOKING_RESCHEDULED": return "rescheduled";
    default: return "confirmed";
  }
}

// GAP-007: Convert database record to Booking interface
function dbToBooking(record: {
  id: string;
  userId?: string | null;
  bookingType: string;
  scheduledAt: Date;
  status: string;
  paymentIntentId?: string | null;
  notes?: string | null;
  calendarEventId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  intakeId?: string | null;
  patientPhone?: string | null;
  selectedPlan?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
  } | null;
}): Booking {
  const scheduledDate = new Date(record.scheduledAt);

  return {
    id: record.id,
    customerEmail: record.user?.email || "",
    customerName: record.user ? `${record.user.firstName} ${record.user.lastName}`.trim() : "",
    customerPhone: record.patientPhone || record.user?.phone || "",
    dateOfBirth: record.user?.dateOfBirth ? record.user.dateOfBirth.toISOString().split("T")[0] : "",
    consultationType: record.bookingType === "followUp" ? "followUp" : "initial",
    category: record.selectedPlan || "weight_management",
    date: scheduledDate.toISOString().split("T")[0],
    time: scheduledDate.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
    status: mapEnumToStatus(record.status),
    paymentIntentId: record.paymentIntentId || "",
    amount: 0, // Amount is tracked in Invoice/Payment records
    concerns: record.notes || undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    calendarEventId: record.calendarEventId || undefined,
    userId: record.userId || undefined,
    intakeId: record.intakeId || undefined,
    doctorId: record.doctorId || undefined,
    doctorName: record.doctorName || undefined,
  };
}

// Generate unique ID (still useful for external references)
export function generateBookingId(): string {
  return `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// GAP-007: Create booking - now persisted to database
export async function createBooking(data: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> {
  // Parse date and time into scheduledAt DateTime
  const [year, month, day] = data.date.split("-").map(Number);
  const timeMatch = data.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  let hours = timeMatch ? parseInt(timeMatch[1]) : 9;
  const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
  const isPM = timeMatch && timeMatch[3]?.toUpperCase() === "PM";

  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  const scheduledAt = new Date(year, month - 1, day, hours, minutes);

  // Find or create user by email
  let userId: string | undefined;
  if (data.customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: data.customerEmail.toLowerCase() },
      select: { id: true },
    });
    userId = user?.id;
  }

  // Create the booking in database
  const record = await prisma.consultationBooking.create({
    data: {
      userId: userId || null,
      bookingType: data.consultationType === "followUp" ? "follow_up" : "initial_consultation",
      scheduledAt,
      duration: 30,
      status: mapStatusToEnum(data.status),
      paymentIntentId: data.paymentIntentId || null,
      notes: data.concerns || null,
      calendarEventId: data.calendarEventId || null,
      selectedPlan: data.category || null,
      patientPhone: data.customerPhone || null,
      appointmentType: "PHONE_CONSULT",
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  console.log(`[Bookings] Created booking ${record.id} for user ${userId || "unknown"}`);
  return dbToBooking(record);
}

// GAP-007: Get booking by ID - now from database
export async function getBooking(id: string): Promise<Booking | null> {
  const record = await prisma.consultationBooking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  if (!record) return null;
  return dbToBooking(record);
}

// GAP-007: Get bookings by email - now from database
export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  // First find the user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) return [];

  const records = await prisma.consultationBooking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  return records.map(dbToBooking);
}

// GAP-007: Update booking - now persisted to database
export async function updateBooking(id: string, data: Partial<Booking>): Promise<Booking | null> {
  const existing = await prisma.consultationBooking.findUnique({
    where: { id },
  });

  if (!existing) return null;

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (data.status) {
    updateData.status = mapStatusToEnum(data.status);
    if (data.status === "cancelled") updateData.cancelledAt = new Date();
    if (data.status === "completed") updateData.completedAt = new Date();
    if (data.status === "confirmed") updateData.confirmedAt = new Date();
  }

  if (data.date && data.time) {
    const [year, month, day] = data.date.split("-").map(Number);
    const timeMatch = data.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hours = timeMatch ? parseInt(timeMatch[1]) : 9;
    const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
    const isPM = timeMatch && timeMatch[3]?.toUpperCase() === "PM";

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    updateData.scheduledAt = new Date(year, month - 1, day, hours, minutes);
  }

  if (data.concerns !== undefined) updateData.notes = data.concerns;
  if (data.paymentIntentId) updateData.paymentIntentId = data.paymentIntentId;
  if (data.calendarEventId) updateData.calendarEventId = data.calendarEventId;
  if (data.doctorId) updateData.doctorId = data.doctorId;
  if (data.doctorName) updateData.doctorName = data.doctorName;

  const record = await prisma.consultationBooking.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  console.log(`[Bookings] Updated booking ${id}`);
  return dbToBooking(record);
}

// GAP-007: Cancel booking - now persisted to database
export async function cancelBooking(id: string): Promise<Booking | null> {
  return updateBooking(id, { status: "cancelled" });
}

// GAP-007: Reschedule booking - now persisted to database
export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string
): Promise<Booking | null> {
  return updateBooking(id, {
    date: newDate,
    time: newTime,
    status: "rescheduled"
  });
}

// GAP-007: Get all bookings - now from database (for admin dashboard)
export async function getAllBookings(): Promise<Booking[]> {
  const records = await prisma.consultationBooking.findMany({
    orderBy: { createdAt: "desc" },
    take: 500, // Limit for performance
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  return records.map(dbToBooking);
}

// GAP-007: Additional query functions for admin/doctor portal
export async function getBookingsByStatus(status: Booking["status"]): Promise<Booking[]> {
  const records = await prisma.consultationBooking.findMany({
    where: { status: mapStatusToEnum(status) },
    orderBy: { scheduledAt: "asc" },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  return records.map(dbToBooking);
}

// GAP-007: Get upcoming bookings for a specific date range
export async function getUpcomingBookings(startDate: Date, endDate: Date): Promise<Booking[]> {
  const records = await prisma.consultationBooking.findMany({
    where: {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["SLOT_HELD", "BOOKING_CONFIRMED"],
      },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  return records.map(dbToBooking);
}

// GAP-007: Get bookings by doctor
export async function getBookingsByDoctor(doctorId: string): Promise<Booking[]> {
  const records = await prisma.consultationBooking.findMany({
    where: { doctorId },
    orderBy: { scheduledAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
        },
      },
    },
  });

  return records.map(dbToBooking);
}
