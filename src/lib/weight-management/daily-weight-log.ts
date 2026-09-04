export type DailyWeightLogFields = {
  weight: number;
  waistCircumference: number | null;
  notes: string | null;
};

export type DailyWeightLogPatch = {
  weight?: number;
  waistCircumference?: number;
  notes?: string | null;
};

/** Local calendar day [start, end) for same-day weight/waist upserts. */
export function calendarDayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Merge a weight or waist save onto today's entry.
 * Saving one field leaves the other as-is. A new day does not copy yesterday's waist.
 */
export function mergeDailyLogFields(
  existingToday: DailyWeightLogFields | null,
  lastWeightKg: number | null,
  patch: DailyWeightLogPatch,
): DailyWeightLogFields | null {
  const weight = patch.weight ?? existingToday?.weight ?? lastWeightKg ?? null;
  if (weight == null || !(weight > 0)) return null;

  return {
    weight,
    waistCircumference:
      patch.waistCircumference ?? existingToday?.waistCircumference ?? null,
    notes: patch.notes !== undefined ? patch.notes : existingToday?.notes ?? null,
  };
}
