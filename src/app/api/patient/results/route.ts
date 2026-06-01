import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProgramBiomarkerStatus, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the program member
    const member = await prisma.programMember.findUnique({
      where: { email: session.user.email },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const whereClause: Prisma.ProgramBiomarkerResultWhereInput = {
      memberId: member.id,
    };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (status === "Flagged") {
      whereClause.status = { not: "NORMAL" as ProgramBiomarkerStatus };
    } else if (status === "Normal") {
      whereClause.status = "NORMAL" as ProgramBiomarkerStatus;
    }

    // Get biomarker results
    const results = await prisma.programBiomarkerResult.findMany({
      where: whereClause,
      orderBy: [{ testedAt: "desc" }, { biomarkerName: "asc" }],
      take: limit,
    });

    // Group results by biomarker to show history
    const groupedResults = results.reduce(
      (acc, result) => {
        if (!acc[result.biomarkerName]) {
          acc[result.biomarkerName] = {
            name: result.biomarkerName,
            category: result.category,
            latestValue: result.value,
            unit: result.unit,
            referenceRange:
              result.referenceLow && result.referenceHigh
                ? `${result.referenceLow}-${result.referenceHigh}`
                : result.referenceHigh
                  ? `<${result.referenceHigh}`
                  : result.referenceLow
                    ? `>${result.referenceLow}`
                    : "N/A",
            status: result.status,
            testedAt: result.testedAt,
            labName: result.labName,
            history: [] as Array<{ date: Date; value: number; status: string }>,
          };
        }
        acc[result.biomarkerName].history.push({
          date: result.testedAt,
          value: result.value,
          status: result.status,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          category: string;
          latestValue: number;
          unit: string;
          referenceRange: string;
          status: string;
          testedAt: Date;
          labName: string | null;
          history: Array<{ date: Date; value: number; status: string }>;
        }
      >
    );

    // Calculate trend for each biomarker
    const resultsWithTrend = Object.values(groupedResults).map((result) => {
      let trend: "up" | "down" | "stable" = "stable";

      if (result.history.length >= 2) {
        const latest = result.history[0].value;
        const previous = result.history[1].value;
        const change = ((latest - previous) / previous) * 100;

        if (change > 5) trend = "up";
        else if (change < -5) trend = "down";
      }

      return {
        ...result,
        trend,
      };
    });

    // Get unique categories
    const categories = [...new Set(results.map((r) => r.category))];

    return NextResponse.json({
      success: true,
      data: {
        results: resultsWithTrend,
        categories,
        totalCount: resultsWithTrend.length,
        flaggedCount: resultsWithTrend.filter((r) => r.status !== "NORMAL").length,
      },
    });
  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get results" },
      { status: 500 }
    );
  }
}
