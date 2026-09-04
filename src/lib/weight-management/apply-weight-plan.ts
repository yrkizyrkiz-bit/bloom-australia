import { prisma } from "@/lib/prisma";
import type { ActivityBandId } from "@/lib/weight-management/calorie-calculator";
import {
  defaultPlanTargetDate,
  parsePlanDate,
} from "@/lib/weight-management/quiz-goal-defaults";

export function overlayGoalWithActivePlan<
  T extends {
    status: string;
    startWeight: number;
    targetWeight: number;
    targetDate: Date | string;
    weeklyTargetLoss: number;
  },
>(
  goal: T,
  plan: {
    startWeight?: number | null;
    targetWeight?: number | null;
    targetDate?: Date | string | null;
    weeklyTargetLoss?: number | null;
  } | null
): T {
  if (!plan || goal.status !== "IN_PROGRESS") return goal;
  return {
    ...goal,
    startWeight: plan.startWeight ?? goal.startWeight,
    targetWeight: plan.targetWeight ?? goal.targetWeight,
    targetDate: plan.targetDate ?? goal.targetDate,
    weeklyTargetLoss: plan.weeklyTargetLoss ?? goal.weeklyTargetLoss,
  };
}

export type WeightPlanInput = {
  userId: string;
  createdById?: string | null;
  age?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  waistCm?: number | null;
  bodyFatPercent?: number | null;
  activityBand?: ActivityBandId | string | null;
  activityFactor?: number | null;
  bmr?: number | null;
  tdee?: number | null;
  formula?: string | null;
  weeklyTargetLoss?: number | null;
  dailyCalorieGoal?: number | null;
  dailyExerciseMin?: number | null;
  startWeight?: number | null;
  targetWeight?: number | null;
  targetDate?: string | Date | null;
  notes?: string | null;
};

function requirePlanDelegate() {
  const delegate = (prisma as { weightManagementPlan?: { findFirst?: unknown } }).weightManagementPlan;
  if (!delegate?.findFirst) {
    throw new Error(
      "Weight plan store is not loaded. Restart the app after prisma generate — the program does not need to be active to set a plan."
    );
  }
}

export async function applyWeightManagementPlan(input: WeightPlanInput) {
  requirePlanDelegate();
  const latest = await prisma.weightManagementPlan.findFirst({
    where: { userId: input.userId },
    orderBy: { version: "desc" },
  });

  await prisma.weightManagementPlan.updateMany({
    where: { userId: input.userId, status: "ACTIVE" },
    data: { status: "ARCHIVED", supersededAt: new Date() },
  });

  const targetDate =
    parsePlanDate(input.targetDate) ??
    parsePlanDate(defaultPlanTargetDate()) ??
    new Date();

  const plan = await prisma.weightManagementPlan.create({
    data: {
      userId: input.userId,
      version: (latest?.version ?? 0) + 1,
      status: "ACTIVE",
      age: input.age ?? null,
      sex: input.sex ?? null,
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg ?? null,
      waistCm: input.waistCm ?? null,
      bodyFatPercent: input.bodyFatPercent ?? null,
      activityBand: input.activityBand ?? null,
      activityFactor: input.activityFactor ?? null,
      bmr: input.bmr ?? null,
      tdee: input.tdee ?? null,
      formula: input.formula ?? null,
      weeklyTargetLoss: input.weeklyTargetLoss ?? 0.5,
      dailyCalorieGoal: input.dailyCalorieGoal ?? null,
      dailyExerciseMin: input.dailyExerciseMin ?? null,
      startWeight: input.startWeight ?? input.weightKg ?? null,
      targetWeight: input.targetWeight ?? null,
      targetDate,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
    },
  });

  await prisma.weightManagementPreferences.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      dailyCalorieGoal: input.dailyCalorieGoal ?? undefined,
      dailyExerciseMin: input.dailyExerciseMin ?? undefined,
      ringPlanActivatedAt: new Date(),
    },
    update: {
      dailyCalorieGoal: input.dailyCalorieGoal ?? undefined,
      dailyExerciseMin: input.dailyExerciseMin ?? undefined,
      ringPlanActivatedAt: new Date(),
    },
  });

  const startWeight = input.startWeight ?? input.weightKg ?? null;
  const targetWeight = input.targetWeight ?? null;
  if (startWeight && targetWeight && targetWeight < startWeight) {
    const existingGoal =
      (await prisma.weightGoal.findFirst({
        where: { userId: input.userId, status: "IN_PROGRESS" },
      })) ??
      (await prisma.weightGoal.findFirst({
        where: { userId: input.userId, status: { not: "ACHIEVED" } },
        orderBy: { createdAt: "desc" },
      }));

    if (existingGoal) {
      await prisma.weightGoal.update({
        where: { id: existingGoal.id },
        data: {
          startWeight,
          targetWeight,
          currentWeight: input.weightKg ?? existingGoal.currentWeight,
          weeklyTargetLoss: input.weeklyTargetLoss ?? existingGoal.weeklyTargetLoss,
          targetDate,
          status: "IN_PROGRESS",
          completedAt: null,
        },
      });
    } else {
      await prisma.weightGoal.create({
        data: {
          userId: input.userId,
          startWeight,
          targetWeight,
          currentWeight: input.weightKg ?? startWeight,
          targetDate,
          weeklyTargetLoss: input.weeklyTargetLoss ?? 0.5,
          status: "IN_PROGRESS",
        },
      });
    }
  }

  return plan;
}

export async function listWeightManagementPlans(userId: string) {
  return prisma.weightManagementPlan.findMany({
    where: { userId },
    orderBy: { version: "asc" },
  });
}
