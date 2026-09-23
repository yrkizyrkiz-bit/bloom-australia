import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyInsight } from "@/lib/program/weekly-insight";
import { notifyMember } from "@/lib/notifications/member-notify";
import { programCalendarWeek } from "@/lib/program/program-week";
import { evaluateBiomarkerFlags, applyBiomarkerEscalations } from "@/lib/program/biomarker-rules";
import { assertCronAuthorized } from "@/lib/security/cron-auth";

/** Weekly Claude insights + Precision biomarker rule pass. */
export async function GET(request: NextRequest) {
  try {
    const cronAuth = assertCronAuthorized(request);
    if (cronAuth) {
      return cronAuth;
    }

    const programs = await prisma.memberProgram.findMany({
      where: { isActive: true, user: { journeyStatus: "ACTIVE" } },
    });

    let generated = 0;
    let biomarkerEscalations = 0;

    for (const program of programs) {
      const programWeek = programCalendarWeek(program.startedAt);

      const insight = await generateWeeklyInsight(program.userId, program.id, programWeek);
      if (insight?.summary) {
        await notifyMember({
          userId: program.userId,
          intent: "WEEKLY_NOTE",
          title: "Your week with George",
          message: insight.summary.slice(0, 280),
          actionUrl: "/dashboard/weight-management",
          category: "SYSTEM",
          dedupeDays: 6,
        });
      }

      if (program.planTier === "PRECISION") {
        const { flags } = await evaluateBiomarkerFlags(program.userId);
        if (flags.length > 0) {
          await applyBiomarkerEscalations(program.userId, program.id, flags);
          biomarkerEscalations++;
        }
      }

      generated++;
    }

    return NextResponse.json({
      success: true,
      insightsGenerated: generated,
      biomarkerEscalations,
    });
  } catch (error) {
    console.error("[cron/program-weekly-insights]", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
