import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadMemberDashboard } from "@/lib/dashboard/load-member-dashboard";

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

    const now = new Date();
    const loaded = await loadMemberDashboard(userId, now);
    if (!loaded) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const {
      user,
      biomarkerResults,
      healthScore: latestHealthScore,
      goals,
      upcomingReminders,
      upcomingAppointments,
      unreadNotifications,
      recentActivity,
      labReports,
    } = loaded;

    const biomarkerStats = {
      total: biomarkerResults.length,
      optimal: biomarkerResults.filter((r) => r.status === "OPTIMAL").length,
      normal: biomarkerResults.filter((r) => r.status === "NORMAL").length,
      outOfRange: biomarkerResults.filter((r) => r.status === "OUT_OF_RANGE").length,
      critical: biomarkerResults.filter((r) => r.status === "CRITICAL").length,
    };

    const categoryBreakdown: Record<
      string,
      { total: number; optimal: number; normal: number; outOfRange: number }
    > = {};
    for (const result of biomarkerResults) {
      const cat = result.biomarker.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, optimal: 0, normal: 0, outOfRange: 0 };
      }
      categoryBreakdown[cat].total++;
      if (result.status === "OPTIMAL") categoryBreakdown[cat].optimal++;
      else if (result.status === "NORMAL") categoryBreakdown[cat].normal++;
      else categoryBreakdown[cat].outOfRange++;
    }

    const savedBiologicalAge =
      typeof latestHealthScore?.biologicalAge === "number" ? latestHealthScore.biologicalAge : null;
    const savedChronologicalAge =
      typeof latestHealthScore?.chronologicalAge === "number" ? latestHealthScore.chronologicalAge : null;
    const biologicalAgeData =
      savedBiologicalAge == null
        ? null
        : {
            biologicalAge: savedBiologicalAge,
            chronologicalAge: savedChronologicalAge,
          };

    const goalStats = {
      total: goals.length,
      inProgress: goals.filter((g) => g.status === "IN_PROGRESS").length,
      achieved: goals.filter((g) => g.status === "ACHIEVED").length,
      missed: goals.filter((g) => g.status === "MISSED").length,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        memberSince: user.createdAt,
      },
      healthScore: latestHealthScore,
      biologicalAge: biologicalAgeData,
      biomarkerStats,
      categoryBreakdown,
      goalStats,
      goals: goals.filter((g) => g.status === "IN_PROGRESS").slice(0, 5),
      upcomingReminders,
      upcomingAppointments,
      unreadNotifications,
      recentActivity,
      labReports,
      biomarkerResults,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
