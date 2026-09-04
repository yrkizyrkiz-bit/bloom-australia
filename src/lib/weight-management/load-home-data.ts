import { prisma } from "@/lib/prisma";
import { STAGE_DESCRIPTIONS } from "@/lib/portal-context";
import { resolveWeightManagementClinicalStatus } from "@/lib/programs/quizzes/weight-management-clinical-quiz";
import { overlayGoalWithActivePlan } from "@/lib/weight-management/apply-weight-plan";
import {
  defaultPlanTargetDate,
  parsePlanDate,
  resolveQuizTargetWeightKg,
} from "@/lib/weight-management/quiz-goal-defaults";
import { scoreRingWeek, startOfWeekMonday, toDateKey } from "@/lib/weight-management/score-ring-week";
import { loadPortalConsultation } from "@/lib/program-journey/load-portal-consultation";

const APPROVED_STATUSES = [
  "APPROVED",
  "APPROVED_PENDING_TESTS",
  "TESTS_ORDERED",
  "AWAITING_TESTS",
  "RESULTS_RECEIVED",
  "FINAL_DOCTOR_REVIEW",
  "SCRIPT_WRITTEN",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "DELIVERED",
  "ONBOARDING_PENDING",
  "ONBOARDING_COMPLETE",
  "ACTIVE",
];

const TESTS_TRACKING_STATUSES = [
  "APPROVED_PENDING_TESTS",
  "TESTS_ORDERED",
  "AWAITING_TESTS",
  "RESULTS_RECEIVED",
  "FINAL_DOCTOR_REVIEW",
];

const STAGE_META: Record<string, { stage: string; description: string }> = {
  LEAD: { stage: "pre-consultation", description: STAGE_DESCRIPTIONS.LEAD },
  ONBOARDING_PENDING: { stage: "onboarding", description: STAGE_DESCRIPTIONS.ONBOARDING_PENDING },
  ONBOARDING_COMPLETE: { stage: "onboarding", description: STAGE_DESCRIPTIONS.ONBOARDING_COMPLETE },
  ACTIVE: { stage: "active", description: STAGE_DESCRIPTIONS.ACTIVE },
  APPROVED: { stage: "approved", description: STAGE_DESCRIPTIONS.APPROVED },
};

function stageFor(journeyStatus: string) {
  if (STAGE_META[journeyStatus]) return STAGE_META[journeyStatus];
  const description = STAGE_DESCRIPTIONS[journeyStatus] || "Status unknown";
  if (
    journeyStatus === "AWAITING_DOCTOR_CALL" ||
    journeyStatus === "CONSULT_COMPLETED" ||
    journeyStatus === "AWAITING_DOCTOR_DECISION"
  ) {
    return { stage: "consultation", description };
  }
  return { stage: "unknown", description };
}

async function loadCheckInSummary(userId: string) {
  const checkIns = await prisma.weeklyCheckIn.findMany({
    where: { userId },
    orderBy: { weekNumber: "desc" },
    take: 10,
  });

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const currentWeek = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7
  );

  const lastCheckIn = checkIns[0];
  const lastCheckInDate = lastCheckIn ? new Date(lastCheckIn.checkedInAt) : null;
  const daysSinceLastCheckIn = lastCheckInDate
    ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  const checkInNeeded = daysSinceLastCheckIn >= 7;

  let currentStreak = 0;
  const checkInWeeks = new Set(checkIns.map((c) => c.weekNumber));
  for (let week = currentWeek; week > 0; week--) {
    if (checkInWeeks.has(week) || (week === currentWeek && !checkInNeeded)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    checkInNeeded,
    streaks: { current: currentStreak },
  };
}

function weeklyAveragesFromLogs(logs: Array<{ measuredAt: Date; weight: number }>) {
  const weightsByWeek: Record<string, number[]> = {};
  logs.forEach((log) => {
    const date = new Date(log.measuredAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    if (!weightsByWeek[weekKey]) weightsByWeek[weekKey] = [];
    weightsByWeek[weekKey].push(log.weight);
  });
  return Object.entries(weightsByWeek).map(([week, weights]) => ({
    week,
    avgWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
  }));
}

function goalProgressFromQuiz(
  quizData: unknown,
  startedAt: Date | undefined,
  startWeight: number | null,
  currentWeight: number | null
) {
  const quiz =
    quizData && typeof quizData === "object" ? (quizData as Record<string, unknown>) : null;
  const start = startWeight ?? currentWeight;
  if (start == null) return null;
  const target = resolveQuizTargetWeightKg({
    storedTargetWeight: quiz?.targetWeight,
    currentWeight: start,
    weightLossGoal: typeof quiz?.weightLossGoal === "string" ? quiz.weightLossGoal : null,
  });
  if (target == null) return null;
  const begun = startedAt ?? new Date();
  const latest = currentWeight ?? start;
  const totalToLose = start - target;
  const actualLost = start - latest;
  return {
    startWeight: start,
    targetWeight: target,
    startDate: begun.toISOString(),
    targetDate: `${defaultPlanTargetDate(begun)}T00:00:00.000Z`,
    percentComplete:
      totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((actualLost / totalToLose) * 100))) : 0,
    remainingToLose: Math.round(Math.max(0, latest - target) * 10) / 10,
    actualLost: Math.round(actualLost * 10) / 10,
  };
}

