export type VitalityCheckIn = {
  date: string;
  energy: number;
  sleep: number;
  stress: number;
  mood: number;
  exercise: boolean;
  supplements: boolean;
  hydration: number;
};

const STORAGE_KEY = "vitalityCheckIns";

export function loadVitalityCheckIns(): VitalityCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVitalityCheckIns(checkIns: VitalityCheckIn[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
}

export function getTodayVitalityCheckIn(checkIns: VitalityCheckIn[]): VitalityCheckIn | null {
  const today = new Date().toDateString();
  return (
    checkIns.find((entry) => new Date(entry.date).toDateString() === today) ?? null
  );
}

export function computeVitalityStreak(checkIns: VitalityCheckIn[]): number {
  if (checkIns.length === 0) return 0;

  const uniqueDays = new Set(
    checkIns.map((entry) => {
      const d = new Date(entry.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (uniqueDays.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeWeeklyEnergyAverage(checkIns: VitalityCheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const recent = checkIns.slice(-7);
  return Math.round(recent.reduce((sum, entry) => sum + entry.energy, 0) / recent.length);
}

export function buildWeeklyEnergySeries(checkIns: VitalityCheckIn[]): number[] {
  const days: number[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const match = checkIns.find(
      (entry) => new Date(entry.date).toDateString() === day.toDateString()
    );
    days.push(match?.energy ?? 0);
  }

  return days;
}

export function countCompletedHabits(checkIn: VitalityCheckIn | null): number {
  if (!checkIn) return 0;
  let count = 0;
  if (checkIn.exercise) count += 1;
  if (checkIn.sleep >= 7) count += 1;
  if (checkIn.hydration >= 8) count += 1;
  if (checkIn.mood >= 6) count += 1;
  return count;
}
