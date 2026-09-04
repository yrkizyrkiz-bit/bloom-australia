export type RingDayScore = {
  date: string;
  day: string;
  isToday: boolean;
  isFuture: boolean;
  meds: number;
  medsDue: boolean;
  weight: number;
  calories: number;
  calorieGoal: number;
  meals: number;
  caloriesClosed: boolean;
  caloriesOver: boolean;
  exercise: number;
  exerciseClockMin: number;
  exerciseGoal: number;
};

export type RingWeekScore = {
  weekStart: string;
  weeklyTargetLoss: number | null;
  dailyCalorieGoal: number;
  dailyExerciseMin: number;
  days: RingDayScore[];
};

export type RingWeekLogInput = {
  weights: Array<{ measuredAt: Date | string }>;
  meals: Array<{ loggedAt: Date | string; calories?: number | null }>;
  exercises: Array<{
    loggedAt: Date | string;
    durationMinutes: number;
    intensity?: string | null;
  }>;
  doses: Array<{ scheduledAt: Date | string; takenAt?: Date | string | null }>;
};

export function clampRatio(value: number, goal: number, max = 1.2) {
  if (goal <= 0) return 0;
  return Math.min(value / goal, max);
}

/**
 * Calorie ring fills with calories eaten vs the daily budget.
 * Past 100% it wraps a second lap, same as the exercise ring.
 */
export function calorieRingRatio(day: {
  isFuture: boolean;
  calories: number;
  calorieGoal: number;
}): number {
  if (day.isFuture) return 0;
  return clampRatio(day.calories, day.calorieGoal, 2);
}

export function todayRingProgress(day: RingDayScore | null | undefined): {
  completed: number;
  total: number;
  percent: number;
} {
  if (!day || day.isFuture) return { completed: 0, total: 0, percent: 0 };

  const fills: number[] = [];
  if (day.calorieGoal > 0) {
    fills.push(Math.min(1, calorieRingRatio(day)));
  }
  if (day.exerciseGoal > 0) {
    fills.push(Math.min(1, clampRatio(day.exercise, day.exerciseGoal, 1)));
  }
  fills.push(day.weight >= 1 ? 1 : 0);
  if (day.medsDue || day.meds >= 1) {
    fills.push(day.meds >= 1 ? 1 : 0);
  }

  const total = fills.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = fills.filter((fill) => fill >= 0.999).length;
  const percent = Math.round((fills.reduce((sum, fill) => sum + fill, 0) / total) * 100);
  return { completed, total, percent };
}

/** Doctor daily minutes are moderate-equivalent. Light counts less, vigorous more. */
export const EXERCISE_INTENSITY_WEIGHT: Record<string, number> = {
  LIGHT: 0.5,
  MODERATE: 1,
  VIGOROUS: 2,
  MAXIMUM: 2.5,
};

export function equivalentExerciseMinutes(
  durationMinutes: number,
  intensity?: string | null
): number {
  const minutes = Math.max(0, durationMinutes || 0);
  const weight = EXERCISE_INTENSITY_WEIGHT[(intensity || "MODERATE").toUpperCase()] ?? 1;
  return minutes * weight;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function startOfWeekMonday(from = new Date()): Date {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export function toDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(start: Date, days: number): Date {
  const next = new Date(start);
  next.setDate(start.getDate() + days);
  return next;
}

export function scoreRingWeek(
  logs: RingWeekLogInput,
  targets: {
    dailyCalorieGoal: number;
    dailyExerciseMin: number;
    weeklyTargetLoss?: number | null;
  },
  now = new Date()
): RingWeekScore {
  const weekStart = startOfWeekMonday(now);
  const todayKey = toDateKey(now);
  const calorieGoal = Math.max(0, targets.dailyCalorieGoal);
  const exerciseGoal = Math.max(0, targets.dailyExerciseMin);

  const weightDays = new Set(logs.weights.map((log) => toDateKey(log.measuredAt)));
  const mealsByDay = new Map<string, { calories: number; count: number }>();
  for (const meal of logs.meals) {
    const key = toDateKey(meal.loggedAt);
    const current = mealsByDay.get(key) ?? { calories: 0, count: 0 };
    current.calories += meal.calories || 0;
    current.count += 1;
    mealsByDay.set(key, current);
  }
  const exerciseByDay = new Map<string, { equivalent: number; clock: number }>();
  for (const session of logs.exercises) {
    const key = toDateKey(session.loggedAt);
    const current = exerciseByDay.get(key) ?? { equivalent: 0, clock: 0 };
    current.clock += session.durationMinutes;
    current.equivalent += equivalentExerciseMinutes(session.durationMinutes, session.intensity);
    exerciseByDay.set(key, current);
  }
  const dosesByDay = new Map<string, { scheduled: number; taken: number }>();
  for (const dose of logs.doses) {
    const key = toDateKey(dose.scheduledAt);
    const current = dosesByDay.get(key) ?? { scheduled: 0, taken: 0 };
    current.scheduled += 1;
    if (dose.takenAt) current.taken += 1;
    dosesByDay.set(key, current);
  }

  const days: RingDayScore[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const key = toDateKey(date);
    const meals = mealsByDay.get(key) ?? { calories: 0, count: 0 };
    const exercise = exerciseByDay.get(key) ?? { equivalent: 0, clock: 0 };
    const dose = dosesByDay.get(key);
    const isFuture = key > todayKey;
    const isToday = key === todayKey;
    const caloriesOver = calorieGoal > 0 && meals.calories > calorieGoal;
    const caloriesClosed =
      meals.count >= 2 && calorieGoal > 0 && meals.calories > 0 && meals.calories <= calorieGoal;

    return {
      date: key,
      day: DAY_LABELS[date.getDay()] ?? key,
      isToday,
      isFuture,
      meds: dose && dose.taken > 0 ? 1 : 0,
      medsDue: Boolean(dose && dose.scheduled > 0 && dose.taken < dose.scheduled && !isFuture),
      weight: weightDays.has(key) ? 1 : 0,
      calories: meals.calories,
      calorieGoal,
      meals: meals.count,
      caloriesClosed,
      caloriesOver,
      exercise: Math.round(exercise.equivalent * 10) / 10,
      exerciseClockMin: exercise.clock,
      exerciseGoal,
    };
  });

  return {
    weekStart: toDateKey(weekStart),
    weeklyTargetLoss: targets.weeklyTargetLoss ?? null,
    dailyCalorieGoal: calorieGoal,
    dailyExerciseMin: exerciseGoal,
    days,
  };
}
