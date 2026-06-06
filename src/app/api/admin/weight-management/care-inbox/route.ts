import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { carePartnerPatientFilter } from "@/lib/care-partner-assignment";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const userWhere =
      role === "CARE_PARTNER"
        ? carePartnerPatientFilter(session.user.id)
        : {};

    const programs = await prisma.memberProgram.findMany({
      where: { isActive: true, user: userWhere },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            journeyStatus: true,
          },
        },
        prescription: {
          select: { medicationName: true, dosage: true },
        },
      },
      take: 100,
    });

    const enriched = await Promise.all(
      programs.map(async (p) => {
        const userId = p.userId;
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

        const [tasksToday, tasksDone, openSideEffects, lastInsight, pendingCare] =
          await Promise.all([
            prisma.programTask.count({
              where: {
                memberProgramId: p.id,
                scheduledFor: { gte: todayStart, lt: todayEnd },
              },
            }),
            prisma.programTask.count({
              where: {
                memberProgramId: p.id,
                scheduledFor: { gte: todayStart, lt: todayEnd },
                status: "DONE",
              },
            }),
            prisma.sideEffectReport.count({
              where: {
                userId,
                status: { in: ["REPORTED", "MITIGATING", "ESCALATED"] },
              },
            }),
            prisma.programWeekSummary.findFirst({
              where: { memberProgramId: p.id },
              orderBy: { programWeek: "desc" },
            }),
            prisma.careCommunication.count({
              where: {
                userId,
                status: "PENDING",
                type: {
                  in: [
                    "SIDE_EFFECT_REVIEW",
                    "BIOMARKER_REVIEW",
                    "WEIGHT_PLATEAU",
                  ],
                },
              },
            }),
          ]);

        const adherenceToday =
          tasksToday > 0 ? Math.round((tasksDone / tasksToday) * 100) : null;

        return {
          programId: p.id,
          userId,
          name: `${p.user.firstName} ${p.user.lastName}`.trim(),
          email: p.user.email,
          journeyStatus: p.user.journeyStatus,
          phase: p.phase,
          planTier: p.planTier,
          medication: p.prescription?.medicationName,
          adherenceToday,
          openSideEffects,
          pendingCareTasks: pendingCare,
          weeklyFocus: lastInsight?.focusArea ?? null,
          needsAttention:
            openSideEffects > 0 ||
            pendingCare > 0 ||
            (adherenceToday != null && adherenceToday < 50),
        };
      })
    );

    let list = enriched;
    if (filter === "attention") {
      list = list.filter((x) => x.needsAttention);
    }

    list.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return (b.openSideEffects || 0) - (a.openSideEffects || 0);
    });

    return NextResponse.json({ success: true, members: list });
  } catch (error) {
    console.error("[care-inbox]", error);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}
