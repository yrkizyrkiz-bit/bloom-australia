import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  profileFromDb,
  profilesAffectHeartAnalysis,
} from "@/lib/ascvd-inputs";

// GET - Fetch user's health profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healthProfile = await prisma.healthProfile.findUnique({
      where: { userId: session.user.id }
    });

    // Return existing profile or defaults
    return NextResponse.json({
      profile: healthProfile || {
        systolicBP: null,
        diastolicBP: null,
        onBPMedication: false,
        bpMeasuredAt: null,
        smokingStatus: "NEVER",
        race: "OTHER",
        familyHistoryCVD: false,
        exerciseFrequency: "MODERATE"
      }
    });
  } catch (error) {
    console.error("Error fetching health profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch health profile" },
      { status: 500 }
    );
  }
}

// POST - Update user's health profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      systolicBP,
      diastolicBP,
      onBPMedication,
      smokingStatus,
      race,
      familyHistoryCVD,
      exerciseFrequency
    } = body;

    // Validate blood pressure values
    if (systolicBP !== undefined && systolicBP !== null) {
      if (systolicBP < 70 || systolicBP > 250) {
        return NextResponse.json(
          { error: "Systolic BP must be between 70 and 250 mmHg" },
          { status: 400 }
        );
      }
    }

    if (diastolicBP !== undefined && diastolicBP !== null) {
      if (diastolicBP < 40 || diastolicBP > 150) {
        return NextResponse.json(
          { error: "Diastolic BP must be between 40 and 150 mmHg" },
          { status: 400 }
        );
      }
    }

    const existingProfile = await prisma.healthProfile.findUnique({
      where: { userId: session.user.id },
    });
    const previousProfile = profileFromDb(existingProfile);

    // Upsert health profile
    const healthProfile = await prisma.healthProfile.upsert({
      where: { userId: session.user.id },
      update: {
        systolicBP: systolicBP !== undefined ? systolicBP : undefined,
        diastolicBP: diastolicBP !== undefined ? diastolicBP : undefined,
        onBPMedication: onBPMedication !== undefined ? onBPMedication : undefined,
        bpMeasuredAt: (systolicBP || diastolicBP) ? new Date() : undefined,
        smokingStatus: smokingStatus || undefined,
        race: race || undefined,
        familyHistoryCVD: familyHistoryCVD !== undefined ? familyHistoryCVD : undefined,
        exerciseFrequency: exerciseFrequency || undefined
      },
      create: {
        userId: session.user.id,
        systolicBP: systolicBP || null,
        diastolicBP: diastolicBP || null,
        onBPMedication: onBPMedication || false,
        bpMeasuredAt: (systolicBP || diastolicBP) ? new Date() : null,
        smokingStatus: smokingStatus || "NEVER",
        race: race || "OTHER",
        familyHistoryCVD: familyHistoryCVD || false,
        exerciseFrequency: exerciseFrequency || "MODERATE"
      }
    });

    const nextProfile = profileFromDb(healthProfile);
    if (profilesAffectHeartAnalysis(previousProfile, nextProfile)) {
      try {
        await prisma.aIAnalysisCache.deleteMany({
          where: {
            userId: session.user.id,
            analysisType: "heart",
          },
        });
      } catch {
        // Ignore cache clear errors
      }
    }

    return NextResponse.json({
      success: true,
      profile: healthProfile,
      message: "Health profile updated successfully. Heart analysis cache cleared."
    });
  } catch (error) {
    console.error("Error updating health profile:", error);
    return NextResponse.json(
      { error: "Failed to update health profile" },
      { status: 500 }
    );
  }
}
