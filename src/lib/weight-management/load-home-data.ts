import { prisma } from "@/lib/prisma";
import { resolveWeightManagementClinicalStatus } from "@/lib/programs/quizzes/weight-management-clinical-quiz";

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

const STAGE_DESCRIPTIONS: Record<string, { stage: string; description: string }> = {
  LEAD: { stage: "pre-consultation", description: "Starting your health journey" },
  ONBOARDING_PENDING: { stage: "onboarding", description: "Complete your onboarding steps" },
  ONBOARDING_COMPLETE: { stage: "onboarding", description: "Onboarding complete" },
  ACTIVE: { stage: "active", description: "Program active" },
  APPROVED: { stage: "approved", description: "Doctor approved: preparing your program" },
};

function stageFor(journeyStatus: string) {
  return (
    STAGE_DESCRIPTIONS[journeyStatus] || {
      stage: "unknown",
      description: "Status unknown",
    }
  );
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

async function loadProgressSummary(userId: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [weightLogs, exerciseLogs, checkIns, activeGoal] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, measuredAt: { gte: startDate } },
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
  ]);

  const currentWeight = weightLogs[weightLogs.length - 1]?.weight || null;
  const startWeight = weightLogs[0]?.weight || currentWeight;
  const weightChange =
    currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0;

  const weightsByWeek: Record<string, number[]> = {};
  weightLogs.forEach((log) => {
    const date = new Date(log.measuredAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    if (!weightsByWeek[weekKey]) weightsByWeek[weekKey] = [];
    weightsByWeek[weekKey].push(log.weight);
  });

  const weeklyAverages = Object.entries(weightsByWeek).map(([week, weights]) => ({
    week,
    avgWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
  }));

  const totalExerciseMinutes = exerciseLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const totalCaloriesBurned = exerciseLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);
  const exerciseDays = new Set(
    exerciseLogs.map((l) => new Date(l.loggedAt).toISOString().split("T")[0])
  ).size;

  const checkInTrends = checkIns
    .map((c) => ({
      week: c.weekNumber,
      feeling: c.overallFeeling,
      energy: c.energyLevel,
    }))
    .reverse();

  let goalProgress = null;
  if (activeGoal && currentWeight) {
    const totalToLose = activeGoal.startWeight - activeGoal.targetWeight;
    const actualLost = activeGoal.startWeight - currentWeight;
    goalProgress = {
      targetWeight: activeGoal.targetWeight,
      percentComplete: Math.min(
        100,
        Math.max(0, Math.round((actualLost / totalToLose) * 100))
      ),
      remainingToLose: Math.round(Math.max(0, currentWeight - activeGoal.targetWeight) * 10) / 10,
      actualLost: Math.round(actualLost * 10) / 10,
    };
  }

  const weightLogDays = new Set(
    weightLogs.map((l) => new Date(l.measuredAt).toISOString().split("T")[0])
  ).size;
  const consistencyScore = Math.round(
    (weightLogDays / days) * 40 + (exerciseDays / days) * 40 + (checkIns.length >= 4 ? 20 : checkIns.length * 5)
  );

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

export async function loadWeightManagementHome(userId: string) {
  const [
    user,
    prescription,
    latestBooking,
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
    prisma.consultationBooking.findFirst({
      where: { userId, status: "BOOKING_CONFIRMED" },
      orderBy: { scheduledAt: "desc" },
      select: { scheduledAt: true, doctorName: true },
    }),
    prisma.weightManagementIntake.findFirst({
      where: { userId },
      select: { scheduledAt: true, quizData: true },
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
  }

  const scheduled = latestBooking?.scheduledAt || intake?.scheduledAt || null;

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
      consultation: scheduled
        ? {
            date: new Date(scheduled).toISOString(),
            time: new Date(scheduled).toLocaleTimeString("en-AU", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            status: "BOOKING_CONFIRMED",
            doctorName: latestBooking?.doctorName || null,
          }
        : null,
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
  };
}
