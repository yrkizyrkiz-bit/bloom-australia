import { prisma } from "@/lib/prisma";
import type { ProgramPhase } from "@prisma/client";
import { isWeightManagementUser } from "@/lib/wm/is-wm-user";

/**
 * Advance WM program phase from adherence + time on program.
 * Only runs for weight-management MemberProgram rows.
 */
export async function evaluateProgramPhase(userId: string) {
  if (!(await isWeightManagementUser(userId))) return null;

  const program = await prisma.memberProgram.findUnique({
    where: { userId },
  });
  if (!program?.isActive) return null;

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.floor(
    (Date.now() - new Date(program.startedAt).getTime()) / weekMs
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [tasksDone, tasksTotal, openSideEffects] = await Promise.all([
    prisma.programTask.count({
      where: {
        memberProgramId: program.id,
        status: "DONE",
        completedAt: { gte: weekAgo },
      },
    }),
    prisma.programTask.count({
      where: {
        memberProgramId: program.id,
        scheduledFor: { gte: weekAgo },
      },
    }),
    prisma.sideEffectReport.count({
      where: {
        userId,
        status: { in: ["REPORTED", "MITIGATING", "ESCALATED"] },
        severity: { in: ["MODERATE", "SEVERE"] },
      },
    }),
  ]);

  const adherence =
    tasksTotal > 0 ? tasksDone / tasksTotal : 0;

  let nextPhase: ProgramPhase = program.phase;

  if (weeks < 2) {
    nextPhase = "INDUCTION";
  } else if (weeks < 8) {
    nextPhase = "TITRATION";
  } else {
    nextPhase = "MAINTENANCE";
  }

  if (openSideEffects >= 2 && program.phase === "INDUCTION") {
    nextPhase = "INDUCTION";
  }

  if (nextPhase !== program.phase || program.currentWeek !== weeks) {
    await prisma.memberProgram.update({
      where: { id: program.id },
      data: {
        phase: nextPhase,
        currentWeek: weeks,
        adherenceScore: Math.round(adherence * 100),
      },
    });
  }

  return { phase: nextPhase, weeks, adherence: Math.round(adherence * 100) };
}
