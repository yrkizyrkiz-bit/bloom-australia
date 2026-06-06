import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processSideEffectReport } from "@/lib/program/escalate-side-effect";
import { SIDE_EFFECT_SYMPTOMS, getMitigationPlan } from "@/lib/program/side-effects";
import type { SideEffectSeverity } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    const reports = await prisma.sideEffectReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      reports,
      symptomOptions: SIDE_EFFECT_SYMPTOMS,
    });
  } catch (error) {
    console.error("[program/side-effects GET]", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { symptoms, severity, notes, medicationDoseId, previewOnly } = body as {
      symptoms: string[];
      severity: SideEffectSeverity;
      notes?: string;
      medicationDoseId?: string;
      previewOnly?: boolean;
    };

    if (!symptoms?.length || !severity) {
      return NextResponse.json(
        { error: "Symptoms and severity are required" },
        { status: 400 }
      );
    }

    const plan = getMitigationPlan(symptoms, severity);

    if (previewOnly) {
      return NextResponse.json({ success: true, preview: true, plan });
    }

    const program = await prisma.memberProgram.findUnique({
      where: { userId: session.user.id },
    });

    const { report, plan: appliedPlan } = await processSideEffectReport({
      userId: session.user.id,
      memberProgramId: program?.id,
      medicationDoseId: medicationDoseId || null,
      symptoms,
      severity,
      notes,
    });

    return NextResponse.json({
      success: true,
      report,
      plan: appliedPlan,
    });
  } catch (error) {
    console.error("[program/side-effects POST]", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, status } = await request.json();
    if (!reportId || status !== "RESOLVED") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const report = await prisma.sideEffectReport.updateMany({
      where: { id: reportId, userId: session.user.id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });

    return NextResponse.json({ success: true, updated: report.count > 0 });
  } catch (error) {
    console.error("[program/side-effects PATCH]", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
