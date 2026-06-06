import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const limit = parseInt(searchParams.get("limit") || "10");

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkIns = await prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { weekNumber: "desc" },
      take: limit,
    });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const currentWeek = Math.ceil(((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7);

    const lastCheckIn = checkIns[0];
    const lastCheckInDate = lastCheckIn ? new Date(lastCheckIn.checkedInAt) : null;
    const daysSinceLastCheckIn = lastCheckInDate ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    const checkInNeeded = daysSinceLastCheckIn >= 7;

    let currentStreak = 0;
    const checkInWeeks = new Set(checkIns.map(c => c.weekNumber));
    for (let week = currentWeek; week > 0; week--) {
      if (checkInWeeks.has(week) || (week === currentWeek && !checkInNeeded)) {
        currentStreak++;
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    const sortedCheckIns = [...checkIns].sort((a, b) => a.weekNumber - b.weekNumber);
    for (let i = 0; i < sortedCheckIns.length; i++) {
      if (i === 0 || sortedCheckIns[i].weekNumber === sortedCheckIns[i - 1].weekNumber + 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return NextResponse.json({
      checkIns,
      currentWeek,
      checkInNeeded,
      daysSinceLastCheckIn: daysSinceLastCheckIn === Infinity ? null : daysSinceLastCheckIn,
      streaks: { current: currentStreak, longest: longestStreak },
      averages: {
        feeling: checkIns.length > 0 ? Math.round((checkIns.reduce((sum, c) => sum + c.overallFeeling, 0) / checkIns.length) * 10) / 10 : 0,
        energy: checkIns.length > 0 ? Math.round((checkIns.reduce((sum, c) => sum + c.energyLevel, 0) / checkIns.length) * 10) / 10 : 0,
        sleep: checkIns.length > 0 ? Math.round((checkIns.reduce((sum, c) => sum + c.sleepQuality, 0) / checkIns.length) * 10) / 10 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { overallFeeling, energyLevel, sleepQuality, stressLevel, focusAreas, achievements, challenges, weeklyGoals, notes, userId } = body;

    if (!overallFeeling || !energyLevel || !sleepQuality || !stressLevel) {
      return NextResponse.json({ error: "All rating fields are required" }, { status: 400 });
    }

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7);

    const existingCheckIn = await prisma.weeklyCheckIn.findFirst({
      where: { userId: targetUserId, weekNumber },
    });

    if (existingCheckIn) {
      const updatedCheckIn = await prisma.weeklyCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          overallFeeling,
          energyLevel,
          sleepQuality,
          stressLevel,
          focusAreas: focusAreas || [],
          achievements: achievements || [],
          challenges: challenges || null,
          weeklyGoals: weeklyGoals ? JSON.stringify(weeklyGoals) : "[]",
          notes: notes || null,
          checkedInAt: new Date(),
        },
      });
      try {
        const { completeProgramTaskForToday } = await import("@/lib/program/complete-task");
        await completeProgramTaskForToday(targetUserId, "CHECK_IN");
      } catch {
        /* optional */
      }
      return NextResponse.json(updatedCheckIn);
    }

    const checkIn = await prisma.weeklyCheckIn.create({
      data: {
        userId: targetUserId,
        weekNumber,
        overallFeeling,
        energyLevel,
        sleepQuality,
        stressLevel,
        focusAreas: focusAreas || [],
        achievements: achievements || [],
        challenges: challenges || null,
        weeklyGoals: weeklyGoals ? JSON.stringify(weeklyGoals) : "[]",
        notes: notes || null,
      },
    });

    try {
      const { completeProgramTaskForToday } = await import("@/lib/program/complete-task");
      await completeProgramTaskForToday(targetUserId, "CHECK_IN");
    } catch {
      /* optional */
    }

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 });
  }
}
