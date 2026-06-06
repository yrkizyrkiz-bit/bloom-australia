import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extendProgramTasks } from "@/lib/program/extend-tasks";
import { sendProgramRemindersForUser } from "@/lib/program/reminders";

/** Daily program maintenance: extend tasks, mark overdue, send reminders. */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await prisma.memberProgram.findMany({
      where: { isActive: true },
      select: { id: true, userId: true },
    });

    let extended = 0;
    let remindersSent = 0;

    for (const program of programs) {
      await extendProgramTasks(program.id);
      extended++;

      const user = await prisma.user.findFirst({
        where: {
          id: program.userId,
          journeyStatus: {
            in: [
              "ACTIVE",
              "ONBOARDING_COMPLETE",
              "DELIVERED",
              "SHIPPED",
              "SCRIPT_WRITTEN",
            ],
          },
        },
      });

      if (user) {
        const { sent } = await sendProgramRemindersForUser(program.userId, program.id);
        remindersSent += sent;

        const { evaluateProgramPhase } = await import("@/lib/program/phase-engine");
        await evaluateProgramPhase(program.userId);

        const { checkWeightPlateau } = await import("@/lib/program/plateau");
        await checkWeightPlateau(program.userId);

        const { ensureWMProgramMember } = await import("@/lib/wm/ensure-program-member");
        await ensureWMProgramMember(program.userId);
      }
    }

    return NextResponse.json({
      success: true,
      programsProcessed: programs.length,
      extended,
      remindersSent,
    });
  } catch (error) {
    console.error("[cron/program-daily]", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
