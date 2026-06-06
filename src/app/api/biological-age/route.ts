import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  calculateBiologicalAge,
  mapBiomarkerResultsToInput,
  getBiologicalAgeBiomarkers,
  type BiologicalAgeResult,
} from "@/lib/biological-age";

// GET /api/biological-age - Get biological age for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const includeFactors = searchParams.get("includeFactors") === "true";

    // Non-admins can only view their own data
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.dateOfBirth) {
      return NextResponse.json({
        error: "Date of birth required for biological age calculation",
        requiresDob: true,
      }, { status: 400 });
    }

    // Calculate chronological age
    const chronologicalAge = Math.floor(
      (Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Get latest biomarker results
    const biomarkerResults = await prisma.biomarkerResult.findMany({
      where: { userId },
      orderBy: { testedAt: "desc" },
    });

    if (biomarkerResults.length === 0) {
      return NextResponse.json({
        error: "No biomarker results found",
        requiresBiomarkers: true,
        requiredBiomarkers: getBiologicalAgeBiomarkers(),
      }, { status: 400 });
    }

    // Get latest result for each biomarker
    const latestResults = new Map<string, { biomarkerId: string; value: number }>();
    for (const result of biomarkerResults) {
      if (!latestResults.has(result.biomarkerId)) {
        latestResults.set(result.biomarkerId, {
          biomarkerId: result.biomarkerId,
          value: result.value,
        });
      }
    }

    // Map to calculation input
    const biomarkers = mapBiomarkerResultsToInput(Array.from(latestResults.values()));
    const gender = user.gender === "FEMALE" ? "female" : "male";

    // Calculate biological age
    const result = calculateBiologicalAge({
      chronologicalAge,
      gender,
      biomarkers,
    });

    // Get the most recent health score with biological age
    const latestHealthScore = await prisma.healthScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    // Prepare response
    const response: {
      biologicalAge: BiologicalAgeResult;
      user: {
        id: string;
        name: string;
        chronologicalAge: number;
        gender: string;
      };
      savedHealthScore?: {
        id: string;
        biologicalAge: number | null;
        calculatedAt: Date;
      };
    } = {
      biologicalAge: includeFactors ? result : {
        ...result,
        contributingFactors: result.contributingFactors.slice(0, 5),
      },
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        chronologicalAge,
        gender,
      },
    };

    if (latestHealthScore) {
      response.savedHealthScore = {
        id: latestHealthScore.id,
        biologicalAge: latestHealthScore.biologicalAge,
        calculatedAt: latestHealthScore.calculatedAt,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Biological Age] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/biological-age - Calculate and save biological age
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, saveToHealthScore = true } = body;

    // Only admins can calculate for other users
    const targetUserId = userId || session.user.id;
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.dateOfBirth) {
      return NextResponse.json({
        error: "Date of birth required for biological age calculation",
        requiresDob: true,
      }, { status: 400 });
    }

    // Calculate chronological age
    let chronologicalAge: number;
    try {
      const dob = new Date(user.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new Error(`Invalid date of birth: ${user.dateOfBirth}`);
      }
      chronologicalAge = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      console.log(`[Biological Age] DOB: ${user.dateOfBirth}, Chronological age: ${chronologicalAge}`);
    } catch (dateError) {
      console.error("[Biological Age] Date parsing error:", dateError);
      return NextResponse.json({
        error: `Invalid date of birth format: ${user.dateOfBirth}`,
      }, { status: 400 });
    }

    // Get all biomarker results sorted by test date
    const biomarkerResults = await prisma.biomarkerResult.findMany({
      where: { userId: targetUserId },
      orderBy: { testedAt: "desc" },
    });

    if (biomarkerResults.length === 0) {
      return NextResponse.json({
        error: "No biomarker results found",
        requiresBiomarkers: true,
      }, { status: 400 });
    }

    // Use the LATEST result for each biomarker, regardless of test date
    // This is important because blood tests are often done on different days
    // (e.g., CRP on day 1, full blood count on day 3)
    // Results are already sorted by testedAt DESC, so first occurrence is latest
    console.log(`[Biological Age] Finding latest result for each biomarker from ${biomarkerResults.length} total results`);

    // Get the latest result for each unique biomarker
    const latestResults = new Map<string, { biomarkerId: string; value: number; status: string }>();
    for (const result of biomarkerResults) {
      if (!latestResults.has(result.biomarkerId)) {
        latestResults.set(result.biomarkerId, {
          biomarkerId: result.biomarkerId,
          value: result.value,
          status: result.status,
        });
      }
    }

    // Log all biomarkers being used
    const latestResultsArray = Array.from(latestResults.values());
    console.log(`[Biological Age] Using ${latestResultsArray.length} unique biomarkers (latest value for each):`);
    for (const r of latestResultsArray) {
      console.log(`  - ${r.biomarkerId}: ${r.value}`);
    }

    // Map to calculation input
    const biomarkers = mapBiomarkerResultsToInput(latestResultsArray);
    console.log(`[Biological Age] Mapped biomarkers for calculation:`, JSON.stringify(biomarkers, null, 2));

    const gender = user.gender === "FEMALE" ? "female" : "male";

    // Calculate biological age
    const result = calculateBiologicalAge({
      chronologicalAge,
      gender,
      biomarkers,
    });

    console.log(`[Biological Age] Calculated for ${user.firstName} ${user.lastName}: ${result.biologicalAge} (chronological: ${chronologicalAge}, using ${latestResults.size} biomarkers)`);
    console.log(`[Biological Age] Phenotypic Age: ${result.phenotypicAge}, Confidence: ${result.confidence}`);

    // Save to health score if requested
    let healthScore = null;
    if (saveToHealthScore) {
      // Calculate category scores from the latest results
      const categoryScores = calculateCategoryScores(latestResultsArray);

      // Calculate overall score
      const overall = categoryScores.length > 0
        ? Math.round(categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length)
        : result.ageAccelerationPercentile > 50 ? 100 - result.ageAccelerationPercentile : 50 + (50 - result.ageAccelerationPercentile);

      healthScore = await prisma.healthScore.create({
        data: {
          userId: targetUserId,
          overall: Math.round(overall),
          biologicalAge: Math.round(result.biologicalAge),
          chronologicalAge,
          categoryScores: categoryScores,
        },
      });

      console.log(`[Biological Age] Saved health score: ${healthScore.id}`);

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: "INFO",
          title: "Biological Age Updated",
          message: `Your biological age has been calculated: ${Math.round(result.biologicalAge)} years (${result.ageDifference > 0 ? '+' : ''}${Math.round(result.ageDifference)} years vs chronological age)`,
          category: "BIOMARKER",
          actionUrl: "/dashboard",
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "BIOLOGICAL_AGE_CALCULATED",
          entity: "health_score",
          entityId: healthScore.id,
          details: {
            targetUserId,
            biologicalAge: result.biologicalAge,
            chronologicalAge,
            ageDifference: result.ageDifference,
            confidence: result.confidence,
            biomarkersUsed: result.biomarkersUsed,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      biologicalAge: result,
      healthScore: healthScore ? {
        id: healthScore.id,
        overall: healthScore.overall,
        biologicalAge: healthScore.biologicalAge,
        chronologicalAge: healthScore.chronologicalAge,
        calculatedAt: healthScore.calculatedAt,
      } : null,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[Biological Age] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to calculate category scores from biomarker results
function calculateCategoryScores(
  results: Array<{ biomarkerId: string; status: string }>
): Array<{ category: string; score: number; optimal: number; normal: number; outOfRange: number }> {
  // Group by category (we'll use a simplified mapping)
  const categoryMap: Record<string, { optimal: number; normal: number; outOfRange: number }> = {};

  const biomarkerToCategory: Record<string, string> = {
    // Heart
    total_cholesterol: "HEART",
    ldl_cholesterol: "HEART",
    hdl_cholesterol: "HEART",
    triglycerides: "HEART",
    crp: "HEART",
    homocysteine: "HEART",
    // Metabolic
    glucose: "METABOLIC",
    hba1c: "METABOLIC",
    insulin: "METABOLIC",
    // Liver
    alt: "LIVER",
    ast: "LIVER",
    ggt: "LIVER",
    albumin: "LIVER",
    bilirubin: "LIVER",
    alp: "LIVER",
    // Kidney
    creatinine: "KIDNEY",
    egfr: "KIDNEY",
    bun: "KIDNEY",
    uric_acid: "KIDNEY",
    // Thyroid
    tsh: "THYROID",
    free_t4: "THYROID",
    free_t3: "THYROID",
    // Blood
    hemoglobin: "BLOOD",
    rbc: "BLOOD",
    wbc: "BLOOD",
    platelets: "BLOOD",
    mcv: "BLOOD",
    rdw: "BLOOD",
    hematocrit: "BLOOD",
    // Vitamins
    vitamin_d: "VITAMINS",
    vitamin_b12: "VITAMINS",
    folate: "VITAMINS",
    ferritin: "VITAMINS",
    iron: "VITAMINS",
    // Hormones
    testosterone_total: "HORMONES",
    estradiol: "HORMONES",
    cortisol: "HORMONES",
    dhea_s: "HORMONES",
  };

  for (const result of results) {
    const category = biomarkerToCategory[result.biomarkerId] || "OTHER";
    if (!categoryMap[category]) {
      categoryMap[category] = { optimal: 0, normal: 0, outOfRange: 0 };
    }

    const status = result.status.toUpperCase();
    if (status === "OPTIMAL") {
      categoryMap[category].optimal++;
    } else if (status === "NORMAL") {
      categoryMap[category].normal++;
    } else {
      categoryMap[category].outOfRange++;
    }
  }

  return Object.entries(categoryMap).map(([category, counts]) => {
    const total = counts.optimal + counts.normal + counts.outOfRange;
    const score = total > 0
      ? Math.round((counts.optimal * 100 + counts.normal * 75 + counts.outOfRange * 40) / total)
      : 50;
    return {
      category,
      score,
      ...counts,
    };
  });
}
