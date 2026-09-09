import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";

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

/** Lower rank = better clinical band. */
function statusBandRank(status: string | null | undefined): number {
  const s = (status || "normal").toLowerCase();
  if (s === "optimal") return 0;
  if (s === "normal") return 1;
  if (s === "critical") return 3;
  // out_of_range, high, low, abnormal, etc.
  return 2;
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
    const filteredResults = (category
      ? results.filter(r => r.biomarker?.category?.toLowerCase() === category.toLowerCase())
      : results
    ).filter((r) => isCatalogBiomarker(r.biomarkerId));

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

      // Get latest and previous values (previous = reading immediately before latest)
      const latest = sortedResults[sortedResults.length - 1];
      const previous =
        sortedResults.length >= 2 ? sortedResults[sortedResults.length - 2] : null;
      const latestValue = latest.value;
      const previousValue = previous?.value ?? null;

      // Trend: compare latest vs previous within the 24-month window.
      // A status-band change (e.g. optimal → normal) is never "stable".
      let trend: "improving" | "stable" | "worsening" = "stable";
      let changePercent = 0;

      const windowStart = startDate.getTime();
      const previousInWindow =
        previous != null && new Date(previous.testedAt).getTime() >= windowStart;

      if (previousInWindow && previous) {
        if (previous.value !== 0) {
          changePercent = ((latestValue - previous.value) / Math.abs(previous.value)) * 100;
        }

        const previousRank = statusBandRank(previous.status);
        const latestRank = statusBandRank(latest.status);

        if (latestRank < previousRank) {
          trend = "improving";
        } else if (latestRank > previousRank) {
          trend = "worsening";
        } else {
          // Same band → stable (no range change between consecutive tests)
          trend = "stable";
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
