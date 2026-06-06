import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";
import { getPlaybook } from "./playbooks";
import type { ProgramTaskType } from "@prisma/client";

/** Ensure tasks exist for the next N days; mark yesterday's pending as OVERDUE. */
export async function extendProgramTasks(memberProgramId: string) {
  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
  });
  if (!program || !program.isActive) return;

  const playbook = getPlaybook(program.playbookId);
  const today = startOfDayUTC(new Date());
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  await prisma.programTask.updateMany({
    where: {
      memberProgramId,
      status: "PENDING",
      scheduledFor: { lt: today },
    },
    data: { status: "OVERDUE" },
  });

  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 7);

  const futureCount = await prisma.programTask.count({
    where: {
      memberProgramId,
      scheduledFor: { gte: today, lt: horizon },
    },
  });

  if (futureCount >= 14) return;

  const treatment = program.prescriptionId
    ? await prisma.treatment.findFirst({
        where: { userId: program.userId, prescriptionId: program.prescriptionId },
        include: {
          doses: {
            where: { scheduledAt: { gte: today } },
            orderBy: { scheduledAt: "asc" },
            take: 8,
          },
        },
      })
    : null;

  const tasks: Array<{
    memberProgramId: string;
    taskType: ProgramTaskType;
    scheduledFor: Date;
    metadata?: object;
  }> = [];

  for (let day = 0; day < 7; day++) {
    const scheduledFor = new Date(today);
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + day);

    const dayOfWeek = scheduledFor.getUTCDay();

    for (const taskType of playbook.dailyTasks) {
      tasks.push({ memberProgramId, taskType, scheduledFor });
    }

    if (day < playbook.sideEffectCheckDays) {
      tasks.push({
        memberProgramId,
        taskType: "SIDE_EFFECT_CHECK",
        scheduledFor,
      });
    }

    if (dayOfWeek === 0) {
      for (const taskType of playbook.sundayTasks) {
        tasks.push({ memberProgramId, taskType, scheduledFor });
      }
    }

    const doseForDay = treatment?.doses.find(
      (d) => startOfDayUTC(d.scheduledAt).getTime() === scheduledFor.getTime()
    );
    if (doseForDay) {
      tasks.push({
        memberProgramId,
        taskType: "DOSE",
        scheduledFor,
        metadata: { doseId: doseForDay.id },
      });
    }
  }

  for (const task of tasks) {
    const exists = await prisma.programTask.findFirst({
      where: {
        memberProgramId,
        taskType: task.taskType,
        scheduledFor: task.scheduledFor,
      },
    });
    if (!exists) {
      await prisma.programTask.create({ data: task });
    }
  }
}
