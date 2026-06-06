import { prisma } from "@/lib/prisma";
import { resolvePlanTier } from "@/lib/membership-display";

export type ProgramPlanTier = "CORE" | "PRECISION";

export async function getUserPlanTier(userId: string): Promise<ProgramPlanTier> {
  const [user, intake] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    }),
    prisma.weightManagementIntake.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { selectedPlan: true },
    }),
  ]);

  const tier = resolvePlanTier({
    selectedPlan: intake?.selectedPlan,
    subscriptionTier: user?.subscriptionTier,
  });

  return tier === "PRECISION" ? "PRECISION" : "CORE";
}

export function getPlaybookId(tier: ProgramPlanTier): string {
  return tier === "PRECISION" ? "wm_precision_v1" : "wm_core_v1";
}
