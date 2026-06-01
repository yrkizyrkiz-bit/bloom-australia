import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSMSProviderInfo, getSMSStats } from "@/lib/sms";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get SMS stats
    const smsStats = await getSMSStats({ startDate });

    // Get SMS provider info
    const providerInfo = getSMSProviderInfo();

    // Get email stats (from ActivityLog for now, until we add email tracking)
    const emailStats = {
      total: 0,
      sent: 0,
      failed: 0,
    };

    try {
      // Count emails from activity logs
      const emailActivities = await prisma.activityLog.count({
        where: {
          action: { contains: "EMAIL" },
          createdAt: { gte: startDate },
        },
      });
      emailStats.total = emailActivities;
      emailStats.sent = emailActivities; // Assume all logged emails were sent
    } catch {
      // ActivityLog might not have email tracking
    }

    return NextResponse.json({
      sms: smsStats,
      email: emailStats,
      providerInfo,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification stats" },
      { status: 500 }
    );
  }
}
