import {
  canLogDoseScheduledFor,
  formatNextDoseDateLong,
} from "@/lib/program/dose-schedule";
import { normalizeDosingFrequency } from "@/lib/program/member-schedule";

export type DoseInsightStatus = "no_schedule" | "not_due_yet" | "taken" | "overdue" | "skipped";

export type MedicationInsight = {
  name: string | null;
  dosage: string | null;
  frequency: string;
  firstDoseDate: string | null;
  nextDoseDate: string | null;
  lastTakenDate: string | null;
  dueCount: number;
  takenDueCount: number;
  adherencePct: number | null;
  status: DoseInsightStatus;
  coachNote: string;
};

export function summariseMedicationForInsight(input: {
  medicationName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  startDate?: Date | string | null;
  doses: Array<{ scheduledAt: Date | string; takenAt?: Date | string | null; skipped?: boolean }>;
  now?: Date;
}): MedicationInsight {
  const now = input.now ?? new Date();
  const frequency = normalizeDosingFrequency(input.frequency);
  const name = input.medicationName?.trim() || null;
  const dosage = input.dosage?.trim() || null;
  const doses = [...input.doses].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const first = doses[0]?.scheduledAt ?? input.startDate ?? null;
  const nextOpen = doses.find((dose) => !dose.takenAt && !dose.skipped) ?? null;
  const lastTaken = [...doses].reverse().find((dose) => dose.takenAt) ?? null;
  const due = doses.filter((dose) => canLogDoseScheduledFor(dose.scheduledAt, now));
  const takenDue = due.filter((dose) => Boolean(dose.takenAt));
  const skippedDue = due.filter((dose) => dose.skipped && !dose.takenAt);

  let status: DoseInsightStatus = "no_schedule";
  if (nextOpen && !canLogDoseScheduledFor(nextOpen.scheduledAt, now) && takenDue.length === 0) {
    status = "not_due_yet";
  } else if (lastTaken && due.length > 0 && takenDue.length === due.length) {
    status = "taken";
  } else if (skippedDue.length > 0 && takenDue.length < due.length) {
    status = "skipped";
  } else if (due.length > 0 && takenDue.length < due.length) {
    status = "overdue";
  } else if (first) {
    status = "not_due_yet";
  }

  const adherencePct =
    due.length > 0 ? Math.round((takenDue.length / due.length) * 100) : null;

  return {
    name,
    dosage,
    frequency,
    firstDoseDate: first ? formatNextDoseDateLong(first) : null,
    nextDoseDate: nextOpen ? formatNextDoseDateLong(nextOpen.scheduledAt) : null,
    lastTakenDate: lastTaken?.takenAt ? formatNextDoseDateLong(lastTaken.takenAt) : null,
    dueCount: due.length,
    takenDueCount: takenDue.length,
    adherencePct,
    status,
    coachNote: buildMedicationCoachNote({
      name,
      dosage,
      frequency,
      status,
      firstDoseDate: first ? formatNextDoseDateLong(first) : null,
      nextDoseDate: nextOpen ? formatNextDoseDateLong(nextOpen.scheduledAt) : null,
    }),
  };
}

function buildMedicationCoachNote(input: {
  name: string | null;
  dosage: string | null;
  frequency: string;
  status: DoseInsightStatus;
  firstDoseDate: string | null;
  nextDoseDate: string | null;
}): string {
  const med = [input.name, input.dosage].filter(Boolean).join(" ");
  const labelled = med ? `${med}, ${input.frequency}` : input.frequency;
  const isDaily = input.frequency.toLowerCase().includes("daily");

  if (input.status === "not_due_yet") {
    const when = input.nextDoseDate || input.firstDoseDate || "the scheduled day";
    return `${labelled}. Next dose is ${when}. It is not due yet — do not say they missed a dose or have low adherence. ${
      isDaily ? "" : "This is not a daily medication."
    }`.trim();
  }
  if (input.status === "taken") {
    return `${labelled}. Doses that were due have been taken. ${
      input.nextDoseDate ? `Next dose is ${input.nextDoseDate}.` : ""
    }`.trim();
  }
  if (input.status === "overdue") {
    return `${labelled}. A scheduled dose is due or overdue (${input.nextDoseDate || "see treatment hub"}). Mention the date once, kindly — do not treat this as a daily missed pill.`;
  }
  if (input.status === "skipped") {
    return `${labelled}. A scheduled dose was skipped. Be supportive, not clinical.`;
  }
  return `${labelled}. No dose dates are on file yet. Do not invent a daily medication schedule.`;
}
