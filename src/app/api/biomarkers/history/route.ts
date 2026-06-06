import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface HistoricalDataPoint {
  date: string;
  value: number;
  status: string;
}

interface BiomarkerTrend {
  biomarkerId: string;
  name: string;
  shortName: string;
  unit: string;
  category: string;
  history: HistoricalDataPoint[];
  trend: "improving" | "stable" | "worsening";
  changePercent: number;
  latestValue: number;
  previousValue: number | null;
  optimalRange?: { min: number; max: number };
  normalRange?: { min: number; max: number };
}

interface TestDateSummary {
  date: string;
  biomarkerCount: number;
  optimal: number;
  normal: number;
  outOfRange: number;
}

// GET - Fetch historical biomarker data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const biomarkerId = url.searchParams.get("biomarkerId");
    const category = url.searchParams.get("category");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const months = parseInt(url.searchParams.get("months") || "12");

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get user's gender for range lookup
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true }
    });
    const gender = user?.gender?.toUpperCase() === "FEMALE" ? "female" : "male";

    // Build base query filters
    const whereClause = {
      userId: session.user.id,
      testedAt: { gte: startDate },
      ...(biomarkerId ? { biomarkerId } : {})
    };

    // Fetch all historical results with biomarker definition
    const results = await prisma.biomarkerResult.findMany({
      where: whereClause,
      orderBy: { testedAt: "desc" },
      include: {
        biomarker: true
      }
    });

    // Filter by category if specified (after fetch since Prisma doesn't support nested filtering well)
    const filteredResults = category
      ? results.filter(r => r.biomarker?.category?.toLowerCase() === category.toLowerCase())
      : results;

    // Group by biomarker ID
    const biomarkerGroups = new Map<string, typeof filteredResults>();
    for (const result of filteredResults) {
      const existing = biomarkerGroups.get(result.biomarkerId) || [];
      existing.push(result);
      biomarkerGroups.set(result.biomarkerId, existing);
    }

    // Calculate trends for each biomarker
    const biomarkerTrends: BiomarkerTrend[] = [];

    for (const [biomarkerId, bioResults] of biomarkerGroups.entries()) {
      if (bioResults.length === 0) continue;

      const biomarker = bioResults[0].biomarker;
      if (!biomarker) continue;

      // Sort by date (oldest first for trend calculation)
      const sortedResults = [...bioResults].sort(
        (a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime()
      );

      // Build history array (limited)
      const history: HistoricalDataPoint[] = sortedResults
        .slice(-limit)
        .map(r => ({
          date: r.testedAt.toISOString(),
          value: r.value,
          status: r.status?.toLowerCase() || "normal"
        }));

      // Get latest and previous values
      const latestValue = sortedResults[sortedResults.length - 1].value;
      const previousValue = sortedResults.length > 1
        ? sortedResults[sortedResults.length - 2].value
        : null;

      // Calculate trend
      let trend: "improving" | "stable" | "worsening" = "stable";
      let changePercent = 0;

      if (sortedResults.length >= 2) {
        const firstValue = sortedResults[0].value;
        const lastValue = sortedResults[sortedResults.length - 1].value;
        changePercent = ((lastValue - firstValue) / firstValue) * 100;

        // Parse ranges to determine if higher or lower is better
        let ranges: { optimal_low?: number; optimal_high?: number } = {};
        try {
          const rangeField = gender === "female" ? biomarker.femaleRanges : biomarker.maleRanges;
          if (rangeField) {
            ranges = typeof rangeField === "string" ? JSON.parse(rangeField) : rangeField as typeof ranges;
          }
        } catch {
          // Ignore parse errors
        }

        // Determine if biomarker is "lower is better" or "higher is better"
        // For most biomarkers, being within optimal range is best
        // Check if latest value is closer to or further from optimal
        if (ranges.optimal_low !== undefined && ranges.optimal_high !== undefined) {
          const optimalMid = (ranges.optimal_low + ranges.optimal_high) / 2;
          const firstDistance = Math.abs(firstValue - optimalMid);
          const lastDistance = Math.abs(lastValue - optimalMid);

          if (lastDistance < firstDistance * 0.9) {
            trend = "improving";
          } else if (lastDistance > firstDistance * 1.1) {
            trend = "worsening";
          }
        } else {
          // Default: assume lower is better for most markers
          if (changePercent < -5) trend = "improving";
          else if (changePercent > 5) trend = "worsening";
        }
      }

      // Get ranges
      let optimalRange: { min: number; max: number } | undefined;
      let normalRange: { min: number; max: number } | undefined;

      try {
        const rangeField = gender === "female" ? biomarker.femaleRanges : biomarker.maleRanges;
        if (rangeField) {
          const ranges = typeof rangeField === "string" ? JSON.parse(rangeField) : rangeField;
          if (ranges.optimal_low !== undefined && ranges.optimal_high !== undefined) {
            optimalRange = { min: ranges.optimal_low, max: ranges.optimal_high };
          }
          if (ranges.low !== undefined && ranges.high !== undefined) {
            normalRange = { min: ranges.low, max: ranges.high };
          }
        }
      } catch {
        // Ignore parse errors
      }

      biomarkerTrends.push({
        biomarkerId,
        name: biomarker.name,
        shortName: biomarker.shortName,
        unit: biomarker.unit,
        category: biomarker.category,
        history,
        trend,
        changePercent: Math.round(changePercent * 10) / 10,
        latestValue,
        previousValue,
        optimalRange,
        normalRange
      });
    }

    // Sort by name
    biomarkerTrends.sort((a, b) => a.name.localeCompare(b.name));

    // Get test date summaries
    const testDateMap = new Map<string, TestDateSummary>();
    for (const result of filteredResults) {
      const dateKey = result.testedAt.toISOString().split("T")[0];
      const existing = testDateMap.get(dateKey) || {
        date: dateKey,
        biomarkerCount: 0,
        optimal: 0,
        normal: 0,
        outOfRange: 0
      };

      existing.biomarkerCount++;
      const status = result.status?.toLowerCase();
      if (status === "optimal") existing.optimal++;
      else if (status === "normal") existing.normal++;
      else existing.outOfRange++;

      testDateMap.set(dateKey, existing);
    }

    const testDates = Array.from(testDateMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate overall statistics
    const totalBiomarkers = biomarkerTrends.length;
    const improvingCount = biomarkerTrends.filter(b => b.trend === "improving").length;
    const worseningCount = biomarkerTrends.filter(b => b.trend === "worsening").length;
    const stableCount = biomarkerTrends.filter(b => b.trend === "stable").length;

    return NextResponse.json({
      biomarkers: biomarkerTrends,
      testDates,
      statistics: {
        totalBiomarkers,
        improving: improvingCount,
        stable: stableCount,
        worsening: worseningCount,
        totalTestDates: testDates.length,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error("Error fetching biomarker history:", error);
    return NextResponse.json(
      { error: "Failed to fetch biomarker history" },
      { status: 500 }
    );
  }
}
