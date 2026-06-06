import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";
import { ensureMemberProgram } from "./start-program";
import { evaluateBiomarkerFlags } from "./biomarker-rules";
import type { WeeklyInsightPayload } from "./weekly-insight";

const TASK_LINKS: Record<string, string> = {
  WEIGH_IN: "/dashboard/weight-management/track",
  MEAL_LOG: "/dashboard/weight-management/meals",
  EXERCISE: "/dashboard/weight-management/exercise",
  CHECK_IN: "/dashboard/weight-management/check-in",
  DOSE: "/dashboard/weight-management/treatment",
  SIDE_EFFECT_CHECK: "/dashboard/weight-management/treatment",
  BIOMARKER_REVIEW: "/dashboard/biomarkers",
};

const TASK_LABELS: Record<string, string> = {
  WEIGH_IN: "Log weight",
  MEAL_LOG: "Log meals",
  EXERCISE: "Log exercise",
  CHECK_IN: "Weekly check-in",
  DOSE: "Medication dose",
  SIDE_EFFECT_CHECK: "Side effect check-in",
  BIOMARKER_REVIEW: "Review biomarkers",
};

export async function getMemberProgramState(userId: string) {
  let program = await prisma.memberProgram.findUnique({
    where: { userId },
    include: {
      prescription: {
        select: {
          id: true,
          medicationName: true,
          dosage: true,
          frequency: true,
          scriptStatus: true,
        },
      },
    },
  });

  if (!program) {
    const rx = await prisma.prescription.findFirst({
      where: {
        patientId: userId,
        category: "WEIGHT_MANAGEMENT",
        status: "ACTIVE",
        scriptStatus: { in: ["SCRIPT_WRITTEN", "SCRIPT_SENT_TO_PHARMACY", "PHARMACY_PENDING", "DISPENSING", "SHIPPED", "DELIVERED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (rx) {
      program = await ensureMemberProgram(userId, rx.id);
      program = await prisma.memberProgram.findUnique({
        where: { userId },
        include: {
          prescription: {
            select: {
              id: true,
              medicationName: true,
              dosage: true,
              frequency: true,
              scriptStatus: true,
            },
          },
        },
      });
    }
  }

  if (!program) {
    return null;
  }

  const todayStart = startOfDayUTC(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const tasks = await prisma.programTask.findMany({
    where: {
      memberProgramId: program.id,
      scheduledFor: { gte: todayStart, lt: todayEnd },
    },
    orderBy: { taskType: "asc" },
  });

  const treatment = program.prescriptionId
    ? await prisma.treatment.findFirst({
        where: { userId, prescriptionId: program.prescriptionId },
        include: {
          doses: {
            where: {
              OR: [
                { takenAt: null, skipped: false, scheduledAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
              ],
            },
            orderBy: { scheduledAt: "asc" },
            take: 3,
          },
        },
      })
    : null;

  const nextDose = treatment?.doses.find((d) => !d.takenAt && !d.skipped) || null;

  const openSideEffects = await prisma.sideEffectReport.findMany({
    where: {
      userId,
      status: { in: ["REPORTED", "MITIGATING", "ESCALATED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const programAge = Date.now() - new Date(program.startedAt).getTime();
  const currentWeek = Math.floor(programAge / weekMs);

  const completedToday = tasks.filter((t) => t.status === "DONE").length;
  const adherenceScore =
    tasks.length > 0 ? Math.round((completedToday / tasks.length) * 100) : null;

  let biomarkerFlags: Awaited<ReturnType<typeof evaluateBiomarkerFlags>>["flags"] = [];
  let biomarkerSummary: string | null = null;
  if (program.planTier === "PRECISION") {
    const bio = await evaluateBiomarkerFlags(userId);
    biomarkerFlags = bio.flags;
    biomarkerSummary = bio.summary;
  }

  const insightRow = await prisma.programWeekSummary.findUnique({
    where: {
      memberProgramId_programWeek: {
        memberProgramId: program.id,
        programWeek: currentWeek,
      },
    },
  });
  const weeklyInsight: WeeklyInsightPayload | null = insightRow
    ? {
        summary: insightRow.summary || "",
        bullets: (insightRow.insights as WeeklyInsightPayload)?.bullets || [],
        focusArea: insightRow.focusArea || "",
        encouragement: (insightRow.insights as WeeklyInsightPayload)?.encouragement || "",
      }
    : null;

  return {
    program: {
      id: program.id,
      phase: program.phase,
      currentWeek,
      playbookId: program.playbookId,
      planTier: program.planTier,
      medicationName: program.prescription?.medicationName,
      dosage: program.prescription?.dosage,
      startedAt: program.startedAt.toISOString(),
    },
    weeklyInsight,
    biomarkerFlags,
    biomarkerSummary,
    tasks: tasks.map((t) => ({
      id: t.id,
      taskType: t.taskType,
      label: TASK_LABELS[t.taskType] || t.taskType,
      status: t.status,
      href: TASK_LINKS[t.taskType] || "/dashboard/weight-management",
      metadata: t.metadata,
      completedAt: t.completedAt?.toISOString() || null,
    })),
    nextDose: nextDose
      ? {
          id: nextDose.id,
          scheduledAt: nextDose.scheduledAt.toISOString(),
          takenAt: nextDose.takenAt?.toISOString() || null,
          skipped: nextDose.skipped,
          sideEffects: nextDose.sideEffects,
        }
      : null,
    openSideEffects: openSideEffects.map((r) => ({
      id: r.id,
      symptoms: r.symptoms,
      severity: r.severity,
      status: r.status,
      escalated: r.escalated,
      mitigationTips: r.mitigationTips,
      createdAt: r.createdAt.toISOString(),
    })),
    adherenceScore,
    completedToday,
    totalToday: tasks.length,
  };
}
