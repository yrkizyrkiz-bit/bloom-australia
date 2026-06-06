import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "CARE_PARTNER", "DOCTOR"];
const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN"];

// GET /api/admin/doctor-roster - List all doctor availability schedules
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !READ_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const includeBlocked = searchParams.get("includeBlocked") === "true";

    // Fetch all doctors
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: "asc" },
    });

    // Build where clause for availability
    const availabilityWhere: Record<string, unknown> = {};
    if (doctorId) {
      availabilityWhere.doctorId = doctorId;
    }

    // Fetch availability schedules
    const availability = await prisma.doctorAvailability.findMany({
      where: availabilityWhere,
      orderBy: [
        { doctorId: "asc" },
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    // Fetch blocked dates if requested
    let blockedDates: Array<{
      id: string;
      doctorId: string;
      blockedDate: Date;
      reason: string | null;
      createdAt: Date;
    }> = [];

    if (includeBlocked) {
      const blockedWhere: Record<string, unknown> = {
        blockedDate: { gte: new Date() },
      };
      if (doctorId) {
        blockedWhere.doctorId = doctorId;
      }

      blockedDates = await prisma.doctorBlockedDate.findMany({
        where: blockedWhere,
        orderBy: { blockedDate: "asc" },
      });
    }

    // Group availability by doctor
    const doctorSchedules = doctors.map((doctor) => {
      const doctorAvailability = availability.filter((a) => a.doctorId === doctor.id);
      const doctorBlockedDates = blockedDates.filter((b) => b.doctorId === doctor.id);

      return {
        doctor: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          email: doctor.email,
        },
        availability: doctorAvailability.map((a) => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          dayName: getDayName(a.dayOfWeek),
          startTime: a.startTime,
          endTime: a.endTime,
          slotDuration: a.slotDuration,
          isRecurring: a.isRecurring,
          specificDate: a.specificDate?.toISOString() || null,
          maxBookings: a.maxBookings,
          status: a.status,
          notes: a.notes,
        })),
        blockedDates: doctorBlockedDates.map((b) => ({
          id: b.id,
          date: b.blockedDate.toISOString().split("T")[0],
          reason: b.reason,
        })),
        hasSchedule: doctorAvailability.length > 0,
      };
    });

    // Stats
    const stats = {
      totalDoctors: doctors.length,
      doctorsWithSchedule: doctorSchedules.filter((d) => d.hasSchedule).length,
      totalAvailabilitySlots: availability.length,
      upcomingBlockedDates: blockedDates.length,
    };

    return NextResponse.json({
      doctors: doctorSchedules,
      stats,
    });
  } catch (error) {
    console.error("Error fetching doctor roster:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor roster" },
      { status: 500 }
    );
  }
}

