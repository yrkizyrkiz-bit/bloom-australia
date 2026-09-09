import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HOLISTIC_HEALTH_ANALYSIS_TYPE } from "@/lib/holistic-health-report";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";

export const dynamic = "force-dynamic";

function panelDateFromReport(report: HolisticHealthReport): string | null {
  const markers = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
    ...report.priorityBands.good,
  ];
  const dates = markers
    .map((m) => m.testedAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[dates.length - 1] || report.analysisTimestamp || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId") || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.aIAnalysisHistory.findMany({
      where: {
        userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        analysisData: true,
        overallScore: true,
        riskLevel: true,
        biomarkerCount: true,
        createdAt: true,
      },
    });

    const history = rows
      .map((row) => {
        const report = sanitizeHolisticHealthReport(
          row.analysisData as Partial<HolisticHealthReport>
        );
        if (!report || report.aiProvider !== "claude") return null;
        return {
          id: row.id,
          overallScore: row.overallScore,
          riskLevel: row.riskLevel,
          biomarkerCount: row.biomarkerCount,
          createdAt: row.createdAt.toISOString(),
          dataDate: panelDateFromReport(report),
          report,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[holistic-health-report/history] GET", error);
    return NextResponse.json({ error: "Failed to fetch report history" }, { status: 500 });
  }
}
