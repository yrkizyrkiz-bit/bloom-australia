import type { WeightSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calendarDayBounds,
  mergeDailyLogFields,
  type DailyWeightLogPatch,
} from "@/lib/weight-management/daily-weight-log";

export async function upsertDailyWeightLog(input: {
  userId: string;
  weight?: number;
  waistCircumference?: number;
  measuredAt?: Date;
  source?: WeightSource;
  notes?: string | null;
}) {
  const measuredAt = input.measuredAt ?? new Date();
  const { start, end } = calendarDayBounds(measuredAt);

  const existingToday = await prisma.weightLog.findFirst({
    where: { userId: input.userId, measuredAt: { gte: start, lt: end } },
    orderBy: { measuredAt: "desc" },
  });

  const lastLog =
    existingToday ??
    (await prisma.weightLog.findFirst({
      where: { userId: input.userId },
      orderBy: { measuredAt: "desc" },
    }));

  const patch: DailyWeightLogPatch = {};
  if (typeof input.weight === "number") patch.weight = input.weight;
  if (typeof input.waistCircumference === "number") {
    patch.waistCircumference = input.waistCircumference;
  }
  if (input.notes !== undefined) patch.notes = input.notes;

  const merged = mergeDailyLogFields(
    existingToday
      ? {
          weight: existingToday.weight,
          waistCircumference: existingToday.waistCircumference,
          notes: existingToday.notes,
        }
      : null,
    existingToday ? null : lastLog?.weight ?? null,
    patch,
  );

  if (!merged) {
    return { ok: false as const, error: "Valid weight is required" };
  }

  const source = input.source ?? "MANUAL";

  if (existingToday) {
    const log = await prisma.weightLog.update({
      where: { id: existingToday.id },
      data: {
        weight: merged.weight,
        waistCircumference: merged.waistCircumference,
        notes: merged.notes,
        source,
      },
    });
    return { ok: true as const, created: false, log };
  }

  const log = await prisma.weightLog.create({
    data: {
      userId: input.userId,
      weight: merged.weight,
      waistCircumference: merged.waistCircumference,
      notes: merged.notes,
      measuredAt,
      source,
    },
  });
  return { ok: true as const, created: true, log };
}