// POST /api/admin/doctor-roster - Create availability or blocked date
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "CREATE_AVAILABILITY": {
        const {
          doctorId,
          dayOfWeek,
          startTime,
          endTime,
          slotDuration = 30,
          isRecurring = true,
          specificDate,
          maxBookings = 1,
          status = "AVAILABLE",
          notes,
        } = body;

        // Validate required fields
        if (!doctorId) {
          return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
        }
        if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
          return NextResponse.json({ error: "Valid day of week (0-6) is required" }, { status: 400 });
        }
        if (!startTime || !endTime) {
          return NextResponse.json({ error: "Start and end time are required" }, { status: 400 });
        }

        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
          return NextResponse.json({ error: "Time must be in HH:MM format (24hr)" }, { status: 400 });
        }

        // Check doctor exists
        const doctor = await prisma.user.findFirst({
          where: { id: doctorId, role: "DOCTOR" },
        });
        if (!doctor) {
          return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        // Check for overlapping availability
        const existingAvailability = await prisma.doctorAvailability.findFirst({
          where: {
            doctorId,
            dayOfWeek,
            isRecurring,
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } },
                ],
              },
            ],
          },
        });

        if (existingAvailability) {
          return NextResponse.json(
            { error: "Overlapping availability exists for this doctor on this day" },
            { status: 409 }
          );
        }

        // Create availability
        const availability = await prisma.doctorAvailability.create({
          data: {
            doctorId,
            dayOfWeek,
            startTime,
            endTime,
            slotDuration,
            isRecurring,
            specificDate: specificDate ? new Date(specificDate) : null,
            maxBookings,
            status,
            notes,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "DOCTOR_AVAILABILITY_CREATED",
            entity: "doctor_availability",
            entityId: availability.id,
            details: {
              doctorId,
              doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              dayOfWeek,
              startTime,
              endTime,
            },
          },
        });

        return NextResponse.json({
          success: true,
          availability: {
            id: availability.id,
            dayOfWeek: availability.dayOfWeek,
            dayName: getDayName(availability.dayOfWeek),
            startTime: availability.startTime,
            endTime: availability.endTime,
            slotDuration: availability.slotDuration,
            status: availability.status,
          },
          message: `Availability created for Dr. ${doctor.firstName} ${doctor.lastName} on ${getDayName(dayOfWeek)}`,
        });
      }

      case "CREATE_BLOCKED_DATE": {
        const { doctorId, blockedDate, reason } = body;

        if (!doctorId || !blockedDate) {
          return NextResponse.json(
            { error: "Doctor ID and blocked date are required" },
            { status: 400 }
          );
        }

        // Check doctor exists
        const doctor = await prisma.user.findFirst({
          where: { id: doctorId, role: "DOCTOR" },
        });
        if (!doctor) {
          return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        // Check for existing blocked date
        const date = new Date(blockedDate);
        const existingBlock = await prisma.doctorBlockedDate.findUnique({
          where: {
            doctorId_blockedDate: {
              doctorId,
              blockedDate: date,
            },
          },
        });

        if (existingBlock) {
          return NextResponse.json(
            { error: "This date is already blocked for this doctor" },
            { status: 409 }
          );
        }

        // Create blocked date
        const blocked = await prisma.doctorBlockedDate.create({
          data: {
            doctorId,
            blockedDate: date,
            reason,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "DOCTOR_DATE_BLOCKED",
            entity: "doctor_blocked_date",
            entityId: blocked.id,
            details: {
              doctorId,
              doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              blockedDate: date.toISOString().split("T")[0],
              reason,
            },
          },
        });

        return NextResponse.json({
          success: true,
          blockedDate: {
            id: blocked.id,
            date: blocked.blockedDate.toISOString().split("T")[0],
            reason: blocked.reason,
          },
          message: `Date blocked for Dr. ${doctor.firstName} ${doctor.lastName}`,
        });
      }

      case "BULK_CREATE_SCHEDULE": {
        // Create a standard weekly schedule for a doctor
        const { doctorId, schedule } = body;

        if (!doctorId || !schedule || !Array.isArray(schedule)) {
          return NextResponse.json(
            { error: "Doctor ID and schedule array are required" },
            { status: 400 }
          );
        }

        // Check doctor exists
        const doctor = await prisma.user.findFirst({
          where: { id: doctorId, role: "DOCTOR" },
        });
        if (!doctor) {
          return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        // Delete existing recurring availability for this doctor
        await prisma.doctorAvailability.deleteMany({
          where: { doctorId, isRecurring: true },
        });

        // Create new schedule
        const created = await prisma.doctorAvailability.createMany({
          data: schedule.map((slot: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            slotDuration?: number;
          }) => ({
            doctorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration || 30,
            isRecurring: true,
            maxBookings: 1,
            status: "AVAILABLE" as const,
          })),
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "DOCTOR_SCHEDULE_UPDATED",
            entity: "doctor_availability",
            entityId: doctorId,
            details: {
              doctorId,
              doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              slotsCreated: created.count,
            },
          },
        });

        return NextResponse.json({
          success: true,
          created: created.count,
          message: `Weekly schedule created for Dr. ${doctor.firstName} ${doctor.lastName}`,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing doctor roster:", error);
    return NextResponse.json(
      { error: "Failed to manage doctor roster" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/doctor-roster - Update availability or blocked date
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, ...updateData } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID and type are required" },
        { status: 400 }
      );
    }

    if (type === "availability") {
      const allowedFields = [
        "dayOfWeek",
        "startTime",
        "endTime",
        "slotDuration",
        "isRecurring",
        "specificDate",
        "maxBookings",
        "status",
        "notes",
      ];

      const updatePayload: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === "specificDate") {
            updatePayload[field] = updateData[field] ? new Date(updateData[field]) : null;
          } else {
            updatePayload[field] = updateData[field];
          }
        }
      }

      const updated = await prisma.doctorAvailability.update({
        where: { id },
        data: updatePayload,
      });

      return NextResponse.json({
        success: true,
        availability: {
          id: updated.id,
          dayOfWeek: updated.dayOfWeek,
          dayName: getDayName(updated.dayOfWeek),
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: updated.status,
        },
      });
    }

    if (type === "blockedDate") {
      const updated = await prisma.doctorBlockedDate.update({
        where: { id },
        data: {
          reason: updateData.reason,
        },
      });

      return NextResponse.json({
        success: true,
        blockedDate: {
          id: updated.id,
          date: updated.blockedDate.toISOString().split("T")[0],
          reason: updated.reason,
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error updating doctor roster:", error);
    return NextResponse.json(
      { error: "Failed to update doctor roster" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/doctor-roster - Delete availability or blocked date
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID and type are required" },
        { status: 400 }
      );
    }

    if (type === "availability") {
      await prisma.doctorAvailability.delete({
        where: { id },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "DOCTOR_AVAILABILITY_DELETED",
          entity: "doctor_availability",
          entityId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Availability slot deleted",
      });
    }

    if (type === "blockedDate") {
      await prisma.doctorBlockedDate.delete({
        where: { id },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "DOCTOR_BLOCKED_DATE_DELETED",
          entity: "doctor_blocked_date",
          entityId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Blocked date removed",
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting from doctor roster:", error);
    return NextResponse.json(
      { error: "Failed to delete from doctor roster" },
      { status: 500 }
    );
  }
}

// Helper function
function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}
