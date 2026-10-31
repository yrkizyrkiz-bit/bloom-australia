import {
  pickTopDrivers,
  type OrganAssessmentUiCopy,
  type OrganDriver,
  type OrganResultTier,
} from "@/lib/promo/organ-assessment-results";

export type HeartAnswers = {
  age: string;
  cholesterol: string;
  bp: string;
  smoking: string;
  diabetes: string;
  bmi: string;
  family: string;
};

const DRIVER_COPY = {
  age: {
    title: "Age 45+",
    body: "Heart risk rises with age, even when you feel well.",
  },
  cholesterol: {
    title: "Cholesterol",
    body: "High blood fats are a major driver of heart disease.",
  },
  bp: {
    title: "Blood pressure",
    body: "High blood pressure strains the heart and arteries.",
  },
  smoking: {
    title: "Smoking",
    body: "Smoking damages blood vessels and raises heart risk.",
  },
  diabetes: {
    title: "Pre-diabetes or diabetes",
    body: "Blood sugar problems are one of the strongest risk factors for heart disease.",
  },
  bmi: {
    title: "BMI 25+",
    body: "Extra weight increases the strain on your heart.",
  },
  family: {
    title: "Family history",
    body: "Heart disease in close relatives raises your own risk.",
  },
} as const;

export const HEART_RESULT_HEADLINES: Record<OrganResultTier, string> = {
  high: "Your answers suggest your heart deserves a closer look.",
  moderate: "A few things are worth checking.",
  low: "Your heart risk looks low. Here's how to keep it that way.",
};

export const HEART_BLOOD_MARKERS = [
  "LDL",
  "HDL",
  "Triglycerides",
  "Total cholesterol",
  "hs-CRP",
  "HbA1c",
  "ApoB",
] as const;

export const HEART_RESULT_DISCLAIMER =
  "This check looks at common risk factors. It can't tell you whether you have heart disease. Only a blood test can.";

export const HEART_DRIVER_TITLES = Object.values(DRIVER_COPY).map((item) => item.title);

export const HEART_ASSESSMENT_UI: OrganAssessmentUiCopy = {
  organ: "heart",
  headlines: HEART_RESULT_HEADLINES,
  markers: HEART_BLOOD_MARKERS,
  disclaimer: HEART_RESULT_DISCLAIMER,
  ctaLabel: "Check My Heart Risk",
  checkoutSource: "heart_health",
  checkoutButton: "heart_quiz_result",
  consentOrgan: "heart",
  apiPath: "/api/public/organ-assessment-results",
  leadContentName: "Heart assessment email results",
};

/** Same cut-offs as before. Elevated and high both show as High. */
export function heartDisplayTier(score: number): OrganResultTier {
  if (score <= 3) return "low";
  if (score <= 7) return "moderate";
  return "high";
}

function heartAgePoints(ageValue: string): number {
  // Preserve the existing parseInt bucket scoring (e.g. "45-54" → 45).
  const age = parseInt(ageValue, 10) || 0;
  if (age >= 65) return 3;
  if (age >= 55) return 2;
  if (age >= 45) return 1;
  return 0;
}

export function heartScoreFromAnswers(answers: HeartAnswers): number {
  let score = 0;
  score += heartAgePoints(answers.age);
  if (answers.cholesterol === "high") score += 3;
  else if (answers.cholesterol === "borderline") score += 2;
  else if (answers.cholesterol === "unknown") score += 1;
  if (answers.bp === "high") score += 3;
  else if (answers.bp === "borderline") score += 2;
  else if (answers.bp === "unknown") score += 1;
  if (answers.smoking === "current") score += 3;
  else if (answers.smoking === "former") score += 1;
  if (answers.diabetes === "yes") score += 3;
  else if (answers.diabetes === "prediabetes") score += 2;
  if (answers.bmi === "obese") score += 3;
  else if (answers.bmi === "overweight") score += 2;
  if (answers.family === "yes-early") score += 3;
  else if (answers.family === "yes") score += 2;
  return score;
}

export function heartDriversFromAnswers(answers: HeartAnswers): OrganDriver[] {
  const candidates: OrganDriver[] = [];

  const agePoints = heartAgePoints(answers.age);
  if (agePoints > 0) candidates.push({ id: "age", points: agePoints, ...DRIVER_COPY.age });

  const cholesterolPoints =
    answers.cholesterol === "high" ? 3 : answers.cholesterol === "borderline" ? 2 : answers.cholesterol === "unknown" ? 1 : 0;
  if (cholesterolPoints > 0) {
    candidates.push({ id: "cholesterol", points: cholesterolPoints, ...DRIVER_COPY.cholesterol });
  }

  const bpPoints =
    answers.bp === "high" ? 3 : answers.bp === "borderline" ? 2 : answers.bp === "unknown" ? 1 : 0;
  if (bpPoints > 0) candidates.push({ id: "bp", points: bpPoints, ...DRIVER_COPY.bp });

  const smokingPoints = answers.smoking === "current" ? 3 : answers.smoking === "former" ? 1 : 0;
  if (smokingPoints > 0) candidates.push({ id: "smoking", points: smokingPoints, ...DRIVER_COPY.smoking });

  const diabetesPoints = answers.diabetes === "yes" ? 3 : answers.diabetes === "prediabetes" ? 2 : 0;
  if (diabetesPoints > 0) {
    candidates.push({ id: "diabetes", points: diabetesPoints, ...DRIVER_COPY.diabetes });
  }

  const bmiPoints = answers.bmi === "obese" ? 3 : answers.bmi === "overweight" ? 2 : 0;
  if (bmiPoints > 0) candidates.push({ id: "bmi", points: bmiPoints, ...DRIVER_COPY.bmi });

  const familyPoints = answers.family === "yes-early" ? 3 : answers.family === "yes" ? 2 : 0;
  if (familyPoints > 0) candidates.push({ id: "family", points: familyPoints, ...DRIVER_COPY.family });

  return pickTopDrivers(candidates);
}
