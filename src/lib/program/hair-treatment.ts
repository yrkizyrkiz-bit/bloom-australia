import { prisma } from "@/lib/prisma";
import { parseDoseIntervalDays } from "@/lib/program/dose-schedule";
import { parseUtcDateOnly } from "@/lib/program/member-schedule";

const MAX_SCHEDULE_DAYS = 90;
const DEFAULT_SUPPLY_DAYS = 28;

export function isDoctorCompletedHairPrescription(rx: {
  category?: string | null;
  status?: string | null;
}): boolean {
  return rx.category === "HAIR_LOSS" && rx.status === "ACTIVE";
}

export function hairDosesPerDay(frequency: string): number {
  const f = frequency.toLowerCase();
  if (/\btwice\b|\btwo times\b|\b2x\b|\b2 times\b/.test(f)) return 2;
  if (/\bthree times\b|\bthrice\b|\b3x\b/.test(f)) return 3;
  return 1;
}

export function generateHairDoseDates(
  firstDose: Date,
  frequency: string,
  supplyDays: number
): Date[] {
  const days = Math.min(MAX_SCHEDULE_DAYS, Math.max(1, supplyDays));
  const perDay = hairDosesPerDay(frequency);
  const intervalDays = perDay > 1 ? 1 : parseDoseIntervalDays(frequency);
  const dates: Date[] = [];

  if (perDay > 1) {
    for (let day = 0; day < days; day++) {
      for (let slot = 0; slot < perDay; slot++) {
        const date = new Date(firstDose);
        date.setUTCDate(date.getUTCDate() + day);
        date.setUTCHours(slot * Math.floor(24 / perDay), 0, 0, 0);
        dates.push(date);
      }
    }
    return dates;
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(firstDose);
    date.setUTCDate(date.getUTCDate() + i * intervalDays);
    dates.push(date);
  }
  return dates;
}

export function parseHairFirstDoseDate(value: string): Date | null {
  return parseUtcDateOnly(value);
}

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

  const supplyDays = prescription.daysSupply || DEFAULT_SUPPLY_DAYS;
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
