import { prisma } from "@/lib/prisma";
import { parseDoseIntervalDays } from "@/lib/program/dose-schedule";
import {
  buildScheduleChangeLines,
  buildScheduleChangeNote,
  formatScheduleNoteDate,
  normalizeDosingFrequency,
  parseUtcDateOnly,
  planPendingDoseDates,
  resolveDoseSeriesStart,
  sameUtcDay,
  toUtcDateInput,
} from "@/lib/program/member-schedule";

export type MemberScheduleSnapshot = {
  activationDate: string;
  firstDoseDate: string;
  nextDoseDate: string;
  frequency: string;
  hasTreatment: boolean;
  hasProgram: boolean;
  hasTakenDoses: boolean;
  pendingDoseCount: number;
};

export type MemberScheduleUpdateInput = {
  userId: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  activationDate?: string | null;
  firstDoseDate?: string | null;
  nextDoseDate?: string | null;
  frequency?: string | null;
};

function nextUntaken(doses: Array<{ takenAt: Date | null; skipped: boolean; scheduledAt: Date }>) {
  return doses.find((dose) => !dose.takenAt && !dose.skipped) ?? null;
}

export async function loadMemberSchedule(userId: string): Promise<MemberScheduleSnapshot> {
  const [memberProgram, prescription] = await Promise.all([
    prisma.memberProgram.findUnique({
      where: { userId },
      select: { startedAt: true, prescriptionId: true },
    }),
    prisma.prescription.findFirst({
      where: { patientId: userId, category: "WEIGHT_MANAGEMENT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, startDate: true, frequency: true },
    }),
  ]);

  const treatment = await prisma.treatment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      doses: { orderBy: { scheduledAt: "asc" } },
    },
  });

  const nextDose = treatment ? nextUntaken(treatment.doses) : null;
  const firstDose = treatment?.doses[0] ?? null;

  return {
    activationDate: toUtcDateInput(memberProgram?.startedAt),
    firstDoseDate: toUtcDateInput(
      treatment?.startDate || prescription?.startDate || firstDose?.scheduledAt || null
    ),
    nextDoseDate: toUtcDateInput(nextDose?.scheduledAt || treatment?.nextDoseDate || null),
    frequency: normalizeDosingFrequency(
      treatment?.frequency || prescription?.frequency || "Once weekly"
    ),
    hasTreatment: Boolean(treatment),
    hasProgram: Boolean(memberProgram),
    hasTakenDoses: Boolean(treatment?.doses.some((dose) => dose.takenAt || dose.skipped)),
    pendingDoseCount: treatment?.doses.filter((dose) => !dose.takenAt && !dose.skipped).length ?? 0,
  };
}

