import { prisma } from "@/lib/prisma";

/** True only for weight-management portal members — does not affect other programs. */
export async function isWeightManagementUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      memberProgram: { select: { id: true } },
      weightManagementIntakes: { take: 1, select: { id: true } },
      prescriptions: {
        where: { category: "WEIGHT_MANAGEMENT", status: "ACTIVE" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!user) return false;
  if (user.memberProgram) return true;
  if (user.prescriptions.length > 0) return true;
  if (user.weightManagementIntakes.length > 0) return true;

  const tier = (user.subscriptionTier || "").toLowerCase();
  return tier.includes("weight");
}
