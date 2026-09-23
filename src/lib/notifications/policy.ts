export type NotificationFrequency = "QUIET" | "STANDARD" | "CLOSER";

/** Why a notification is being considered. The member's frequency decides which of these go out. */
export type NotificationIntent =
  | "RESULTS_READY"
  | "PROGRAM_STEP"
  | "CARE_MESSAGE"
  | "DUE_TODAY"
  | "WEEKLY_NOTE"
  | "MIDWEEK_NUDGE"
  | "RETEST"
  | "DAILY_TRACKING";

const ALWAYS_SEND = new Set<NotificationIntent>([
  "RESULTS_READY",
  "PROGRAM_STEP",
  "CARE_MESSAGE",
]);

export function normaliseFrequency(value: string | null | undefined): NotificationFrequency {
  if (value === "QUIET" || value === "CLOSER") return value;
  return "STANDARD";
}

export function allowsNotification(input: {
  frequency: NotificationFrequency;
  dailyTrackingPing: boolean;
  intent: NotificationIntent;
}): boolean {
  if (input.intent === "DAILY_TRACKING") return input.dailyTrackingPing;
  if (ALWAYS_SEND.has(input.intent)) return true;
  if (input.frequency === "QUIET") return false;
  if (input.intent === "MIDWEEK_NUDGE" || input.intent === "RETEST") {
    return input.frequency === "CLOSER";
  }
  return input.intent === "DUE_TODAY" || input.intent === "WEEKLY_NOTE";
}

/** Email only the items that need a decision, plus the weekly note when frequency allows it. */
export function allowsEmail(frequency: NotificationFrequency, intent: NotificationIntent): boolean {
  if (ALWAYS_SEND.has(intent)) return true;
  return intent === "WEEKLY_NOTE" && frequency !== "QUIET";
}

/** Non-urgent extras (a due item, a retest, a mid-week nudge). The daily ping has its own switch. */
export function extraDailyCap(frequency: NotificationFrequency): number {
  if (frequency === "CLOSER") return 2;
  if (frequency === "STANDARD") return 1;
  return 0;
}

export function isCappedExtra(intent: NotificationIntent): boolean {
  return intent === "DUE_TODAY" || intent === "MIDWEEK_NUDGE" || intent === "RETEST";
}

/** Start and end of the calendar day in a timezone, as UTC instants. */
export function timeZoneDayBounds(timeZone: string, now = new Date()): { start: Date; end: Date } {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const utcMidnight = new Date(`${dateKey}T00:00:00Z`);
  const zoned = new Date(utcMidnight.toLocaleString("en-US", { timeZone }));
  const offset = utcMidnight.getTime() - zoned.getTime();
  const start = new Date(utcMidnight.getTime() + offset);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