export async function updateMemberSchedule(input: MemberScheduleUpdateInput) {
  const current = await loadMemberSchedule(input.userId);
  const activationDate = parseUtcDateOnly(input.activationDate ?? current.activationDate);
  const firstDoseDate = parseUtcDateOnly(input.firstDoseDate ?? current.firstDoseDate);
  const nextDoseDate = parseUtcDateOnly(input.nextDoseDate ?? current.nextDoseDate);
  const frequency = normalizeDosingFrequency(input.frequency || current.frequency);

  const firstChanged = Boolean(firstDoseDate) && !sameUtcDay(firstDoseDate, current.firstDoseDate);
  const nextChanged = Boolean(nextDoseDate) && !sameUtcDay(nextDoseDate, current.nextDoseDate);
  const activationChanged =
    Boolean(activationDate) && !sameUtcDay(activationDate, current.activationDate);
  const frequencyChanged = frequency !== current.frequency;
  const seriesStart = resolveDoseSeriesStart({
    hasTakenDoses: current.hasTakenDoses,
    firstDoseDate,
    nextDoseDate,
    firstChanged,
    nextChanged,
  });

  if (!activationChanged && !firstChanged && !nextChanged && !frequencyChanged) {
    return { snapshot: current, note: null };
  }

  const memberProgram = await prisma.memberProgram.findUnique({
    where: { userId: input.userId },
    select: { id: true, prescriptionId: true, startedAt: true },
  });

  const prescription = await prisma.prescription.findFirst({
    where: { patientId: input.userId, category: "WEIGHT_MANAGEMENT" },
    orderBy: { createdAt: "desc" },
  });

  const treatment = await prisma.treatment.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    include: { doses: { orderBy: { scheduledAt: "asc" } } },
  });

  if (activationChanged && activationDate && memberProgram) {
    await prisma.memberProgram.update({
      where: { id: memberProgram.id },
      data: { startedAt: activationDate },
    });
  }

  let regeneratedDoses = false;
  if (treatment && (firstChanged || nextChanged || frequencyChanged)) {
    const pending = treatment.doses.filter((dose) => !dose.takenAt && !dose.skipped);
    const hasTakenDoses = treatment.doses.some((dose) => dose.takenAt || dose.skipped);
    const seriesStart = resolveDoseSeriesStart({
      hasTakenDoses,
      firstDoseDate,
      nextDoseDate,
      firstChanged,
      nextChanged,
    });
    const shouldRegen = Boolean(seriesStart) && (firstChanged || nextChanged || frequencyChanged);

    if (shouldRegen && seriesStart) {
      const dates = planPendingDoseDates({
        hasTakenDoses,
        seriesStart,
        intervalDays: parseDoseIntervalDays(frequency),
        pendingCount: pending.length,
      });
      await prisma.medicationDose.deleteMany({
        where: {
          treatmentId: treatment.id,
          takenAt: null,
          skipped: false,
        },
      });
      if (dates.length > 0) {
        await prisma.medicationDose.createMany({
          data: dates.map((scheduledAt) => ({
            treatmentId: treatment.id,
            scheduledAt,
          })),
        });
      }
      regeneratedDoses = true;
    }

    const storedFirst = !hasTakenDoses ? seriesStart ?? firstDoseDate : firstDoseDate;
    const storedNext = regeneratedDoses
      ? seriesStart
      : nextDoseDate;

    await prisma.treatment.update({
      where: { id: treatment.id },
      data: {
        frequency,
        ...(storedFirst ? { startDate: storedFirst } : {}),
        ...(storedNext ? { nextDoseDate: storedNext } : {}),
      },
    });

    if (prescription && (frequencyChanged || firstChanged || (!hasTakenDoses && nextChanged))) {
      await prisma.prescription.update({
        where: { id: prescription.id },
        data: {
          frequency,
          ...(storedFirst ? { startDate: storedFirst } : {}),
        },
      });
    }
  } else if (prescription && (frequencyChanged || firstChanged)) {
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        ...(frequencyChanged ? { frequency } : {}),
        ...(firstDoseDate ? { startDate: firstDoseDate } : {}),
      },
    });
  }

  const lines = buildScheduleChangeLines([
    {
      label: "Activation date",
      from: formatScheduleNoteDate(current.activationDate),
      to: formatScheduleNoteDate(activationDate),
    },
    {
      label: "First dose date",
      from: formatScheduleNoteDate(current.firstDoseDate),
      to: formatScheduleNoteDate(
        !current.hasTakenDoses ? seriesStart ?? firstDoseDate : firstDoseDate
      ),
    },
    {
      label: "Next dose scheduled",
      from: formatScheduleNoteDate(current.nextDoseDate),
      to: formatScheduleNoteDate(
        !current.hasTakenDoses ? seriesStart ?? nextDoseDate : nextDoseDate
      ),
    },
    {
      label: "Dosing",
      from: current.frequency || "not set",
      to: frequency || "not set",
    },
  ]);

  const content = buildScheduleChangeNote({
    actorName: input.actorName,
    actorRole: input.actorRole,
    lines,
    regeneratedDoses,
  });

  const note = await prisma.internalNote.create({
    data: {
      userId: input.userId,
      memberId: input.userId,
      title: "Program schedule updated",
      content,
      category: "MEDICAL",
      createdBy: input.actorUserId,
      authorId: input.actorUserId,
      authorName: input.actorName,
      isPinned: false,
    },
  });

  const snapshot = await loadMemberSchedule(input.userId);
  return { snapshot, note };
}
