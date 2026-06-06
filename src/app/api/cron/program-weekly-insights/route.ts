import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyInsight } from "@/lib/program/weekly-insight";
import { evaluateBiomarkerFlags, applyBiomarkerEscalations } from "@/lib/program/biomarker-rules";

/** Weekly Claude insights + Precision biomarker rule pass. */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await prisma.memberProgram.findMany({
      where: { isActive: true },
    });

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let generated = 0;
    let biomarkerEscalations = 0;

    for (const program of programs) {
      const programWeek = Math.floor(
        (Date.now() - new Date(program.startedAt).getTime()) / weekMs
      );

      await generateWeeklyInsight(program.userId, program.id, programWeek);

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
