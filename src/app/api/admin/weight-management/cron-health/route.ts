import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CRON_TYPES = [
  "program_daily_reminder",
  "weekly_program_insight",
  "program_migration_batch",
  "member_program_started",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await prisma.automationLog.findMany({
      where: {
        automationType: { in: CRON_TYPES },
        firedAt: { gte: since },
      },
      orderBy: { firedAt: "desc" },
      take: 50,
    });

    const lastByType: Record<string, string | null> = {};
    for (const t of CRON_TYPES) {
      const hit = logs.find((l) => l.automationType === t);
      lastByType[t] = hit?.firedAt?.toISOString() ?? null;
    }

    return NextResponse.json({
      success: true,
      vercelCrons: [
        { path: "/api/cron/program-daily", schedule: "Daily 20:00 UTC" },
        { path: "/api/cron/program-weekly-insights", schedule: "Sunday 10:30 UTC" },
        { path: "/api/cron/churn-scoring", schedule: "Sunday 10:00 UTC" },
      ],
      lastRuns: lastByType,
      recentLogs: logs.slice(0, 15),
    });
  } catch (error) {
    console.error("[cron-health]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
