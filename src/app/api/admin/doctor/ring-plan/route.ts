import { NextRequest, NextResponse } from "next/server";
import { requireDoctorOrAdmin } from "@/lib/auth/require-clinical-staff";
import { applyWeightManagementPlan, listWeightManagementPlans } from "@/lib/weight-management/apply-weight-plan";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireDoctorOrAdmin();
  if (auth.error) return auth.error;

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const [plans, preferences, activeGoal, latestWeight, latestExercise] = await Promise.all([
      listWeightManagementPlans(userId),
      prisma.weightManagementPreferences.findUnique({ where: { userId } }),
      prisma.weightGoal.findFirst({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.weightLog.findFirst({ where: { userId }, orderBy: { measuredAt: "desc" } }),
      prisma.exerciseLog.findMany({
        where: { userId, loggedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        select: { loggedAt: true },
      }),
    ]);

    const sessionDays = new Set(latestExercise.map((log) => log.loggedAt.toISOString().slice(0, 10)));

    return NextResponse.json({
      plans,
      activePlan: plans.find((plan) => plan.status === "ACTIVE") || plans[plans.length - 1] || null,
      preferences,
      activeGoal,
      latestWeightKg: latestWeight?.weight ?? null,
      latestWaistCm: latestWeight?.waistCircumference ?? null,
      exerciseSessionsLast14Days: sessionDays.size,
    });
  } catch (error) {
    console.error("[ring-plan GET]", error);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireDoctorOrAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const plan = await applyWeightManagementPlan({
      userId,
      createdById: auth.userId,
      age: body.age ?? null,
      sex: body.sex ?? null,
      heightCm: body.heightCm ?? null,
      weightKg: body.weightKg ?? null,
      waistCm: body.waistCm ?? null,
      bodyFatPercent: body.bodyFatPercent ?? null,
      activityBand: body.activityBand ?? null,
      activityFactor: body.activityFactor ?? null,
      bmr: body.bmr ?? null,
      tdee: body.tdee ?? null,
      formula: body.formula ?? null,
      weeklyTargetLoss: body.weeklyTargetLoss ?? null,
      dailyCalorieGoal: body.dailyCalorieGoal ?? null,
      dailyExerciseMin: body.dailyExerciseMin ?? null,
      startWeight: body.startWeight ?? body.weightKg ?? null,
      targetWeight: body.targetWeight ?? null,
      targetDate: body.targetDate ?? null,
      notes: body.notes ?? null,
    });

    const plans = await listWeightManagementPlans(userId);
    return NextResponse.json({ plan, plans }, { status: 201 });
  } catch (error) {
    console.error("[ring-plan POST]", error);
    const message =
      error instanceof Error && error.message.includes("prisma generate")
        ? error.message
        : "Could not save plan. The program does not need to be active — try again, or restart the app if this persists.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
