import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HOLISTIC_HEALTH_ANALYSIS_TYPE,
  isHolisticGenerationError,
  isHolisticGenerationPending,
} from "@/lib/holistic-health-report";
import { sanitizeHolisticHealthReport } from "@/lib/holistic-health-report-types";
import { generateHolisticAskAnswerWithClaude } from "@/lib/holistic-report-ask-claude";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      question?: string;
      report?: Record<string, unknown>;
    };

    const userId = body.userId || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question || question.length > 400) {
      return NextResponse.json({ error: "A valid question is required" }, { status: 400 });
    }

    let report = body.report ? sanitizeHolisticHealthReport(body.report) : null;

    if (!report || report.aiProvider !== "claude") {
      const cached = await prisma.aIAnalysisCache.findUnique({
        where: {
          userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
        },
      });

      const cachedData = cached?.analysisData;
      if (isHolisticGenerationPending(cachedData) || isHolisticGenerationError(cachedData)) {
        return NextResponse.json(
          { error: "Your report is not ready to ask about yet." },
          { status: 409 }
        );
      }

      report = sanitizeHolisticHealthReport(cachedData as Record<string, unknown> | null);
    }

    if (!report || report.aiProvider !== "claude") {
      return NextResponse.json(
        { error: "No Claude health report found for this member." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    const answer = await generateHolisticAskAnswerWithClaude({
      question,
      userName: user?.firstName || "Member",
      report,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[holistic-health-report/ask] POST", error);
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }
}

