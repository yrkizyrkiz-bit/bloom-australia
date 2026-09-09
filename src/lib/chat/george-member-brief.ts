import { prisma } from "@/lib/prisma";
import { summariseMedicationForInsight } from "@/lib/program/dose-insight";
import {
  daysOnProgramInWindow,
  programActivityWindowStart,
  resolveProgramCommencement,
} from "@/lib/program/program-activity-window";

function auDate(d: Date | string | null | undefined): string {
  if (!d) return "n/a";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function auDateTime(d: Date | string | null | undefined): string {
  if (!d) return "n/a";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Rich member snapshot for George so he does not ask what the portal already knows.
 */
export async function buildGeorgeMemberBrief(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      journeyStatus: true,
      gender: true,
    },
  });

  const program = await prisma.memberProgram.findUnique({
    where: { userId },
    include: {
      prescription: {
        select: {
          medicationName: true,
          dosage: true,
          frequency: true,
          startDate: true,
          scriptStatus: true,
        },
      },
    },
  });

  const [goal, preferences, subscription, latestWeight] = await Promise.all([
    prisma.weightGoal.findFirst({
      where: { userId, status: { in: ["IN_PROGRESS", "ACHIEVED"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.weightManagementPreferences.findUnique({
      where: { userId },
      select: {
        ringPlanActivatedAt: true,
        dailyCalorieGoal: true,
        dailyExerciseMin: true,
      },
    }),
    prisma.memberSubscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] } },
      orderBy: [{ activatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        product: { select: { name: true, slug: true } },
        billingPrice: { select: { label: true, billingInterval: true, amountCents: true } },
      },
    }),
    prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { measuredAt: "desc" },
      select: { weight: true, measuredAt: true },
    }),
  ]);

  const commencement = resolveProgramCommencement({
    programStartedAt: program?.startedAt,
    goalStartedAt: goal?.startDate,
    ringPlanActivatedAt: preferences?.ringPlanActivatedAt,
    membershipStartedAt: subscription?.activatedAt ?? subscription?.createdAt,
  });

  const windowStart = programActivityWindowStart({
    programStartedAt: program?.startedAt,
    goalStartedAt: goal?.startDate,
    ringPlanActivatedAt: preferences?.ringPlanActivatedAt,
    membershipStartedAt: subscription?.activatedAt ?? subscription?.createdAt,
  });

  const since7d = new Date();
  since7d.setDate(since7d.getDate() - 7);
  const sinceToday = new Date();
  sinceToday.setHours(0, 0, 0, 0);

  const [mealsRecent, mealsToday, exercisesRecent, weightsRecent, sideEffects, treatment, checkIn] =
    await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, loggedAt: { gte: since7d } },
        orderBy: { loggedAt: "desc" },
        take: 12,
        select: {
          name: true,
          mealType: true,
          calories: true,
          loggedAt: true,
          description: true,
        },
      }),
      prisma.mealLog.findMany({
        where: { userId, loggedAt: { gte: sinceToday } },
        orderBy: { loggedAt: "asc" },
        select: { name: true, mealType: true, calories: true, loggedAt: true },
      }),
      prisma.exerciseLog.findMany({
        where: { userId, loggedAt: { gte: since7d } },
        orderBy: { loggedAt: "desc" },
        take: 8,
        select: {
          name: true,
          activityType: true,
          durationMinutes: true,
          caloriesBurned: true,
          loggedAt: true,
        },
      }),
      prisma.weightLog.findMany({
        where: { userId, measuredAt: { gte: windowStart } },
        orderBy: { measuredAt: "asc" },
        select: { weight: true, measuredAt: true },
      }),
      prisma.sideEffectReport.findMany({
        where: { userId, createdAt: { gte: since7d } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { symptoms: true, severity: true, status: true, createdAt: true },
      }),
      prisma.treatment.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { doses: { orderBy: { scheduledAt: "asc" } } },
      }),
      prisma.weeklyCheckIn.findFirst({
        where: { userId },
        orderBy: { checkedInAt: "desc" },
        select: {
          weekNumber: true,
          overallFeeling: true,
          checkedInAt: true,
          challenges: true,
        },
      }),
    ]);

  const medication = summariseMedicationForInsight({
    medicationName: treatment?.medicationName || program?.prescription?.medicationName,
    dosage: treatment?.dosage || program?.prescription?.dosage,
    frequency: treatment?.frequency || program?.prescription?.frequency,
    startDate: treatment?.startDate || program?.prescription?.startDate,
    doses: treatment?.doses || [],
  });

  const daysOnProgram = daysOnProgramInWindow(commencement);
  const currentWeight =
    latestWeight?.weight ?? goal?.currentWeight ?? null;
  const startWeight = goal?.startWeight ?? null;
  const targetWeight = goal?.targetWeight ?? null;
  const lostKg =
    startWeight != null && currentWeight != null
      ? Math.round((startWeight - currentWeight) * 10) / 10
      : null;

  const mealLines = mealsRecent.slice(0, 8).map((m) => {
    const cal = m.calories != null ? ` (${m.calories} kcal)` : "";
    return `- ${auDateTime(m.loggedAt)} · ${m.mealType.toLowerCase()}: ${m.name}${cal}`;
  });

  const todayMealLines = mealsToday.map((m) => {
    const cal = m.calories != null ? ` (${m.calories} kcal)` : "";
    return `- ${m.mealType.toLowerCase()}: ${m.name}${cal}`;
  });

  const exerciseLines = exercisesRecent.slice(0, 6).map((e) => {
    return `- ${auDateTime(e.loggedAt)} · ${e.name} (${e.durationMinutes} min)`;
  });

  const sideEffectLines = sideEffects.map((s) => {
    const symptoms = Array.isArray(s.symptoms) ? s.symptoms.join(", ") : String(s.symptoms);
    return `- ${auDate(s.createdAt)} · ${symptoms} (severity ${s.severity}, status ${s.status})`;
  });

  const subProduct =
    subscription?.product?.name ||
    subscription?.billingPrice?.label ||
    subscription?.product?.slug ||
    "n/a";
  const subInterval = subscription?.billingPrice?.billingInterval
    ? ` / ${subscription.billingPrice.billingInterval.toLowerCase()}`
    : "";

  const lines = [
    `MEMBER BRIEF (source of truth — use this; do not ask the member to restate it):`,
    `- Name: ${user?.firstName || "Member"}${user?.lastName ? ` ${user.lastName}` : ""}`,
    `- Journey status: ${user?.journeyStatus || "n/a"}`,
    program
      ? `- Program: ${program.planTier} · phase ${program.phase} · active=${program.isActive} · started ${auDate(program.startedAt)} · ~${daysOnProgram} day(s) on program`
      : `- Program: no active member program on file`,
    subscription
      ? `- Subscription: ${subscription.status} · ${subProduct}${subInterval} · period ends ${auDate(subscription.currentPeriodEnd)} · cancelAtPeriodEnd=${subscription.cancelAtPeriodEnd}`
      : `- Subscription: none on file`,
    goal
      ? `- Weight goal: start ${goal.startWeight} kg → target ${goal.targetWeight} kg (weekly target ~${goal.weeklyTargetLoss} kg/week)`
      : `- Weight goal: none on file`,
    currentWeight != null
      ? `- Latest weigh-in: ${currentWeight} kg on ${auDate(latestWeight?.measuredAt ?? null)}${
          lostKg != null ? ` · change from start ${lostKg > 0 ? "-" : "+"}${Math.abs(lostKg)} kg` : ""
        }`
      : `- Latest weigh-in: none`,
    preferences?.dailyCalorieGoal != null || preferences?.dailyExerciseMin != null
      ? `- Daily targets: ${preferences?.dailyCalorieGoal ?? "n/a"} kcal · ${preferences?.dailyExerciseMin ?? "n/a"} min movement`
      : `- Daily targets: not set`,
    `- Medication: ${medication.coachNote || "none on file"}`,
    `- Dose status: ${medication.status}${medication.nextDoseDate ? ` · next ${auDate(medication.nextDoseDate)}` : ""}`,
    `- Logging last 7 days: ${mealsRecent.length} meal(s), ${exercisesRecent.length} exercise session(s), ${weightsRecent.length} weigh-in(s)`,
    `- Meals logged today (${auDate(sinceToday)}): ${
      todayMealLines.length ? `\n${todayMealLines.join("\n")}` : "none yet"
    }`,
    `- Recent meals (newest first): ${
      mealLines.length ? `\n${mealLines.join("\n")}` : "none in last 7 days"
    }`,
    `- Recent movement: ${
      exerciseLines.length ? `\n${exerciseLines.join("\n")}` : "none in last 7 days"
    }`,
    `- Side effects logged (7d): ${
      sideEffectLines.length ? `\n${sideEffectLines.join("\n")}` : "none"
    }`,
    checkIn
      ? `- Last weekly check-in: week ${checkIn.weekNumber} on ${auDate(checkIn.checkedInAt)} · feeling ${checkIn.overallFeeling}/10${
          checkIn.challenges ? ` · notes: ${checkIn.challenges}` : ""
        }`
      : `- Last weekly check-in: none`,
  ];

  return lines.join("\n");
}
