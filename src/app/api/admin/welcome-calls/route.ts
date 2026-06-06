import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER", "DOCTOR"];

// GET /api/admin/welcome-calls — list onboarding / welcome call tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending"; // pending | completed | all

    const where: Record<string, unknown> = {
      type: "ONBOARDING",
    };

    if (statusFilter === "pending") {
      where.status = { in: ["PENDING", "IN_PROGRESS"] };
    } else if (statusFilter === "completed") {
      where.status = "COMPLETED";
    }

    const tasks = await prisma.careCommunication.findMany({
      where,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            journeyStatus: true,
            approvalStatus: true,
            subscriptionTier: true,
            assignedCarePartnerId: true,
            prescriptions: {
              where: { category: "WEIGHT_MANAGEMENT", status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                medicationName: true,
                scriptStatus: true,
                pharmacyName: true,
              },
            },
            consultationBookings: {
              where: { status: "BOOKING_COMPLETED" },
              orderBy: { scheduledAt: "desc" },
              take: 1,
              select: { selectedPlan: true, doctorName: true, completedAt: true },
            },
            weightManagementIntakes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { selectedPlan: true },
            },
            membershipSubscription: {
              select: { stripeSubscriptionId: true, planName: true },
            },
          },
        },
      },
    });

    const isCarePartner = session.user.role === "CARE_PARTNER";

    const filtered = isCarePartner
      ? tasks.filter(
          (t) =>
            t.assignedTo === session.user.id ||
            t.user.assignedCarePartnerId === session.user.id ||
            (!t.assignedTo && !t.user.assignedCarePartnerId)
        )
      : tasks;

    const userIds = [...new Set(filtered.map((t) => t.userId))];
    const preferencesRows = userIds.length
      ? await prisma.weightManagementPreferences.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, hasCompletedOnboarding: true },
        })
      : [];
    const onboardingByUser = new Map(
      preferencesRows.map((p) => [p.userId, p.hasCompletedOnboarding])
    );

    const now = new Date();

    const items = filtered.map((t) => {
      const patient = t.user;
      const rx = patient.prescriptions[0] || null;
      const booking = patient.consultationBookings[0] || null;
      const intake = patient.weightManagementIntakes[0] || null;
      const selectedPlan =
        booking?.selectedPlan ||
        intake?.selectedPlan ||
        patient.membershipSubscription?.planName ||
        null;
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      let urgency: "overdue" | "today" | "upcoming" | "none" = "none";
      if (dueDate && t.status !== "COMPLETED") {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        if (dueDate < todayStart) urgency = "overdue";
        else if (dueDate < tomorrowStart) urgency = "today";
        else urgency = "upcoming";
      }

      return {
        id: t.id,
        subject: t.subject,
        notes: t.notes,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString() || null,
        assignedTo: t.assignedTo,
        urgency,
        patient: {
          id: patient.id,
          fullName: `${patient.firstName} ${patient.lastName}`.trim(),
          email: patient.email,
          phone: patient.phone,
          journeyStatus: patient.journeyStatus,
          approvalStatus: patient.approvalStatus,
          subscriptionTier: patient.subscriptionTier,
          selectedPlan,
          hasStripeSubscription: Boolean(
            patient.membershipSubscription?.stripeSubscriptionId
          ),
          doctorName: booking?.doctorName || null,
          consultationCompletedAt: booking?.completedAt?.toISOString() || null,
          hasCompletedPortalOnboarding:
            onboardingByUser.get(patient.id) ?? false,
        },
        prescription: rx
          ? {
              id: rx.id,
              medicationName: rx.medicationName,
              scriptStatus: rx.scriptStatus,
              pharmacyName: rx.pharmacyName,
            }
          : null,
        urls: {
          memberProfile: `/admin/crm/customers/${patient.id}`,
          prescriptions: rx
            ? `/admin/prescriptions?prescriptionId=${rx.id}`
            : "/admin/prescriptions",
        },
      };
    });

    const counts = {
      pending: items.filter((i) => i.status !== "COMPLETED").length,
      completed: items.filter((i) => i.status === "COMPLETED").length,
      overdue: items.filter((i) => i.urgency === "overdue").length,
      dueToday: items.filter((i) => i.urgency === "today").length,
    };

    return NextResponse.json({ items, counts });
  } catch (error) {
    console.error("[welcome-calls] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch welcome calls" },
      { status: 500 }
    );
  }
}
