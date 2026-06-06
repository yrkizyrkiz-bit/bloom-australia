import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";
import type { ProgramTaskType } from "@prisma/client";

export async function completeProgramTaskForToday(
  userId: string,
  taskType: ProgramTaskType
) {
  const program = await prisma.memberProgram.findUnique({
    where: { userId },
  });
  if (!program) return;

  const todayStart = startOfDayUTC(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  await prisma.programTask.updateMany({
    where: {
      memberProgramId: program.id,
      taskType,
      scheduledFor: { gte: todayStart, lt: todayEnd },
      status: { in: ["PENDING", "OVERDUE"] },
    },
    data: { status: "DONE", completedAt: new Date() },
  });
}

/** Mark meal task done after at least one meal logged today. */
export async function completeMealTaskIfLogged(userId: string) {
  const todayStart = startOfDayUTC(new Date());
  const count = await prisma.mealLog.count({
    where: { userId, loggedAt: { gte: todayStart } },
  });
  if (count >= 1) {
    await completeProgramTaskForToday(userId, "MEAL_LOG");
  }
}

export async function completeExerciseTaskIfLogged(userId: string) {
  const todayStart = startOfDayUTC(new Date());
  const count = await prisma.exerciseLog.count({
    where: { userId, loggedAt: { gte: todayStart } },
  });
  if (count >= 1) {
    await completeProgramTaskForToday(userId, "EXERCISE");
  }
}
