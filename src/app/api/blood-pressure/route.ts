import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch blood pressure history with statistics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params for pagination and date range
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const days = parseInt(url.searchParams.get("days") || "90");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch readings
    const readings = await prisma.bloodPressureReading.findMany({
      where: {
        userId: session.user.id,
        measuredAt: { gte: startDate }
      },
      orderBy: { measuredAt: "desc" },
      take: limit
    });

    // Calculate statistics
    if (readings.length === 0) {
      return NextResponse.json({
        readings: [],
        statistics: null,
        trends: null
      });
    }

    // Overall statistics
    const systolicValues = readings.map(r => r.systolicBP);
    const diastolicValues = readings.map(r => r.diastolicBP);
    const heartRateValues = readings.filter(r => r.heartRate).map(r => r.heartRate as number);

    const statistics = {
      count: readings.length,
      systolic: {
        average: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length),
        min: Math.min(...systolicValues),
        max: Math.max(...systolicValues),
        latest: systolicValues[0]
      },
      diastolic: {
        average: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length),
        min: Math.min(...diastolicValues),
        max: Math.max(...diastolicValues),
        latest: diastolicValues[0]
      },
      heartRate: heartRateValues.length > 0 ? {
        average: Math.round(heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length),
        min: Math.min(...heartRateValues),
        max: Math.max(...heartRateValues),
        latest: heartRateValues[0]
      } : null
    };

    // Calculate BP category distribution
    const categories = {
      normal: 0,      // <120/80
      elevated: 0,    // 120-129/<80
      stage1: 0,      // 130-139/80-89
      stage2: 0,      // ≥140/≥90
      crisis: 0       // >180/>120
    };

    for (const reading of readings) {
      if (reading.systolicBP > 180 || reading.diastolicBP > 120) {
        categories.crisis++;
      } else if (reading.systolicBP >= 140 || reading.diastolicBP >= 90) {
        categories.stage2++;
      } else if (reading.systolicBP >= 130 || reading.diastolicBP >= 80) {
        categories.stage1++;
      } else if (reading.systolicBP >= 120) {
        categories.elevated++;
      } else {
        categories.normal++;
      }
    }

    // Calculate trend (compare last 7 readings to previous 7)
    const trend = {
      systolic: "stable" as "improving" | "stable" | "worsening",
      diastolic: "stable" as "improving" | "stable" | "worsening"
    };

    if (readings.length >= 14) {
      const recent7 = readings.slice(0, 7);
      const previous7 = readings.slice(7, 14);

      const recentSysAvg = recent7.reduce((a, r) => a + r.systolicBP, 0) / 7;
      const previousSysAvg = previous7.reduce((a, r) => a + r.systolicBP, 0) / 7;
      const sysDiff = recentSysAvg - previousSysAvg;

      if (sysDiff < -5) trend.systolic = "improving";
      else if (sysDiff > 5) trend.systolic = "worsening";

      const recentDiaAvg = recent7.reduce((a, r) => a + r.diastolicBP, 0) / 7;
      const previousDiaAvg = previous7.reduce((a, r) => a + r.diastolicBP, 0) / 7;
      const diaDiff = recentDiaAvg - previousDiaAvg;

      if (diaDiff < -3) trend.diastolic = "improving";
      else if (diaDiff > 3) trend.diastolic = "worsening";
    }

    // Group by time of day for pattern analysis
    const byTimeOfDay = {
      MORNING: { count: 0, systolicAvg: 0, diastolicAvg: 0 },
      AFTERNOON: { count: 0, systolicAvg: 0, diastolicAvg: 0 },
      EVENING: { count: 0, systolicAvg: 0, diastolicAvg: 0 },
      NIGHT: { count: 0, systolicAvg: 0, diastolicAvg: 0 }
    };

    for (const reading of readings) {
      const time = reading.measurementTime;
      byTimeOfDay[time].count++;
      byTimeOfDay[time].systolicAvg += reading.systolicBP;
      byTimeOfDay[time].diastolicAvg += reading.diastolicBP;
    }

    for (const time of Object.keys(byTimeOfDay) as Array<keyof typeof byTimeOfDay>) {
      if (byTimeOfDay[time].count > 0) {
        byTimeOfDay[time].systolicAvg = Math.round(byTimeOfDay[time].systolicAvg / byTimeOfDay[time].count);
        byTimeOfDay[time].diastolicAvg = Math.round(byTimeOfDay[time].diastolicAvg / byTimeOfDay[time].count);
      }
    }

    return NextResponse.json({
      readings: readings.map(r => ({
        id: r.id,
        systolicBP: r.systolicBP,
        diastolicBP: r.diastolicBP,
        heartRate: r.heartRate,
        measurementTime: r.measurementTime,
        armUsed: r.armUsed,
        position: r.position,
        notes: r.notes,
        measuredAt: r.measuredAt.toISOString()
      })),
      statistics,
      categories,
      trends: trend,
      byTimeOfDay
    });
  } catch (error) {
    console.error("Error fetching BP history:", error);
    return NextResponse.json(
      { error: "Failed to fetch blood pressure history" },
      { status: 500 }
    );
  }
}

