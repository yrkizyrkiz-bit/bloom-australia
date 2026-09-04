export const ACTIVITY_BANDS = [
  { id: "sedentary", label: "Sedentary: little or no exercise", factor: 1.2, exerciseMin: 15 },
  { id: "light", label: "Light: exercise 1–3 times/week", factor: 1.375, exerciseMin: 25 },
  { id: "moderate", label: "Moderate: exercise 4–5 times/week", factor: 1.55, exerciseMin: 35 },
  { id: "active", label: "Active: daily or intense 3–4 times/week", factor: 1.725, exerciseMin: 45 },
  { id: "very_active", label: "Very active: intense 6–7 times/week", factor: 1.9, exerciseMin: 55 },
  { id: "extra_active", label: "Extra active: very intense daily / physical job", factor: 1.95, exerciseMin: 60 },
] as const;

export type ActivityBandId = (typeof ACTIVITY_BANDS)[number]["id"];
export type CalculatorSex = "male" | "female";

export type CalorieCalculatorInput = {
  age: number;
  sex: CalculatorSex;
  heightCm: number;
  weightKg: number;
  waistCm?: number | null;
  bodyFatPercent?: number | null;
  activityBand: ActivityBandId;
  weeklyTargetLossKg?: number | null;
};

export type CalorieCalculatorResult = {
  bmr: number;
  tdee: number;
  activityFactor: number;
  estimatedBodyFatPercent: number | null;
  bodyFatSource: "entered" | "estimated" | null;
  formula: "katch_mcardle" | "mifflin_st_jeor";
  dailyDeficit: number;
  dailyCalorieGoal: number;
  dailyExerciseMin: number;
  weeklyTargetLossKg: number;
};

const KCAL_PER_KG = 7700;
const MAX_DAILY_DEFICIT = 1000;

export function sexFromGender(gender: string | null | undefined): CalculatorSex {
  const g = (gender || "").toUpperCase();
  if (g === "FEMALE" || g === "F" || g === "WOMAN") return "female";
  return "male";
}

export function ageFromDateOfBirth(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1;
  if (age < 15 || age > 80) return age > 0 ? age : null;
  return age;
}

export function activityBandFromSessionsPerWeek(sessions: number): ActivityBandId {
  if (sessions <= 0) return "sedentary";
  if (sessions <= 3) return "light";
  if (sessions <= 5) return "moderate";
  if (sessions <= 6) return "active";
  return "very_active";
}

export function getActivityBand(id: ActivityBandId) {
  return ACTIVITY_BANDS.find((band) => band.id === id) ?? ACTIVITY_BANDS[1];
}

/** Relative fat mass from height and waist (cm). */
export function estimateBodyFatPercent(
  sex: CalculatorSex,
  heightCm: number,
  waistCm: number
): number | null {
  if (heightCm <= 0 || waistCm <= 0) return null;
  const base = sex === "female" ? 76 : 64;
  const percent = base - 20 * (heightCm / waistCm);
  if (!Number.isFinite(percent)) return null;
  return Math.round(Math.min(60, Math.max(5, percent)) * 10) / 10;
}

export function mifflinStJeorBmr(input: {
  age: number;
  sex: CalculatorSex;
  heightCm: number;
  weightKg: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === "female" ? base - 161 : base + 5);
}

export function katchMcArdleBmr(weightKg: number, bodyFatPercent: number): number {
  const leanKg = weightKg * (1 - bodyFatPercent / 100);
  return Math.round(370 + 21.6 * leanKg);
}

export function calorieFloor(sex: CalculatorSex): number {
  return sex === "female" ? 1200 : 1500;
}

export function calculateCaloriePlan(input: CalorieCalculatorInput): CalorieCalculatorResult {
  const band = getActivityBand(input.activityBand);
  const weeklyTargetLossKg = Math.min(1, Math.max(0.2, input.weeklyTargetLossKg ?? 0.5));
  const enteredFat =
    input.bodyFatPercent != null && input.bodyFatPercent > 0 && input.bodyFatPercent < 70
      ? input.bodyFatPercent
      : null;
  const estimatedFat =
    enteredFat == null && input.waistCm
      ? estimateBodyFatPercent(input.sex, input.heightCm, input.waistCm)
      : null;
  const fat = enteredFat ?? estimatedFat;
  const formula: CalorieCalculatorResult["formula"] =
    fat != null ? "katch_mcardle" : "mifflin_st_jeor";
  const bmr =
    fat != null
      ? katchMcArdleBmr(input.weightKg, fat)
      : mifflinStJeorBmr(input);
  const tdee = Math.round(bmr * band.factor);
  const dailyDeficit = Math.min(
    MAX_DAILY_DEFICIT,
    Math.round((weeklyTargetLossKg * KCAL_PER_KG) / 7)
  );
  const floor = calorieFloor(input.sex);
  const dailyCalorieGoal = Math.max(floor, tdee - dailyDeficit);

  return {
    bmr,
    tdee,
    activityFactor: band.factor,
    estimatedBodyFatPercent: fat,
    bodyFatSource: enteredFat != null ? "entered" : estimatedFat != null ? "estimated" : null,
    formula,
    dailyDeficit,
    dailyCalorieGoal,
    dailyExerciseMin: band.exerciseMin,
    weeklyTargetLossKg,
  };
}
