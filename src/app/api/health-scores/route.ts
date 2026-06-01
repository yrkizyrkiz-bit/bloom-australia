import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/health-scores - Get user's health scores
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const latest = searchParams.get("latest") !== "false";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Non-admins can only view their own scores
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (latest) {
      const score = await prisma.healthScore.findFirst({
        where: { userId },
        orderBy: { calculatedAt: "desc" },
      });
      return NextResponse.json({ score });
    }

    const scores = await prisma.healthScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Error fetching health scores:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/health-scores/calculate - Calculate health score for a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = body.userId || session.user.id;

    // Non-admins can only calculate their own scores
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, dateOfBirth: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get latest biomarker results
    const results = await prisma.biomarkerResult.findMany({
      where: { userId },
      include: {
        biomarker: true,
      },
      orderBy: { testedAt: "desc" },
    });

    // Get unique latest results per biomarker
    const latestResults = new Map();
    for (const result of results) {
      if (!latestResults.has(result.biomarkerId)) {
        latestResults.set(result.biomarkerId, result);
      }
    }

    // Calculate category scores
    const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number; count: number }> = {};

    for (const result of latestResults.values()) {
      const category = result.biomarker.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { score: 0, optimal: 0, normal: 0, outOfRange: 0, count: 0 };
      }

      let score = 0;
      switch (result.status) {
        case "OPTIMAL":
          score = 100;
          categoryScores[category].optimal++;
          break;
        case "NORMAL":
          score = 75;
          categoryScores[category].normal++;
          break;
        case "OUT_OF_RANGE":
          score = 40;
          categoryScores[category].outOfRange++;
          break;
        case "CRITICAL":
          score = 20;
          categoryScores[category].outOfRange++;
          break;
      }

      categoryScores[category].score += score;
      categoryScores[category].count++;
    }

    // Calculate overall score
    let totalScore = 0;
    let totalWeight = 0;
    const categoryScoresArray = [];

    for (const [category, data] of Object.entries(categoryScores)) {
      const avgScore = data.count > 0 ? Math.round(data.score / data.count) : 0;
      categoryScoresArray.push({
        category,
        score: avgScore,
        optimal: data.optimal,
        normal: data.normal,
        outOfRange: data.outOfRange,
      });
      totalScore += avgScore * data.count;
      totalWeight += data.count;
    }

    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Calculate biological age (simplified formula)
    let biologicalAge = null;
    let chronologicalAge = null;

    if (user.dateOfBirth) {
      chronologicalAge = Math.floor(
        (Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      // Simple formula: biological age = chronological age adjusted by health score
      // Score of 100 = 5 years younger, Score of 0 = 10 years older
      const ageAdjustment = ((overallScore - 50) / 50) * 7.5;
      biologicalAge = Math.round(chronologicalAge - ageAdjustment);
    }

    // Save the health score
    const healthScore = await prisma.healthScore.create({
      data: {
        userId,
        overall: overallScore,
        biologicalAge,
        chronologicalAge,
        categoryScores: categoryScoresArray,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "HEALTH_SCORE_CALCULATED",
        entity: "health_score",
        entityId: healthScore.id,
        details: { overall: overallScore },
      },
    });

    return NextResponse.json({ healthScore }, { status: 201 });
  } catch (error) {
    console.error("Error calculating health score:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
