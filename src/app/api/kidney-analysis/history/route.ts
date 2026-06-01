import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get analysis history, most recent first
    const history = await prisma.aIAnalysisHistory.findMany({
      where: {
        userId: session.user.id,
        analysisType: "kidney"
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Last 10 analyses
      select: {
        id: true,
        analysisData: true,
        overallScore: true,
        riskLevel: true,
        biomarkerCount: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      history: history.map(h => ({
        id: h.id,
        overallScore: h.overallScore,
        riskLevel: h.riskLevel,
        biomarkerCount: h.biomarkerCount,
        createdAt: h.createdAt.toISOString(),
        // Include full analysis data
        ...h.analysisData as object
      }))
    });

  } catch (error) {
    console.error("Kidney analysis history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis history" },
      { status: 500 }
    );
  }
}
