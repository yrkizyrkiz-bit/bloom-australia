import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HOLISTIC_HEALTH_ANALYSIS_TYPE,
  generateHolisticHealthReport,
  loadHolisticHealthReportContext,
  normalizeHolisticHealthReport,
} from "@/lib/holistic-health-report";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

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

    const context = await loadHolisticHealthReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cachedReport = await prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      },
    });

    const canGenerate =
      context.biomarkerCount > 0 &&
      (!cachedReport || cachedReport.biomarkerHash !== context.biomarkerHash);

    const report = normalizeHolisticHealthReport(
      cachedReport?.analysisData as Record<string, unknown> | null,
      cachedReport ? context : undefined
    );

    return NextResponse.json({
      report,
      cached: Boolean(cachedReport),
      canGenerate,
      requiresNewBloodTest: Boolean(cachedReport && !canGenerate),
      biomarkerCount: context.biomarkerCount,
      overallHealthScore: context.healthScores.overall,
      dataDate: context.dataDate,
      resultsStale: context.resultsStale,
      generatedAt: cachedReport?.updatedAt?.toISOString() || null,
      programs: context.programs,
    });
  } catch (error) {
    console.error("[holistic-health-report] GET", error);
    return NextResponse.json({ error: "Failed to load holistic health report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await loadHolisticHealthReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!context.biomarkerHash || context.biomarkerCount === 0) {
      return NextResponse.json(
        { error: "No biomarker results found", requiresBiomarkers: true },
        { status: 400 }
      );
    }

    const existingReport = await prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      },
    });

    if (existingReport && existingReport.biomarkerHash === context.biomarkerHash) {
      return NextResponse.json(
        {
          report: normalizeHolisticHealthReport(
            existingReport.analysisData as Record<string, unknown>,
            context
          ),
          cached: true,
          blocked: true,
          reason:
            "A holistic report already exists for your latest blood test. Upload new results to generate another.",
          dataDate: context.dataDate,
          resultsStale: context.resultsStale,
        },
        { status: 409 }
      );
    }

    const { report, usedFallback } = await generateHolisticHealthReport(context);
    const analysisData = JSON.parse(JSON.stringify(report));
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    await prisma.aIAnalysisCache.upsert({
      where: {
        userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      },
      update: {
        analysisData,
        biomarkerHash: context.biomarkerHash,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
        analysisData,
        biomarkerHash: context.biomarkerHash,
        expiresAt,
      },
    });

    const riskLevel =
      report.overallRisk === "high"
        ? "high"
        : report.overallRisk === "elevated"
          ? "elevated"
          : report.overallRisk === "moderate"
            ? "moderate"
            : "low";

    await prisma.aIAnalysisHistory.create({
      data: {
        userId,
        analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE,
        analysisData,
        overallScore: report.overallHealthScore,
        riskLevel,
        biomarkerCount: context.biomarkerCount,
      },
    });

    return NextResponse.json(
      {
        report,
        cached: false,
        usedFallback,
        dataDate: context.dataDate,
        resultsStale: context.resultsStale,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[holistic-health-report] POST", error);
    return NextResponse.json({ error: "Failed to generate holistic health report" }, { status: 500 });
  }
}
