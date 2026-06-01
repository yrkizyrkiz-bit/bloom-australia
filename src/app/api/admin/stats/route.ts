import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User statistics
    const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.user.count({ where: { role: "MEMBER", subscriptionStatus: "ACTIVE" } }),
      prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    ]);

    // Subscription breakdown
    const subscriptionBreakdown = await prisma.user.groupBy({
      by: ["subscriptionStatus"],
      where: { role: "MEMBER" },
      _count: true,
    });

    // Lab report statistics
    const [totalLabReports, pendingLabReports, processedThisMonth] = await Promise.all([
      prisma.labReport.count(),
      prisma.labReport.count({ where: { status: "PENDING" } }),
      prisma.labReport.count({ where: { status: "PROCESSED", processedAt: { gte: startOfMonth } } }),
    ]);

    // Biomarker statistics
    const [totalBiomarkerResults, biomarkerResultsThisMonth] = await Promise.all([
      prisma.biomarkerResult.count(),
      prisma.biomarkerResult.count({ where: { uploadedAt: { gte: startOfMonth } } }),
    ]);

    // Biomarker status breakdown
    const biomarkerStatusBreakdown = await prisma.biomarkerResult.groupBy({ by: ["status"], _count: true });

    // Goals statistics
    const [totalGoals, activeGoals, achievedGoalsThisMonth] = await Promise.all([
      prisma.healthGoal.count(),
      prisma.healthGoal.count({ where: { status: "IN_PROGRESS" } }),
      prisma.healthGoal.count({ where: { status: "ACHIEVED", completedAt: { gte: startOfMonth } } }),
    ]);

    // Appointments
    const [upcomingAppointments, completedAppointmentsThisMonth] = await Promise.all([
      prisma.appointment.count({ where: { scheduledAt: { gte: now }, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
      prisma.appointment.count({ where: { status: "COMPLETED", scheduledAt: { gte: startOfMonth } } }),
    ]);

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Recent lab reports
    const recentLabReports = await prisma.labReport.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { uploadedAt: "desc" },
      take: 10,
    });

    // Users with critical biomarkers
    const usersWithCritical = await prisma.biomarkerResult.findMany({
      where: { status: "CRITICAL" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        biomarker: { select: { name: true, shortName: true } },
      },
      orderBy: { testedAt: "desc" },
      take: 10,
    });

    // Calculate growth
    const userGrowth = newUsersLastMonth > 0 ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100) : (newUsersThisMonth > 0 ? 100 : 0);

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        userGrowth,
        totalLabReports,
        pendingLabReports,
        processedThisMonth,
        totalBiomarkerResults,
        biomarkerResultsThisMonth,
      },
      subscriptions: subscriptionBreakdown.map(s => ({ status: s.subscriptionStatus, count: s._count })),
      biomarkerStatus: biomarkerStatusBreakdown.map(b => ({ status: b.status, count: b._count })),
      goals: { total: totalGoals, active: activeGoals, achievedThisMonth: achievedGoalsThisMonth },
      appointments: { upcoming: upcomingAppointments, completedThisMonth: completedAppointmentsThisMonth },
      recentActivity: recentActivity.map(a => ({
        id: a.id, action: a.action, entity: a.entity,
        userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : "System",
        createdAt: a.createdAt,
      })),
      recentLabReports: recentLabReports.map(r => ({
        id: r.id, fileName: r.fileName, status: r.status,
        userName: `${r.user.firstName} ${r.user.lastName}`,
        userEmail: r.user.email, uploadedAt: r.uploadedAt, biomarkerCount: r.biomarkerCount,
      })),
      usersWithCritical: usersWithCritical.map(r => ({
        userId: r.user.id, userName: `${r.user.firstName} ${r.user.lastName}`,
        userEmail: r.user.email, biomarker: r.biomarker.name, value: r.value, testedAt: r.testedAt,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
