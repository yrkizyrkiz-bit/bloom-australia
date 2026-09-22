import { prisma } from "@/lib/prisma";
import { overlayGoalWithActivePlan } from "@/lib/weight-management/apply-weight-plan";
import { startOfWeekMonday } from "@/lib/weight-management/score-ring-week";
import { summariseMedicationForInsight } from "./dose-insight";
import {
  daysOnProgramInWindow,
  programActivityWindowStart,
  resolveProgramCommencement,
} from "./program-activity-window";

export async function buildProgramContext(userId: string, memberProgramId: string) {
  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
    include: {
      prescription: {
        select: { medicationName: true, dosage: true, frequency: true, startDate: true },
      },
      user: { select: { firstName: true, gender: true, journeyStatus: true } },
    },
  });

  const [goal, preferences, membership, activePlan] = await Promise.all([
    prisma.weightGoal.findFirst({
      where: { userId, status: { in: ["IN_PROGRESS", "ACHIEVED"] } },
      orderBy: { createdAt: "desc" },
      select: {
        startDate: true,
        startWeight: true,
        weeklyTargetLoss: true,
        status: true,
        targetWeight: true,
        targetDate: true,
      },
    }),
    prisma.weightManagementPreferences.findUnique({
      where: { userId },
      select: { ringPlanActivatedAt: true },
    }),
    prisma.memberSubscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PAST_DUE"] } },
      orderBy: { activatedAt: "desc" },
      select: { activatedAt: true, createdAt: true },
    }),
    prisma.weightManagementPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { version: "desc" },
      select: { startWeight: true, targetWeight: true, targetDate: true, weeklyTargetLoss: true },
    }),
  ]);

  const commencement = resolveProgramCommencement({
    programStartedAt: program?.startedAt,
    goalStartedAt: goal?.startDate,
    ringPlanActivatedAt: preferences?.ringPlanActivatedAt,
    membershipStartedAt: membership?.activatedAt ?? membership?.createdAt,
  });

  const windowStart = programActivityWindowStart({
    programStartedAt: program?.startedAt,
    goalStartedAt: goal?.startDate,
    ringPlanActivatedAt: preferences?.ringPlanActivatedAt,
    membershipStartedAt: membership?.activatedAt ?? membership?.createdAt,
  });

  const weekStart = startOfWeekMonday();
  const [weights, meals, exercises, checkIns, treatment, sideEffects] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, measuredAt: { gte: commencement ?? windowStart } },
      orderBy: { measuredAt: "asc" },
    }),
    prisma.mealLog.findMany({
      where: { userId, loggedAt: { gte: windowStart } },
    }),
    prisma.exerciseLog.findMany({
      where: { userId, loggedAt: { gte: windowStart } },
    }),
    prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { checkedInAt: "desc" },
      take: 1,
    }),
    prisma.treatment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { doses: { orderBy: { scheduledAt: "asc" } } },
    }),
    prisma.sideEffectReport.findMany({
      where: { userId, createdAt: { gte: windowStart } },
    }),
  ]);

  const tasksDone = await prisma.programTask.count({
    where: {
      memberProgramId,
      status: "DONE",
      completedAt: { gte: windowStart },
    },
  });
  const tasksTotal = await prisma.programTask.count({
    where: {
      memberProgramId,
      scheduledFor: { gte: windowStart },
    },
  });

  const planned = goal ? overlayGoalWithActivePlan(goal, activePlan) : null;
  const latestWeight = weights[weights.length - 1]?.weight ?? null;
  const startWeightKg = planned?.startWeight ?? weights[0]?.weight ?? null;
  const weightsThisWeek = weights.filter((log) => log.measuredAt >= weekStart);
  const weightChangeFromStartKg =
    startWeightKg != null && latestWeight != null
      ? Math.round((latestWeight - startWeightKg) * 10) / 10
      : null;
  const weightChangeThisWeekKg =
    weightsThisWeek.length >= 2
      ? Math.round(
          (weightsThisWeek[weightsThisWeek.length - 1].weight - weightsThisWeek[0].weight) * 10
        ) / 10
      : null;
  const weightChange = weightChangeFromStartKg;

  const medication = summariseMedicationForInsight({
    medicationName: treatment?.medicationName || program?.prescription?.medicationName,
    dosage: treatment?.dosage || program?.prescription?.dosage,
    frequency: treatment?.frequency || program?.prescription?.frequency,
    startDate: treatment?.startDate || program?.prescription?.startDate,
    doses: treatment?.doses || [],
  });

  const daysOnProgram = daysOnProgramInWindow(commencement);

  return {
    memberName: program?.user.firstName || "Member",
    journeyStatus: program?.user.journeyStatus || "LEAD",
    programActive: Boolean(program?.isActive),
    programStarted: Boolean(
      program?.startedAt && program.startedAt.getTime() <= Date.now()
    ),
    programStartedAt: commencement?.toISOString() || null,
    daysOnProgram,
    planTier: program?.planTier || "CORE",
    phase: program?.phase || "INDUCTION",
    weeklyTargetLossKg: planned?.weeklyTargetLoss ?? goal?.weeklyTargetLoss ?? null,
    startWeightKg,
    currentWeightKg: latestWeight,
    weightChangeFromStartKg,
    weightChangeThisWeekKg,
    weightLogsThisWeek: weightsThisWeek.length,
    medication: medication.name,
    medicationNote: medication.coachNote,
    doseFrequency: medication.frequency,
    doseStatus: medication.status,
    firstDoseDate: medication.firstDoseDate,
    nextDoseDate: medication.nextDoseDate,
    doseAdherencePct: medication.adherencePct,
    weightLogs: weights.length,
    weightChangeKg: weightChange != null ? Math.round(weightChange * 10) / 10 : null,
    mealLogs: meals.length,
    exerciseSessions: exercises.length,
    exerciseMinutes: exercises.reduce((s, e) => s + e.durationMinutes, 0),
    lastCheckInFeeling: checkIns[0]?.overallFeeling,
    sideEffectReports: sideEffects.length,
    taskAdherencePct:
      tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : null,
  };
}

export function contextHash(ctx: Record<string, unknown>): string {
  return JSON.stringify(ctx);
}
