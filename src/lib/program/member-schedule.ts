import { generateDoseDates } from "@/lib/program/dose-schedule";

export const PROGRAM_DOSE_COUNT = 12;

export const DOSING_FREQUENCY_OPTIONS = [
  { value: "Once weekly", label: "Once weekly" },
  { value: "Once daily", label: "Once daily" },
  { value: "Every other day", label: "Every other day" },
  { value: "Every 2 weeks", label: "Every 2 weeks" },
  { value: "Once monthly", label: "Once monthly" },
] as const;

const DOSING_FREQUENCY_ALIASES: Record<string, string> = {
  once_weekly: "Once weekly",
  weekly: "Once weekly",
  once_daily: "Once daily",
  daily: "Once daily",
  every_other_day: "Every other day",
  every_2_weeks: "Every 2 weeks",
  fortnightly: "Every 2 weeks",
  once_monthly: "Once monthly",
  monthly: "Once monthly",
};

export function normalizeDosingFrequency(value: string | null | undefined): string {
  const raw = value?.trim() || "";
  if (!raw) return "Once weekly";
  const alias = DOSING_FREQUENCY_ALIASES[raw.toLowerCase().replace(/[\s-]+/g, "_")];
  if (alias) return alias;
  const match = DOSING_FREQUENCY_OPTIONS.find(
    (option) => option.value.toLowerCase() === raw.toLowerCase()
  );
  return match?.value || raw;
}

export function parseUtcDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toUtcDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function sameUtcDay(a: Date | string | null | undefined, b: Date | string | null | undefined): boolean {
  const left = toUtcDateInput(a);
  const right = toUtcDateInput(b);
  return Boolean(left) && left === right;
}

export function formatScheduleNoteDate(value: Date | string | null | undefined): string {
  if (!value) return "not set";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "not set";
  return date.toLocaleDateString("en-AU", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function resolveDoseSeriesStart(input: {
  hasTakenDoses: boolean;
  firstDoseDate: Date | null;
  nextDoseDate: Date | null;
  firstChanged: boolean;
  nextChanged: boolean;
}): Date | null {
  if (input.hasTakenDoses) {
    return input.nextDoseDate;
  }
  if (input.nextChanged && input.nextDoseDate) return input.nextDoseDate;
  if (input.firstChanged && input.firstDoseDate) return input.firstDoseDate;
  return input.nextDoseDate ?? input.firstDoseDate;
}

export function planPendingDoseDates(input: {
  hasTakenDoses: boolean;
  seriesStart: Date;
  intervalDays: number;
  pendingCount: number;
}): Date[] {
  const count = input.hasTakenDoses
    ? Math.max(input.pendingCount, 1)
    : PROGRAM_DOSE_COUNT;
  return generateDoseDates(input.seriesStart, input.intervalDays, count);
}

export function buildScheduleChangeLines(changes: Array<{ label: string; from: string; to: string }>): string[] {
  return changes
    .filter((change) => change.from !== change.to)
    .map((change) => `${change.label}: ${change.from} → ${change.to}`);
}

export function buildScheduleChangeNote(input: {
  actorName: string;
  actorRole: string;
  lines: string[];
  regeneratedDoses: boolean;
}): string {
  const header = `Program schedule updated by ${input.actorName} (${input.actorRole})`;
  if (input.lines.length === 0) return header;
  const regen = input.regeneratedDoses
    ? "\n\nRemaining untaken doses were regenerated from the new schedule."
    : "";
  return `${header}\n\n${input.lines.join("\n")}${regen}`;
}
