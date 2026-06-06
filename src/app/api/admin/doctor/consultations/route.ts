import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/doctor/consultations - Get doctor's scheduled consultations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const doctorId = searchParams.get("doctorId") || session.user.id;

    // Build date filter
    let dateFilter = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    // Build status filter
    let statusFilter = {};
    if (status === "pending") {
      statusFilter = {
        status: { in: ["BOOKING_CONFIRMED", "SLOT_HELD"] },
      };
    } else if (status === "completed") {
      statusFilter = {
        status: "BOOKING_COMPLETED",
      };
    } else if (status === "awaiting_decision") {
      // Consultations where call is completed but doctor hasn't made decision
      statusFilter = {
        status: "BOOKING_CONFIRMED",
        completedAt: { not: null },
      };
    }

    // Fetch consultations
    const consultations = await prisma.consultationBooking.findMany({
      where: {
        // Filter by doctor if specified (for doctors viewing their own)
        // Admin can see all
        ...(session.user.role === "DOCTOR" ? { doctorId } : {}),
        ...statusFilter,
        ...dateFilter,
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        status: true,
        completedAt: true,
        notes: true,
        appointmentType: true,
        doctorId: true,
        doctorName: true,
        patientPhone: true,
        patientBmi: true,
        riskFlags: true,
        doctorBriefUrl: true,
        selectedPlan: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            journeyStatus: true,
            approvalStatus: true,
            triageScore: true,
            healthProfile: {
              select: {
                systolicBP: true,
                diastolicBP: true,
                onBPMedication: true,
              },
            },
            weightLogs: {
              orderBy: { measuredAt: "desc" },
              take: 1,
              select: {
                weight: true,
                measuredAt: true,
              },
            },
            internalNotes: {
              where: { category: "MEDICAL" },
              orderBy: { createdAt: "desc" },
              take: 10,
              select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                isPinned: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Transform data for frontend - GAP-012: Filter out consultations without users
    const transformedConsultations = consultations
      .filter((consultation) => consultation.user !== null)
      .map((consultation) => {
        const user = consultation.user!; // Safe after filter
        return {
          id: consultation.id,
          scheduledAt: consultation.scheduledAt.toISOString(),
          duration: consultation.duration,
          status: consultation.status,
          completedAt: consultation.completedAt?.toISOString() || null,
          appointmentType: consultation.appointmentType,
          doctorId: consultation.doctorId,
          doctorName: consultation.doctorName,
          patientPhone: consultation.patientPhone || user.phone,
          patientBmi: consultation.patientBmi,
          riskFlags: consultation.riskFlags,
          doctorBriefUrl: consultation.doctorBriefUrl,
          selectedPlan: consultation.selectedPlan,
          patient: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth?.toISOString() || null,
            gender: user.gender,
            journeyStatus: user.journeyStatus,
            approvalStatus: user.approvalStatus,
            triageScore: user.triageScore,
            currentWeight: user.weightLogs[0]?.weight || null,
            healthProfile: user.healthProfile,
            medicalNotes: user.internalNotes,
          },
          notes: consultation.notes,
          createdAt: consultation.createdAt.toISOString(),
          // Derived status flags
          isCallCompleted: consultation.completedAt !== null,
          isAwaitingDecision:
            consultation.completedAt !== null &&
            user.approvalStatus === "PENDING",
          isPast: consultation.scheduledAt < new Date(),
        };
      });

    // Get summary counts
    const counts = {
      total: transformedConsultations.length,
      pending: transformedConsultations.filter(
        (c) => c.status === "BOOKING_CONFIRMED" && !c.isCallCompleted
      ).length,
      awaitingDecision: transformedConsultations.filter(
        (c) => c.isAwaitingDecision
      ).length,
      completed: transformedConsultations.filter(
        (c) => c.status === "BOOKING_COMPLETED"
      ).length,
      todayCount: transformedConsultations.filter((c) => {
        const consultDate = new Date(c.scheduledAt);
        const today = new Date();
        return consultDate.toDateString() === today.toDateString();
      }).length,
    };

    return NextResponse.json({
      consultations: transformedConsultations,
      counts,
    });
  } catch (error) {
    console.error("Error fetching doctor consultations:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultations" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/doctor/consultations - Mark consultation as call completed
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { consultationId, callCompleted, notes } = body;

    if (!consultationId) {
      return NextResponse.json(
        { error: "Consultation ID is required" },
        { status: 400 }
      );
    }

    const consultation = await prisma.consultationBooking.findUnique({
      where: { id: consultationId },
      include: { user: true },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Update consultation
    const updated = await prisma.consultationBooking.update({
      where: { id: consultationId },
      data: {
        completedAt: callCompleted ? new Date() : null,
        notes: notes || consultation.notes,
        status: callCompleted ? "BOOKING_CONFIRMED" : consultation.status,
      },
    });

    // Update user journey status if call completed
    if (callCompleted && consultation.userId) {
      await prisma.user.update({
        where: { id: consultation.userId },
        data: {
          journeyStatus: "AWAITING_DOCTOR_DECISION",
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: consultation.userId,
          action: "CONSULTATION_CALL_COMPLETED",
          entity: "consultation_booking",
          entityId: consultationId,
          details: {
            completedBy: session.user.id,
            doctorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
            completedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      consultation: {
        id: updated.id,
        completedAt: updated.completedAt?.toISOString() || null,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Error updating consultation:", error);
    return NextResponse.json(
      { error: "Failed to update consultation" },
      { status: 500 }
    );
  }
}
