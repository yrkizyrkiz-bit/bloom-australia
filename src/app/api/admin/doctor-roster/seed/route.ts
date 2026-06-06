import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "CARE_PARTNER", "DOCTOR"];
const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN"];

// Default schedule: Thu/Fri/Sat 9am-7pm
const DEFAULT_SCHEDULE = [
  { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" }, // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" }, // Friday
  { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" }, // Saturday (shorter)
];

// POST /api/admin/doctor-roster/seed - Seed default availability for all doctors
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      doctorId,           // Optional: seed for specific doctor only
      schedule,           // Optional: custom schedule
      clearExisting,      // Optional: clear existing availability first
    } = body;

    const scheduleToUse = schedule || DEFAULT_SCHEDULE;

    // Get doctors to seed
    const whereClause: Record<string, unknown> = { role: "DOCTOR" };
    if (doctorId) {
      whereClause.id = doctorId;
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (doctors.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No doctors found to seed availability for",
        hint: "Create doctor users first with role: DOCTOR",
      }, { status: 404 });
    }

    const results: Array<{
      doctorId: string;
      doctorName: string;
      slotsCreated: number;
      status: string;
    }> = [];

    for (const doctor of doctors) {
      // Check if doctor already has availability
      const existingCount = await prisma.doctorAvailability.count({
        where: { doctorId: doctor.id, isRecurring: true },
      });

      if (existingCount > 0 && !clearExisting) {
        results.push({
          doctorId: doctor.id,
          doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          slotsCreated: 0,
          status: "SKIPPED - Already has schedule",
        });
        continue;
      }

      // Clear existing if requested
      if (clearExisting) {
        await prisma.doctorAvailability.deleteMany({
          where: { doctorId: doctor.id, isRecurring: true },
        });
      }

      // Create availability slots
      const created = await prisma.doctorAvailability.createMany({
        data: scheduleToUse.map((slot: {
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          slotDuration?: number;
        }) => ({
          doctorId: doctor.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || 30,
          isRecurring: true,
          maxBookings: 1,
          status: "AVAILABLE" as const,
        })),
      });

      results.push({
        doctorId: doctor.id,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        slotsCreated: created.count,
        status: "CREATED",
      });
    }

    // Log the seeding action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_ROSTER_SEEDED",
        entity: "doctor_availability",
        details: {
          doctorCount: results.filter(r => r.status === "CREATED").length,
          totalSlots: results.reduce((sum, r) => sum + r.slotsCreated, 0),
          schedule: scheduleToUse,
        },
      },
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        doctorsProcessed: doctors.length,
        doctorsSeeded: results.filter(r => r.status === "CREATED").length,
        doctorsSkipped: results.filter(r => r.status.includes("SKIPPED")).length,
        totalSlotsCreated: results.reduce((sum, r) => sum + r.slotsCreated, 0),
      },
      scheduleUsed: scheduleToUse.map((s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
        ...s,
        dayName: getDayName(s.dayOfWeek),
      })),
    });
  } catch (error) {
    console.error("Error seeding doctor roster:", error);
    return NextResponse.json(
      { error: "Failed to seed doctor roster" },
      { status: 500 }
    );
  }
}

// GET /api/admin/doctor-roster/seed - Get seed status and suggestions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !READ_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all doctors
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Get doctors with existing availability
    const doctorsWithSchedule = await prisma.doctorAvailability.groupBy({
      by: ["doctorId"],
      _count: true,
    });

    const doctorScheduleMap = new Map(
      doctorsWithSchedule.map(d => [d.doctorId, d._count])
    );

    const doctorStatus = doctors.map(doc => ({
      id: doc.id,
      name: `Dr. ${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      hasSchedule: doctorScheduleMap.has(doc.id),
      slotCount: doctorScheduleMap.get(doc.id) || 0,
    }));

    const needsSeeding = doctorStatus.filter(d => !d.hasSchedule);

    return NextResponse.json({
      totalDoctors: doctors.length,
      doctorsWithSchedule: doctorStatus.filter(d => d.hasSchedule).length,
      doctorsWithoutSchedule: needsSeeding.length,
      doctors: doctorStatus,
      needsSeeding,
      defaultSchedule: DEFAULT_SCHEDULE.map(s => ({
        ...s,
        dayName: getDayName(s.dayOfWeek),
      })),
      instructions: {
        seedAll: "POST to this endpoint with empty body to seed all doctors without schedules",
        seedOne: "POST with { doctorId: 'xxx' } to seed a specific doctor",
        customSchedule: "POST with { schedule: [...] } to use a custom schedule",
        clearAndReseed: "POST with { clearExisting: true } to replace existing schedules",
      },
    });
  } catch (error) {
    console.error("Error getting seed status:", error);
    return NextResponse.json(
      { error: "Failed to get seed status" },
      { status: 500 }
    );
  }
}

// Helper function
function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}
