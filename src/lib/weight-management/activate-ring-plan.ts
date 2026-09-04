import { prisma } from "@/lib/prisma";
import { applyWeightManagementPlan } from "@/lib/weight-management/apply-weight-plan";

/** Stamp rings live if the doctor already set a plan, or snapshot an existing goal. Used on program activation as a fallback. */
export async function ensureRingPlanActivated(userId: string) {
  const [activePlan, prefs, goal] = await Promise.all([
    prisma.weightManagementPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { version: "desc" },
    }),
    prisma.weightManagementPreferences.findUnique({ where: { userId } }),
    prisma.weightGoal.findFirst({ where: { userId, status: "IN_PROGRESS" } }),
  ]);

  if (activePlan) {
    if (!prefs?.ringPlanActivatedAt) {
      await prisma.weightManagementPreferences.upsert({
        where: { userId },
        create: {
          userId,
          dailyCalorieGoal: activePlan.dailyCalorieGoal ?? undefined,
          dailyExerciseMin: activePlan.dailyExerciseMin ?? undefined,
          ringPlanActivatedAt: new Date(),
        },
        update: {
          dailyCalorieGoal: prefs?.dailyCalorieGoal ?? activePlan.dailyCalorieGoal ?? undefined,
          dailyExerciseMin: prefs?.dailyExerciseMin ?? activePlan.dailyExerciseMin ?? undefined,
          ringPlanActivatedAt: new Date(),
        },
      });
    }
    return { activated: true, source: "existing_plan" as const, planId: activePlan.id };
  }

  if (!goal && prefs?.dailyCalorieGoal == null) {
    return { activated: false, source: "none" as const, planId: null };
  }

  const plan = await applyWeightManagementPlan({
    userId,
    startWeight: goal?.startWeight ?? goal?.currentWeight ?? null,
    weightKg: goal?.currentWeight ?? goal?.startWeight ?? null,
    targetWeight: goal?.targetWeight ?? null,
    targetDate: goal?.targetDate ?? null,
    weeklyTargetLoss: goal?.weeklyTargetLoss ?? 0.5,
    dailyCalorieGoal: prefs?.dailyCalorieGoal ?? null,
    dailyExerciseMin: prefs?.dailyExerciseMin ?? 30,
  });

  return { activated: true, source: "goal_snapshot" as const, planId: plan.id };
}
