import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const program = await prisma.memberProgram.findUnique({
      where: { userId: session.user.id },
    });

    if (!program?.prescriptionId) {
      return NextResponse.json({ success: true, doses: [], treatment: null });
    }

    const treatment = await prisma.treatment.findFirst({
      where: { userId: session.user.id, prescriptionId: program.prescriptionId },
      include: {
        doses: { orderBy: { scheduledAt: "asc" }, take: 16 },
      },
    });

    return NextResponse.json({
      success: true,
      treatment: treatment
        ? {
            id: treatment.id,
            medicationName: treatment.medicationName,
            dosage: treatment.dosage,
            frequency: treatment.frequency,
            nextDoseDate: treatment.nextDoseDate,
          }
        : null,
      doses: treatment?.doses.map((d) => ({
        id: d.id,
        scheduledAt: d.scheduledAt.toISOString(),
        takenAt: d.takenAt?.toISOString() || null,
        skipped: d.skipped,
        sideEffects: d.sideEffects,
        notes: d.notes,
      })) || [],
    });
  } catch (error) {
    console.error("[program/doses GET]", error);
    return NextResponse.json({ error: "Failed to load doses" }, { status: 500 });
  }
}