async function loadProgressSummary(userId: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const journeyLookback = new Date();
  journeyLookback.setMonth(journeyLookback.getMonth() - 18);

  const [weightLogs, exerciseLogs, checkIns, activeGoal, activePlan] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, measuredAt: { gte: journeyLookback } },
      orderBy: { measuredAt: "asc" },
    }),
    prisma.exerciseLog.findMany({
      where: { userId, loggedAt: { gte: startDate } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { weekNumber: "desc" },
      take: 12,
    }),
    prisma.weightGoal.findFirst({
      where: { userId, status: "IN_PROGRESS" },
    }),
    prisma.weightManagementPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { version: "desc" },
      select: {
        startWeight: true,
        targetWeight: true,
        targetDate: true,
        weeklyTargetLoss: true,
      },
    }),
  ]);

  const goal = activeGoal ? overlayGoalWithActivePlan(activeGoal, activePlan) : null;
  const recentLogs = weightLogs.filter((log) => log.measuredAt >= startDate);
  const goalStart = parsePlanDate(goal?.startDate);
  const chartLogs =
    goalStart != null ? weightLogs.filter((log) => log.measuredAt >= goalStart) : recentLogs;

  const currentWeight = weightLogs[weightLogs.length - 1]?.weight || null;
  const startWeight = recentLogs[0]?.weight || currentWeight;
  const weightChange =
    currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0;

  const weeklyAverages = weeklyAveragesFromLogs(chartLogs);

  const weekStart = startOfWeekMonday();
  const elapsedWeekDays = Math.min(
    7,
    Math.max(1, Math.floor((Date.now() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  );
  const exerciseThisWeek = exerciseLogs.filter((log) => log.loggedAt >= weekStart);
  const weightsThisWeek = weightLogs.filter((log) => log.measuredAt >= weekStart);
  const totalCaloriesBurned = exerciseThisWeek.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);
  const exerciseDays = new Set(exerciseThisWeek.map((l) => toDateKey(l.loggedAt))).size;
  const weightLogDays = new Set(weightsThisWeek.map((l) => toDateKey(l.measuredAt))).size;
  const checkedInThisWeek = checkIns.some((c) => c.checkedInAt >= weekStart);
  const consistencyScore = Math.round(
    (weightLogDays / elapsedWeekDays) * 40 +
      (exerciseDays / elapsedWeekDays) * 40 +
      (checkedInThisWeek ? 20 : 0)
  );

  const totalExerciseMinutes = exerciseThisWeek.reduce((sum, l) => sum + l.durationMinutes, 0);

  const checkInTrends = checkIns
    .map((c) => ({
      week: c.weekNumber,
      feeling: c.overallFeeling,
      energy: c.energyLevel,
    }))
    .reverse();

  let goalProgress = null;
  if (goal) {
    const latest = currentWeight ?? goal.startWeight;
    const totalToLose = goal.startWeight - goal.targetWeight;
    const actualLost = goal.startWeight - latest;
    goalProgress = {
      startWeight: goal.startWeight,
      targetWeight: goal.targetWeight,
      startDate: new Date(goal.startDate).toISOString(),
      targetDate: new Date(goal.targetDate).toISOString(),
      percentComplete:
        totalToLose > 0
          ? Math.min(100, Math.max(0, Math.round((actualLost / totalToLose) * 100)))
          : 0,
      remainingToLose: Math.round(Math.max(0, latest - goal.targetWeight) * 10) / 10,
      actualLost: Math.round(actualLost * 10) / 10,
    };
  }

  return {
    summary: {
      currentWeight,
      startWeight,
      weightChange,
      totalExerciseMinutes,
      totalCaloriesBurned,
      exerciseDays,
      consistencyScore: Math.min(100, consistencyScore),
    },
    goalProgress,
    weightProgress: {
      logs: weightLogs.map((l) => ({ measuredAt: l.measuredAt.toISOString(), weight: l.weight })),
      weeklyAverages,
    },
    checkInTrends,
  };
}

/** Rings go live when the doctor sets a plan, even before journeyStatus is ACTIVE. */
export async function loadRingWeek(userId: string) {
  const [preferences, activePlan] = await Promise.all([
    prisma.weightManagementPreferences.findUnique({
      where: { userId },
      select: {
        dailyCalorieGoal: true,
        dailyExerciseMin: true,
        ringPlanActivatedAt: true,
      },
    }),
    prisma.weightManagementPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { version: "desc" },
    }),
  ]);

  if (!preferences?.ringPlanActivatedAt && !activePlan) return null;

  const weekStart = startOfWeekMonday();
  const [weights, meals, exercises, doses, activeGoal] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, measuredAt: { gte: weekStart } },
      select: { measuredAt: true },
    }),
    prisma.mealLog.findMany({
      where: { userId, loggedAt: { gte: weekStart } },
      select: { loggedAt: true, calories: true },
    }),
    prisma.exerciseLog.findMany({
      where: { userId, loggedAt: { gte: weekStart } },
      select: { loggedAt: true, durationMinutes: true, intensity: true },
    }),
    prisma.medicationDose.findMany({
      where: { treatment: { userId }, scheduledAt: { gte: weekStart } },
      select: { scheduledAt: true, takenAt: true },
    }),
    prisma.weightGoal.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      select: { weeklyTargetLoss: true },
    }),
  ]);

  return scoreRingWeek(
    { weights, meals, exercises, doses },
    {
      dailyCalorieGoal: preferences?.dailyCalorieGoal ?? activePlan?.dailyCalorieGoal ?? 1800,
      dailyExerciseMin: preferences?.dailyExerciseMin ?? activePlan?.dailyExerciseMin ?? 30,
      weeklyTargetLoss: activePlan?.weeklyTargetLoss ?? activeGoal?.weeklyTargetLoss ?? null,
    }
  );
}