// POST - Add a new blood pressure reading
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
      heartRate,
      measurementTime,
      armUsed,
      position,
      notes,
      measuredAt
    } = body;

    // Validate required fields
    if (!systolicBP || !diastolicBP) {
      return NextResponse.json(
        { error: "Systolic and diastolic blood pressure are required" },
        { status: 400 }
      );
    }

    // Validate ranges
    if (systolicBP < 60 || systolicBP > 300) {
      return NextResponse.json(
        { error: "Systolic BP must be between 60 and 300 mmHg" },
        { status: 400 }
      );
    }

    if (diastolicBP < 30 || diastolicBP > 200) {
      return NextResponse.json(
        { error: "Diastolic BP must be between 30 and 200 mmHg" },
        { status: 400 }
      );
    }

    if (heartRate && (heartRate < 30 || heartRate > 250)) {
      return NextResponse.json(
        { error: "Heart rate must be between 30 and 250 bpm" },
        { status: 400 }
      );
    }

    // Create reading
    const reading = await prisma.bloodPressureReading.create({
      data: {
        userId: session.user.id,
        systolicBP,
        diastolicBP,
        heartRate: heartRate || null,
        measurementTime: measurementTime || "MORNING",
        armUsed: armUsed || "LEFT",
        position: position || "SITTING",
        notes: notes || null,
        measuredAt: measuredAt ? new Date(measuredAt) : new Date()
      }
    });

    // Update health profile with latest reading
    try {
      await prisma.healthProfile.upsert({
        where: { userId: session.user.id },
        update: {
          systolicBP,
          diastolicBP,
          bpMeasuredAt: new Date()
        },
        create: {
          userId: session.user.id,
          systolicBP,
          diastolicBP,
          bpMeasuredAt: new Date()
        }
      });

      // Clear heart analysis cache
      await prisma.aIAnalysisCache.deleteMany({
        where: {
          userId: session.user.id,
          analysisType: "heart"
        }
      });
    } catch {
      // Ignore profile update errors
    }

    // Determine BP category
    let category: string;
    if (systolicBP > 180 || diastolicBP > 120) {
      category = "crisis";
    } else if (systolicBP >= 140 || diastolicBP >= 90) {
      category = "stage2";
    } else if (systolicBP >= 130 || diastolicBP >= 80) {
      category = "stage1";
    } else if (systolicBP >= 120) {
      category = "elevated";
    } else {
      category = "normal";
    }

    return NextResponse.json({
      success: true,
      reading: {
        id: reading.id,
        systolicBP: reading.systolicBP,
        diastolicBP: reading.diastolicBP,
        heartRate: reading.heartRate,
        measurementTime: reading.measurementTime,
        measuredAt: reading.measuredAt.toISOString(),
        category
      },
      message: "Blood pressure reading saved successfully"
    });
  } catch (error) {
    console.error("Error saving BP reading:", error);
    return NextResponse.json(
      { error: "Failed to save blood pressure reading" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a blood pressure reading
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Reading ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const reading = await prisma.bloodPressureReading.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!reading) {
      return NextResponse.json(
        { error: "Reading not found" },
        { status: 404 }
      );
    }

    await prisma.bloodPressureReading.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Reading deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting BP reading:", error);
    return NextResponse.json(
      { error: "Failed to delete reading" },
      { status: 500 }
    );
  }
}
