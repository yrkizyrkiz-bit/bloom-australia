import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateBiologicalAge, mapBiomarkerResultsToInput } from "@/lib/biological-age";

// GET /api/dashboard/stats - Get dashboard statistics for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    const staffRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (userId !== session.user.id && !staffRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, dateOfBirth: true, gender: true, subscriptionStatus: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get biomarker results
    const allResults = await prisma.biomarkerResult.findMany({
      where: { userId },
      include: { biomarker: { select: { name: true, shortName: true, category: true, unit: true } } },
      orderBy: { testedAt: "desc" },
    });

    const latestResults = new Map();
    for (const result of allResults) {
      if (!latestResults.has(result.biomarkerId)) latestResults.set(result.biomarkerId, result);
    }
    const biomarkerResults = Array.from(latestResults.values());

    // Biomarker stats
    const biomarkerStats = {
      total: biomarkerResults.length,
      optimal: biomarkerResults.filter(r => r.status === "OPTIMAL").length,
      normal: biomarkerResults.filter(r => r.status === "NORMAL").length,
      outOfRange: biomarkerResults.filter(r => r.status === "OUT_OF_RANGE").length,
      critical: biomarkerResults.filter(r => r.status === "CRITICAL").length,
    };

    // Category breakdown
    const categoryBreakdown: Record<string, { total: number; optimal: number; normal: number; outOfRange: number }> = {};
    for (const result of biomarkerResults) {
      const cat = result.biomarker.category;
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, optimal: 0, normal: 0, outOfRange: 0 };
      categoryBreakdown[cat].total++;
      if (result.status === "OPTIMAL") categoryBreakdown[cat].optimal++;
      else if (result.status === "NORMAL") categoryBreakdown[cat].normal++;
      else categoryBreakdown[cat].outOfRange++;
    }

    // Latest health score
    const latestHealthScore = await prisma.healthScore.findFirst({ where: { userId }, orderBy: { calculatedAt: "desc" } });

    // Calculate biological age
    let biologicalAgeData = null;
    if (user.dateOfBirth && biomarkerResults.length > 0) {
      const chronologicalAge = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const biomarkerArray = biomarkerResults.map(r => ({ biomarkerId: r.biomarkerId, value: r.value }));
      const biomarkers = mapBiomarkerResultsToInput(biomarkerArray);
      biologicalAgeData = calculateBiologicalAge({ chronologicalAge, gender: user.gender === "FEMALE" ? "female" : "male", biomarkers });
    }

    // Goals
    const goals = await prisma.healthGoal.findMany({
      where: { userId },
      include: { biomarker: { select: { name: true, shortName: true, unit: true } } },
    });
    const goalStats = {
      total: goals.length,
      inProgress: goals.filter(g => g.status === "IN_PROGRESS").length,
      achieved: goals.filter(g => g.status === "ACHIEVED").length,
      missed: goals.filter(g => g.status === "MISSED").length,
    };

    // Upcoming reminders
    const upcomingReminders = await prisma.reminder.findMany({
      where: { userId, isActive: true, isCompleted: false, dueDate: { gte: new Date() } },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // Upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: { userId, scheduledAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    // Unread notifications
    const unreadNotifications = await prisma.notification.count({ where: { userId, isRead: false } });

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });

    // Lab reports
    const labReports = await prisma.labReport.findMany({
      where: { userId },
      select: { id: true, fileName: true, status: true, uploadedAt: true, biomarkerCount: true },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, subscriptionStatus: user.subscriptionStatus, memberSince: user.createdAt },
      healthScore: latestHealthScore,
      biologicalAge: biologicalAgeData,
      biomarkerStats,
      categoryBreakdown,
      goalStats,
      goals: goals.filter(g => g.status === "IN_PROGRESS").slice(0, 5),
      upcomingReminders,
      upcomingAppointments,
      unreadNotifications,
      recentActivity,
      labReports,
      biomarkerResults: biomarkerResults, // Return all results for health test scoring
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