export async function loadWeightManagementHome(userId: string) {
  const [
    user,
    prescription,
    intake,
    pendingTestsTasks,
    preferences,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        journeyStatus: true,
        subscriptionStatus: true,
        approvalStatus: true,
      },
    }),
    prisma.prescription.findFirst({
      where: { patientId: userId, category: "WEIGHT_MANAGEMENT", status: "ACTIVE" },
      select: { id: true, scriptStatus: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.weightManagementIntake.findFirst({
      where: { userId },
      select: { scheduledAt: true, quizData: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.careCommunication.findMany({
      where: { userId, type: "PATHOLOGY_REQUEST", status: { in: ["PENDING", "IN_PROGRESS"] } },
      select: { id: true, subject: true, status: true, dueDate: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.weightManagementPreferences.findUnique({ where: { userId } }),
  ]);

  if (!user) return null;

  const journeyStatus = user.journeyStatus || "LEAD";
  const stageInfo = stageFor(journeyStatus);
  const isApproved =
    APPROVED_STATUSES.includes(journeyStatus) ||
    user.approvalStatus === "APPROVED" ||
    user.approvalStatus === "APPROVED_WITH_TESTS";
  const hasTestsTracking =
    TESTS_TRACKING_STATUSES.includes(journeyStatus) ||
    user.approvalStatus === "APPROVED_WITH_TESTS" ||
    pendingTestsTasks.length > 0;
  const isActive = journeyStatus === "ACTIVE";

  const shouldShowOnboarding =
    journeyStatus === "ONBOARDING_PENDING" ||
    journeyStatus === "ONBOARDING_COMPLETE" ||
    journeyStatus === "ACTIVE";

  const showOnboarding =
    shouldShowOnboarding && !preferences?.hasCompletedOnboarding;

  let progress = null;
  let checkInStatus = null;

  if (isActive) {
    [progress, checkInStatus] = await Promise.all([
      loadProgressSummary(userId),
      loadCheckInSummary(userId),
    ]);
    if (progress && !progress.goalProgress) {
      progress = {
        ...progress,
        goalProgress: goalProgressFromQuiz(
          intake?.quizData,
          intake?.createdAt,
          progress.summary.startWeight,
          progress.summary.currentWeight
        ),
      };
    }
  }

  const ringWeek = await loadRingWeek(userId).catch((error) => {
    console.error("[ringWeek]", error);
    return null;
  });

  const scheduledConsultation = await loadPortalConsultation(userId, journeyStatus);

  return {
    journeyStatus: {
      journeyStatus,
      stage: stageInfo.stage,
      stageDescription: stageInfo.description,
      isApproved,
      approvalStatus: user.approvalStatus,
      hasPrescription: prescription !== null,
      isActive,
      pendingTests: false,
      hasTestsTracking,
      testsTrackingInfo: hasTestsTracking
        ? {
            message: "Blood tests are being tracked for your ongoing care",
            tasks: pendingTestsTasks.map((task) => ({
              id: task.id,
              subject: task.subject,
              status: task.status,
              dueDate: task.dueDate?.toISOString() || null,
            })),
            count: pendingTestsTasks.length,
          }
        : null,
      consultation: scheduledConsultation,
    },
    showOnboarding,
    clinicalAssessment: {
      status: resolveWeightManagementClinicalStatus(
        intake?.quizData && typeof intake.quizData === "object"
          ? (intake.quizData as Record<string, unknown>)
          : null
      ),
    },
    progress,
    checkInStatus,
    ringWeek,
  };
}
