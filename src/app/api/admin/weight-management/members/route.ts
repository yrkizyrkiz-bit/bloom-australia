import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wmUsers = await prisma.user.findMany({
      where: {
        OR: [
          { subscriptionTier: { contains: "weight", mode: "insensitive" } },
          { memberProgram: { isNot: null } },
          { weightManagementIntakes: { some: {} } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        journeyStatus: true,
        memberProgram: {
          select: {
            phase: true,
            planTier: true,
            adherenceScore: true,
          },
        },
        weightLogs: { orderBy: { measuredAt: "desc" }, take: 2 },
        weeklyCheckIns: { orderBy: { checkedInAt: "desc" }, take: 1 },
        weightGoals: { where: { status: "IN_PROGRESS" }, take: 1 },
      },
      take: 200,
      orderBy: { updatedAt: "desc" },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const checkInsThisWeek = await prisma.weeklyCheckIn.count({
      where: { checkedInAt: { gte: weekAgo } },
    });

    const members = wmUsers.map((u) => {
      const current = u.weightLogs[0]?.weight ?? null;
      const prev = u.weightLogs[1]?.weight ?? null;
      const weightChange =
        current != null && prev != null
          ? Math.round((current - prev) * 10) / 10
          : null;
      const lastLog = u.weightLogs[0]?.measuredAt;
      const daysSinceActivity = lastLog
        ? Math.floor((Date.now() - new Date(lastLog).getTime()) / 86400000)
        : null;

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        journeyStatus: u.journeyStatus,
        currentWeight: current,
        weightChange,
        lastLogDate: lastLog?.toISOString() ?? null,
        lastCheckIn: u.weeklyCheckIns[0]?.checkedInAt?.toISOString() ?? null,
        hasActiveGoal: u.weightGoals.length > 0,
        targetWeight: u.weightGoals[0]?.targetWeight ?? null,
        onTrack: u.weightGoals[0]?.currentWeight
          ? u.weightGoals[0].currentWeight <= u.weightGoals[0].targetWeight
          : null,
        daysSinceActivity,
        needsAttention: daysSinceActivity != null && daysSinceActivity > 7,
        programPhase: u.memberProgram?.phase ?? null,
        planTier: u.memberProgram?.planTier ?? null,
        adherenceScore: u.memberProgram?.adherenceScore ?? null,
      };
    });

    const withLoss = members.filter((m) => m.weightChange != null && m.weightChange < 0);
    const avgWeightLoss =
      withLoss.length > 0
        ? Math.round(
            (withLoss.reduce((s, m) => s + (m.weightChange || 0), 0) / withLoss.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      members,
      stats: {
        totalMembers: members.length,
        activeGoals: members.filter((m) => m.hasActiveGoal).length,
        avgWeightLoss: Math.abs(avgWeightLoss),
        checkInsThisWeek,
        needingAttention: members.filter((m) => m.needsAttention).length,
      },
    });
  } catch (error) {
    console.error("[admin wm members]", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
