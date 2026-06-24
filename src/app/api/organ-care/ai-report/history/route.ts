import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORGAN_CARE_AI_ANALYSIS_TYPE } from "@/lib/organ-care-ai-report";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.aIAnalysisHistory.findMany({
      where: {
        userId: session.user.id,
        analysisType: ORGAN_CARE_AI_ANALYSIS_TYPE,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        analysisData: true,
        overallScore: true,
        riskLevel: true,
        biomarkerCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      history: history.map((item) => ({
        id: item.id,
        overallScore: item.overallScore,
        riskLevel: item.riskLevel,
        biomarkerCount: item.biomarkerCount,
        createdAt: item.createdAt.toISOString(),
        report: item.analysisData,
      })),
    });
  } catch (error) {
    console.error("[organ-care/ai-report/history] GET", error);
    return NextResponse.json({ error: "Failed to fetch report history" }, { status: 500 });
  }
}
