import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/biomarkers/results - Get user's biomarker results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const biomarkerId = searchParams.get("biomarkerId");
    const category = searchParams.get("category");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const latest = searchParams.get("latest") === "true";

    // Non-staff can only view their own results
    const staffRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (userId !== session.user.id && !staffRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = { userId };

    if (biomarkerId) {
      where.biomarkerId = biomarkerId;
    }

    if (fromDate) {
      where.testedAt = { ...where.testedAt, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.testedAt = { ...where.testedAt, lte: new Date(toDate) };
    }

    // If category filter, we need to join with biomarker definitions
    let results;

    if (latest) {
      // Get only the latest result for each biomarker
      const allResults = await prisma.biomarkerResult.findMany({
        where,
        include: {
          biomarker: {
            select: {
              name: true,
              shortName: true,
              category: true,
              unit: true,
              maleRanges: true,
              femaleRanges: true,
            },
          },
        },
        orderBy: { testedAt: "desc" },
      });

      // Group by biomarkerId and take the latest
      const latestMap = new Map();
      for (const result of allResults) {
        if (!latestMap.has(result.biomarkerId)) {
          latestMap.set(result.biomarkerId, result);
        }
      }
      results = Array.from(latestMap.values());

      // Filter by category if specified
      if (category) {
        results = results.filter((r: { biomarker: { category: string } }) => r.biomarker.category === category.toUpperCase());
      }
    } else {
      results = await prisma.biomarkerResult.findMany({
        where,
        include: {
          biomarker: {
            select: {
              name: true,
              shortName: true,
              category: true,
              unit: true,
              maleRanges: true,
              femaleRanges: true,
            },
          },
        },
        orderBy: { testedAt: "desc" },
        take: 1000,
      });

      // Filter by category if specified
      if (category) {
        results = results.filter(r => r.biomarker.category === category.toUpperCase());
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching biomarker results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to calculate biomarker status based on ranges
function calculateStatus(value: number, biomarkerDef: any, gender: string): string {
  if (!biomarkerDef) return "NORMAL";

  const ranges = gender === "FEMALE" ? biomarkerDef.femaleRanges : biomarkerDef.maleRanges;
  if (!ranges) return "NORMAL";

  // Parse ranges (stored as JSON)
  const rangeData = typeof ranges === "string" ? JSON.parse(ranges) : ranges;

  const { low, optimal_low, optimal_high, high } = rangeData;

  if (value >= optimal_low && value <= optimal_high) {
    return "OPTIMAL";
  } else if (value >= low && value <= high) {
    return "NORMAL";
  } else if (value < low * 0.8 || value > high * 1.2) {
    return "CRITICAL";
  } else {
    return "OUT_OF_RANGE";
  }
}

// POST /api/biomarkers/results - Add biomarker results (admin, care partner, doctor)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, results, labReportId } = body;

    console.log("[Biomarker Results] Received save request:", { userId, resultsCount: results?.length });

    if (!userId || !results || !Array.isArray(results)) {
      console.error("[Biomarker Results] Invalid request body:", body);
      return NextResponse.json(
        { error: "userId and results array are required" },
        { status: 400 }
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Results array cannot be empty" },
        { status: 400 }
      );
    }

    // Verify user exists and get gender for range calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, gender: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.error("[Biomarker Results] User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all biomarker definitions for status calculation
    const biomarkerDefs = await prisma.biomarkerDefinition.findMany();
    const biomarkerDefMap = new Map(biomarkerDefs.map(b => [b.biomarkerId, b]));

    // Validate all biomarker IDs exist
    const invalidIds = results.filter((r: any) => !biomarkerDefMap.has(r.biomarkerId));
    if (invalidIds.length > 0) {
      console.error("[Biomarker Results] Invalid biomarker IDs:", invalidIds.map((r: any) => r.biomarkerId));
      return NextResponse.json({
        error: `Invalid biomarker IDs: ${invalidIds.map((r: any) => r.biomarkerId).join(", ")}`
      }, { status: 400 });
    }

    // Check for existing results to avoid duplicates
    // A duplicate is defined as: same userId + biomarkerId + testedAt (same day) + same value
    const existingResults = await prisma.biomarkerResult.findMany({
      where: {
        userId,
        biomarkerId: { in: results.map((r: any) => r.biomarkerId) },
      },
      select: {
        biomarkerId: true,
        value: true,
        testedAt: true,
      },
    });

    // Create a set of existing result keys for fast lookup
    // Key format: "biomarkerId|date|value" where date is YYYY-MM-DD
    const existingKeys = new Set<string>();
    for (const existing of existingResults) {
      const dateStr = new Date(existing.testedAt).toISOString().split('T')[0];
      const key = `${existing.biomarkerId}|${dateStr}|${existing.value}`;
      existingKeys.add(key);
    }

    // Filter out duplicates
    const newResults: any[] = [];
    const duplicateResults: any[] = [];

    for (const result of results) {
      const testedAt = new Date(result.testedAt || new Date());
      const dateStr = testedAt.toISOString().split('T')[0];
      const key = `${result.biomarkerId}|${dateStr}|${result.value}`;

      if (existingKeys.has(key)) {
        duplicateResults.push(result);
        console.log(`[Biomarker Results] Skipping duplicate: ${result.biomarkerId} = ${result.value} on ${dateStr}`);
      } else {
        newResults.push(result);
        // Add to set to prevent duplicates within the same batch
        existingKeys.add(key);
      }
    }

    console.log(`[Biomarker Results] Found ${duplicateResults.length} duplicates, ${newResults.length} new results to save`);

    // If all results are duplicates, return early with info
    if (newResults.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        duplicatesSkipped: duplicateResults.length,
        message: `All ${duplicateResults.length} results already exist - no new data to save`
      }, { status: 200 });
    }

    // Create only new results with calculated status
    const createdResults = await prisma.$transaction(
      newResults.map((result: any) => {
        const biomarkerDef = biomarkerDefMap.get(result.biomarkerId);
        const calculatedStatus = result.status || calculateStatus(result.value, biomarkerDef, user.gender);

        return prisma.biomarkerResult.create({
          data: {
            userId,
            biomarkerId: result.biomarkerId,
            value: result.value,
            status: calculatedStatus.toUpperCase(),
            testedAt: new Date(result.testedAt || new Date()),
            uploadedBy: session.user.id,
            labReportId: labReportId || null,
            notes: result.notes || null,
          },
        });
      })
    );

    console.log(`[Biomarker Results] Successfully saved ${createdResults.length} results for user ${user.firstName} ${user.lastName} (${duplicateResults.length} duplicates skipped)`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "BIOMARKER_RESULTS_UPLOADED",
        entity: "biomarker_result",
        details: {
          targetUserId: userId,
          targetUserName: `${user.firstName} ${user.lastName}`,
          count: createdResults.length,
          duplicatesSkipped: duplicateResults.length,
        },
      },
    });

    // Create notification for the user (only if new results were added)
    if (createdResults.length > 0) {
      await prisma.notification.create({
        data: {
          userId,
          type: "SUCCESS",
          title: "New Test Results Available",
          message: `${createdResults.length} new biomarker results have been uploaded to your profile.`,
          category: "BIOMARKER",
        },
      });
    }

    // Build response message
    let message = `Successfully saved ${createdResults.length} biomarker results`;
    if (duplicateResults.length > 0) {
      message += ` (${duplicateResults.length} duplicate${duplicateResults.length > 1 ? 's' : ''} skipped)`;
    }

    return NextResponse.json({
      success: true,
      results: createdResults,
      duplicatesSkipped: duplicateResults.length,
      message,
    }, { status: 201 });
  } catch (error) {
    console.error("[Biomarker Results] Error creating biomarker results:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
