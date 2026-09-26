import { prisma } from "@/lib/prisma";
import { toUtcDateInput } from "@/lib/program/member-schedule";
import {
  HAIR_DEFAULT_SUPPLY_DAYS,
  generateHairDoseDates,
  hairDoseScheduleNeedsRepair,
  isDoctorCompletedHairPrescription,
  parseHairFirstDoseDate,
} from "@/lib/program/hair-treatment-schedule";

export {
  formatHairDoseLine,
  formatHairFrequencyLabel,
  generateHairDoseDates,
  hairDoseScheduleNeedsRepair,
  hairDosesPerDay,
  isDoctorCompletedHairPrescription,
  parseHairDoseIntervalDays,
  parseHairFirstDoseDate,
  selectUpcomingHairDoses,
} from "@/lib/program/hair-treatment-schedule";

export async function startHairTreatmentFromFirstDose(input: {
  userId: string;
  prescriptionId: string;
  firstDoseDate: string;
}): Promise<{
  treatmentId: string;
  firstDoseDate: string;
  nextDoseDate: string | null;
  doseCount: number;
}> {
  const firstDose = parseHairFirstDoseDate(input.firstDoseDate);
  if (!firstDose) {
    throw new Error("Enter a valid first dose date");
  }

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: input.prescriptionId,
      patientId: input.userId,
      status: "ACTIVE",
    },
  });

  if (!prescription || !isDoctorCompletedHairPrescription(prescription)) {
    throw new Error("No completed hair prescription found");
  }

  const existing = await prisma.treatment.findFirst({
    where: { userId: input.userId, prescriptionId: prescription.id },
    include: { doses: { select: { takenAt: true } } },
  });

  if (existing?.doses.some((dose) => dose.takenAt)) {
    throw new Error("This treatment already has logged doses");
  }

  const supplyDays = prescription.daysSupply || HAIR_DEFAULT_SUPPLY_DAYS;
  const doseDates = generateHairDoseDates(firstDose, prescription.frequency, supplyDays);
  const nextDoseDate = doseDates[0] ?? firstDose;

  const treatment = existing
    ? await prisma.treatment.update({
        where: { id: existing.id },
        data: {
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          instructions: prescription.instructions,
          doctorName: prescription.prescriberName,
          startDate: firstDose,
          nextDoseDate,
          isActive: true,
        },
      })
    : await prisma.treatment.create({
        data: {
          userId: input.userId,
          prescriptionId: prescription.id,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          instructions: prescription.instructions,
          doctorName: prescription.prescriberName,
          pharmacyName: prescription.pharmacyName,
          pharmacyPhone: prescription.pharmacyPhone,
          startDate: firstDose,
          nextDoseDate,
          isActive: true,
        },
      });

  await prisma.medicationDose.deleteMany({
    where: { treatmentId: treatment.id, takenAt: null },
  });

  if (doseDates.length > 0) {
    await prisma.medicationDose.createMany({
      data: doseDates.map((scheduledAt) => ({
        treatmentId: treatment.id,
        scheduledAt,
      })),
    });
  }

  await prisma.prescription.update({
    where: { id: prescription.id },
    data: { startDate: firstDose },
  });

  return {
    treatmentId: treatment.id,
    firstDoseDate: firstDose.toISOString(),
    nextDoseDate: nextDoseDate.toISOString(),
    doseCount: doseDates.length,
  };
}

export async function repairHairTreatmentScheduleIfNeeded(input: {
  userId: string;
  prescriptionId: string | null;
  frequency: string;
  startDate: Date;
  daysSupply?: number | null;
  doses: Array<{ scheduledAt: Date; takenAt: Date | null }>;
}): Promise<boolean> {
  if (!input.prescriptionId) return false;
  if (input.doses.some((dose) => dose.takenAt)) return false;
  const supplyDays = input.daysSupply || HAIR_DEFAULT_SUPPLY_DAYS;
  if (
    !hairDoseScheduleNeedsRepair(
      input.frequency,
      input.startDate,
      supplyDays,
      input.doses.map((dose) => dose.scheduledAt)
    )
  ) {
    return false;
  }

  await startHairTreatmentFromFirstDose({
    userId: input.userId,
    prescriptionId: input.prescriptionId,
    firstDoseDate: toUtcDateInput(input.startDate),
  });
  return true;
}
