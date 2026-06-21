import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatUseLogNotes,
  isSexualHealthMedication,
  type UseEffectiveness,
} from "@/lib/mens-sexual-health/portal-data";

const VALID_EFFECTIVENESS = new Set<UseEffectiveness>([
  "excellent",
  "good",
  "limited",
  "none",
]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const treatmentId = body?.treatmentId as string | undefined;
    const prescriptionId = body?.prescriptionId as string | undefined;
    const effectiveness = body?.effectiveness as UseEffectiveness | undefined;
    const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
    const sideEffects = Array.isArray(body?.sideEffects)
      ? body.sideEffects.filter((item: unknown) => typeof item === "string")
      : [];

    if (!treatmentId && !prescriptionId) {
      return NextResponse.json(
        { error: "Missing treatmentId or prescriptionId" },
        { status: 400 }
      );
    }
    if (!effectiveness || !VALID_EFFECTIVENESS.has(effectiveness)) {
      return NextResponse.json({ error: "Invalid effectiveness rating" }, { status: 400 });
    }

    let treatment = treatmentId
      ? await prisma.treatment.findFirst({
          where: { id: treatmentId, userId: session.user.id, isActive: true },
        })
      : null;

    if (!treatment && prescriptionId) {
      const prescription = await prisma.prescription.findFirst({
        where: {
          id: prescriptionId,
          patientId: session.user.id,
          status: "ACTIVE",
        },
      });

      if (
        !prescription ||
        !(
          prescription.category === "SEXUAL_HEALTH" ||
          isSexualHealthMedication(
            prescription.medicationName,
            prescription.diagnosis,
            prescription.notes
          )
        )
      ) {
        return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
      }

      treatment = await prisma.treatment.create({
        data: {
          userId: session.user.id,
          prescriptionId: prescription.id,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          instructions: prescription.instructions,
          doctorName: prescription.prescriberName,
          pharmacyName: prescription.pharmacyName,
          pharmacyPhone: prescription.pharmacyPhone,
          startDate: prescription.startDate,
          nextDoseDate: null,
          isActive: true,
        },
      });
    }

    if (
      !treatment ||
      !isSexualHealthMedication(treatment.medicationName, null, treatment.instructions)
    ) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    const now = new Date();
    const dose = await prisma.medicationDose.create({
      data: {
        treatmentId: treatment.id,
        scheduledAt: now,
        takenAt: now,
        notes: formatUseLogNotes({ effectiveness, detail, sideEffects }),
        sideEffects,
      },
    });

    return NextResponse.json({
      success: true,
      dose: {
        id: dose.id,
        takenAt: dose.takenAt?.toISOString(),
        effectiveness,
      },
    });
  } catch (error) {
    console.error("[mens-health/sexual-health/log-use]", error);
    return NextResponse.json({ error: "Failed to log medication use" }, { status: 500 });
  }
}
