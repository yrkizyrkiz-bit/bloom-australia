const MS_PER_DAY = 24 * 60 * 60 * 1000;

function atLocalMidnight(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Earliest day we should judge program activity (logging, rings, AI notes).
 * Prefer the later of program commencement and doctor goal start so membership
 * days before the program begins are not treated as missed.
 */
export function resolveProgramCommencement(input: {
  programStartedAt?: Date | string | null;
  goalStartedAt?: Date | string | null;
  ringPlanActivatedAt?: Date | string | null;
  membershipStartedAt?: Date | string | null;
}): Date | null {
  const dates = [
    parseDate(input.programStartedAt),
    parseDate(input.goalStartedAt),
    parseDate(input.ringPlanActivatedAt),
  ].filter((d): d is Date => d != null);

  // Membership alone can pre-date doctor approval — only use it when nothing else exists.
  if (dates.length === 0) {
    return parseDate(input.membershipStartedAt);
  }

  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/**
 * Rolling lookback for weekly insight, clipped so days before commencement
 * are never included (e.g. Mon–Fri when someone starts Saturday).
 */
export function programActivityWindowStart(input: {
  programStartedAt?: Date | string | null;
  goalStartedAt?: Date | string | null;
  ringPlanActivatedAt?: Date | string | null;
  membershipStartedAt?: Date | string | null;
  now?: Date;
  lookbackDays?: number;
}): Date {
  const now = input.now ?? new Date();
  const lookback = new Date(now.getTime() - (input.lookbackDays ?? 7) * MS_PER_DAY);
  const commencement = resolveProgramCommencement(input);
  if (!commencement) return lookback;
  const start = atLocalMidnight(commencement);
  return start.getTime() > lookback.getTime() ? start : lookback;
}

export function daysOnProgramInWindow(
  commencement: Date | string | null | undefined,
  now = new Date()
) {
  const start = parseDate(commencement);
  if (!start) return 0;
  const a = atLocalMidnight(start).getTime();
  const b = atLocalMidnight(now).getTime();
  if (b < a) return 0;
  return Math.floor((b - a) / MS_PER_DAY) + 1;
}
