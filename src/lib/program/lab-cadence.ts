import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";

/** Precision: schedule biomarker review task every ~90 days. */
export async function ensureLabCadenceTasks(memberProgramId: string, userId: string) {
  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
  });
  if (program?.planTier !== "PRECISION") return;

  const lastLab = await prisma.biomarkerResult.findFirst({
    where: { userId },
    orderBy: { testedAt: "desc" },
  });

  const due = new Date();
  if (lastLab) {
    due.setTime(lastLab.testedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  } else {
    due.setDate(due.getDate() + 30);
  }

  const scheduledFor = startOfDayUTC(due);
  const exists = await prisma.programTask.findFirst({
    where: {
      memberProgramId,
      taskType: "BIOMARKER_REVIEW",
      scheduledFor,
    },
  });

  if (!exists) {
    await prisma.programTask.create({
      data: {
        memberProgramId,
        taskType: "BIOMARKER_REVIEW",
        scheduledFor,
        metadata: { reason: "lab_cadence_90d" },
      },
    });
  }
}
