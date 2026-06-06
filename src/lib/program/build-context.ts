import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";

export async function buildProgramContext(userId: string, memberProgramId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [program, weights, meals, exercises, checkIns, doses, sideEffects] =
    await Promise.all([
      prisma.memberProgram.findUnique({
        where: { id: memberProgramId },
        include: {
          prescription: { select: { medicationName: true, dosage: true } },
          user: { select: { firstName: true, gender: true } },
        },
      }),
      prisma.weightLog.findMany({
        where: { userId, measuredAt: { gte: weekAgo } },
        orderBy: { measuredAt: "asc" },
      }),
      prisma.mealLog.findMany({
        where: { userId, loggedAt: { gte: weekAgo } },
      }),
      prisma.exerciseLog.findMany({
        where: { userId, loggedAt: { gte: weekAgo } },
      }),
      prisma.weeklyCheckIn.findMany({
        where: { userId },
        orderBy: { checkedInAt: "desc" },
        take: 1,
      }),
      prisma.medicationDose.findMany({
        where: {
          treatment: { userId },
          scheduledAt: { gte: weekAgo },
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.sideEffectReport.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
    ]);

  const tasksDone = await prisma.programTask.count({
    where: {
      memberProgramId,
      status: "DONE",
      completedAt: { gte: weekAgo },
    },
  });
  const tasksTotal = await prisma.programTask.count({
    where: {
      memberProgramId,
      scheduledFor: { gte: weekAgo },
    },
  });

  const weightChange =
    weights.length >= 2 ? weights[weights.length - 1].weight - weights[0].weight : null;

  const dosesTaken = doses.filter((d) => d.takenAt).length;
  const dosesScheduled = doses.length;

  return {
    memberName: program?.user.firstName || "Member",
    planTier: program?.planTier || "CORE",
    phase: program?.phase || "INDUCTION",
    medication: program?.prescription?.medicationName,
    weightLogs: weights.length,
    weightChangeKg: weightChange != null ? Math.round(weightChange * 10) / 10 : null,
    mealLogs: meals.length,
    exerciseSessions: exercises.length,
    exerciseMinutes: exercises.reduce((s, e) => s + e.durationMinutes, 0),
    lastCheckInFeeling: checkIns[0]?.overallFeeling,
    doseAdherencePct:
      dosesScheduled > 0 ? Math.round((dosesTaken / dosesScheduled) * 100) : null,
    sideEffectReports: sideEffects.length,
    taskAdherencePct:
      tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : null,
  };
}

export function contextHash(ctx: Record<string, unknown>): string {
  return JSON.stringify(ctx);
}
