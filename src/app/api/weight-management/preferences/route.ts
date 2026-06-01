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

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let preferences = await prisma.weightManagementPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.weightManagementPreferences.create({
        data: { userId },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    const targetUserId = session.user.role?.toUpperCase() === "ADMIN" && userId ? userId : session.user.id;

    const preferences = await prisma.weightManagementPreferences.upsert({
      where: { userId: targetUserId },
      update: updateData,
      create: { userId: targetUserId, ...updateData },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

// Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, completed, ...data } = body;

    const updateData: Record<string, unknown> = { ...data };

    if (step !== undefined) {
      updateData.onboardingStep = step;
    }

    if (completed) {
      updateData.hasCompletedOnboarding = true;
    }

    const preferences = await prisma.weightManagementPreferences.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: { userId: session.user.id, ...updateData },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 });
  }
}
