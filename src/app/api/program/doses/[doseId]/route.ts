import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processSideEffectReport } from "@/lib/program/escalate-side-effect";
import type { SideEffectSeverity } from "@prisma/client";
import { startOfDayUTC } from "@/lib/program/dose-schedule";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ doseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doseId } = await params;
    const body = await request.json();
    const {
      action,
      skipReason,
      sideEffects,
      sideEffectSeverity,
      sideEffectNotes,
    } = body as {
      action: "taken" | "skipped";
      skipReason?: string;
      sideEffects?: string[];
      sideEffectSeverity?: SideEffectSeverity;
      sideEffectNotes?: string;
    };

    const dose = await prisma.medicationDose.findUnique({
      where: { id: doseId },
      include: { treatment: true },
    });

    if (!dose || dose.treatment.userId !== session.user.id) {
      return NextResponse.json({ error: "Dose not found" }, { status: 404 });
    }

    const program = await prisma.memberProgram.findUnique({
      where: { userId: session.user.id },
    });

    if (action === "taken") {
      await prisma.medicationDose.update({
        where: { id: doseId },
        data: {
          takenAt: new Date(),
          skipped: false,
          sideEffects: sideEffects || [],
          notes: sideEffectNotes || undefined,
        },
      });

      const nextDose = await prisma.medicationDose.findFirst({
        where: {
          treatmentId: dose.treatmentId,
          takenAt: null,
          skipped: false,
          scheduledAt: { gt: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
      });

      await prisma.treatment.update({
        where: { id: dose.treatmentId },
        data: { nextDoseDate: nextDose?.scheduledAt || null },
      });
    } else if (action === "skipped") {
      await prisma.medicationDose.update({
        where: { id: doseId },
        data: {
          skipped: true,
          skipReason: skipReason || "Patient skipped",
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let doseTask: { id: string } | null = null;
    if (program) {
      const doseTasks = await prisma.programTask.findMany({
        where: { memberProgramId: program.id, taskType: "DOSE" },
      });
      doseTask =
        doseTasks.find(
          (t) => (t.metadata as { doseId?: string } | null)?.doseId === doseId
        ) || null;
    }

    if (!doseTask && program) {
      const todayStart = startOfDayUTC(dose.scheduledAt);
      await prisma.programTask.updateMany({
        where: {
          memberProgramId: program.id,
          taskType: "DOSE",
          scheduledFor: todayStart,
          status: "PENDING",
        },
        data: { status: "DONE", completedAt: new Date() },
      });
    } else if (doseTask) {
      await prisma.programTask.update({
        where: { id: doseTask.id },
        data: { status: "DONE", completedAt: new Date() },
      });
    }

    let sideEffectReport = null;
    let plan = null;
    if (sideEffects?.length && sideEffectSeverity) {
      const result = await processSideEffectReport({
        userId: session.user.id,
        memberProgramId: program?.id,
        medicationDoseId: doseId,
        symptoms: sideEffects,
        severity: sideEffectSeverity,
        notes: sideEffectNotes,
      });
      sideEffectReport = result.report;
      plan = result.plan;
    }

    return NextResponse.json({
      success: true,
      doseId,
      action,
      sideEffectReport,
      plan,
    });
  } catch (error) {
    console.error("[program/doses]", error);
    return NextResponse.json({ error: "Failed to update dose" }, { status: 500 });
  }
}
