/** Same 6-month horizon the public weight-management quiz uses for the sketch. */
export const DEFAULT_PROJECTION_MONTHS = 6;

const MS_PER_MONTH = (1000 * 60 * 60 * 24 * 365.25) / 12;

export function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_MONTH;
}

/** Clamp the goal window so the sketch stays readable. */
export function programHorizonMonths(startDate: Date, targetDate: Date | null | undefined): number {
  if (!targetDate || Number.isNaN(targetDate.getTime())) return DEFAULT_PROJECTION_MONTHS;
  return Math.min(18, Math.max(1, monthsBetween(startDate, targetDate)));
}

export function getWeightLossCurveParams(
  startWeight: number,
  targetWeight: number,
  goalMonths = DEFAULT_PROJECTION_MONTHS
) {
  const weightLoss = Math.max(0, startWeight - targetWeight);
  const months = Math.max(1, goalMonths);
  const k = -Math.log(0.05) / months;
  return { weightLoss, goalMonths: months, totalMonths: months, k };
}

export function projectedWeightAt(
  startWeight: number,
  targetWeight: number,
  tMonths: number,
  k: number
) {
  return targetWeight + (startWeight - targetWeight) * Math.exp(-k * Math.max(0, tMonths));
}

export function monthsFromStart(startDate: Date, at: Date, totalMonths: number) {
  return Math.min(totalMonths, Math.max(0, monthsBetween(startDate, at)));
}

function fmt(n: number) {
  return n.toFixed(2);
}

/** Catmull-Rom spline as cubic Beziers so the sketch stays smooth when scaled. */
export function smoothSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  if (points.length === 2) {
    return `M${fmt(points[0].x)},${fmt(points[0].y)} L${fmt(points[1].x)},${fmt(points[1].y)}`;
  }

  let d = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }
  return d;
}

export function monthAxisTicks(totalMonths: number) {
  const step = totalMonths <= 4 ? 1 : 3;
  const ticks: number[] = [];
  for (let m = 0; m <= totalMonths + 0.05; m += step) {
    ticks.push(Math.min(m, totalMonths));
  }
  const last = ticks[ticks.length - 1] ?? 0;
  if (totalMonths - last > 0.4) ticks.push(totalMonths);
  return ticks;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function elapsedCalendarDays(startDate: Date, now = new Date()) {
  if (Number.isNaN(startDate.getTime())) return 1;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((today.getTime() - start.getTime()) / MS_PER_DAY));
}

/** Observed kg lost per calendar day since the plan start. Weight gain counts as 0. */
export function averageDailyWeightLossKg(
  actualLostKg: number,
  startDate: Date | string,
  now = new Date()
) {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const days = elapsedCalendarDays(start, now);
  return Math.round(Math.max(0, actualLostKg / days) * 100) / 100;
}

export function formatAverageDailyLoss(kgPerDay: number) {
  const n = Math.max(0, kgPerDay);
  if (n === 0) return "0 kg/day avg";
  if (n < 1) return `${n.toFixed(2)} kg/day avg`;
  return `${n.toFixed(1)} kg/day avg`;
}
