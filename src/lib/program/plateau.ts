import { prisma } from "@/lib/prisma";
import { isWeightManagementUser } from "@/lib/wm/is-wm-user";

/** Detect weight plateau and create care + notification (WM only). */
export async function checkWeightPlateau(userId: string) {
  if (!(await isWeightManagementUser(userId))) return null;

  const program = await prisma.memberProgram.findUnique({ where: { userId } });
  if (!program?.isActive) return null;

  const logs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
    take: 4,
  });

  if (logs.length < 4) return null;

  const newest = logs[0].weight;
  const oldest = logs[3].weight;
  const change = Math.abs(newest - oldest);

  if (change >= 0.3) return null;

  const recent = await prisma.careCommunication.findFirst({
    where: {
      userId,
      type: "WEIGHT_PLATEAU",
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, assignedCarePartnerId: true },
  });

  await prisma.careCommunication.create({
    data: {
      userId,
      type: "WEIGHT_PLATEAU",
      priority: "NORMAL",
      subject: `Weight plateau review: ${user?.firstName || "Member"} ${user?.lastName || ""}`.trim(),
      notes: `No meaningful weight change across last 4 logs (${oldest}kg → ${newest}kg). Consider care partner check-in and program focus adjustment.`,
      status: "PENDING",
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedTo: user?.assignedCarePartnerId || undefined,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "INFO",
      category: "REMINDER",
      title: "Your weight trend has levelled off",
      message:
        "Plateaus are normal on a weight-loss journey. Your care team can help adjust your focus for the week ahead.",
      actionUrl: "/dashboard/weight-management",
    },
  });

  return { plateau: true, change };
}
