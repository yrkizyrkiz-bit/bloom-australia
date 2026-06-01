import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get historical analyses
    const analyses = await prisma.aIAnalysisCache.findMany({
      where: {
        userId,
        analysisType: "hormone"
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // Transform for the frontend
    const history = analyses.map(a => ({
      id: a.id,
      createdAt: a.createdAt,
      analysis: a.analysisData,
      isExpired: a.expiresAt < new Date()
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching hormone analysis history:", error);
    return NextResponse.json(
      { error: "Failed to fetch hormone analysis history" },
      { status: 500 }
    );
  }
}
