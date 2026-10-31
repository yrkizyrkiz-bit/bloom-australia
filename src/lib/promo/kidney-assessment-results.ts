import {
  pickTopDrivers,
  type OrganAssessmentUiCopy,
  type OrganDriver,
  type OrganResultTier,
} from "@/lib/promo/organ-assessment-results";

export type KidneyAnswers = {
  age: string;
  diabetes: string;
  bp: string;
  weight: string;
  family: string;
  symptoms: string[];
  medications: string;
};

const DRIVER_COPY = {
  age: {
    title: "Age 35+",
    body: "Kidney risk increases as we get older.",
  },
  diabetes: {
    title: "Pre-diabetes or diabetes",
    body: "Diabetes is the leading cause of kidney disease in Australia.",
  },
  bp: {
    title: "Blood pressure",
    body: "High blood pressure is the second leading cause of kidney disease.",
  },
  weight: {
    title: "BMI 25+",
    body: "Extra weight increases the load on your kidneys.",
  },
  family: {
    title: "Family history",
    body: "Kidney disease, diabetes and high blood pressure can run in families.",
  },
  symptoms: {
    title: "Kidney-related symptoms",
    body: "Fatigue, swelling or changes in urine can be a reason to check your kidneys.",
  },
  medications: {
    title: "Regular painkillers",
    body: "Frequent NSAIDs can be hard on the kidneys.",
  },
} as const;

const AGE_POINTS: Record<string, number> = {
  under35: 0,
  "35-44": 1,
  "45-54": 2,
  "55-64": 3,
  "65+": 4,
};

export const KIDNEY_RESULT_HEADLINES: Record<OrganResultTier, string> = {
  high: "Your answers suggest your kidneys deserve a closer look.",
  moderate: "A few things are worth checking.",
  low: "Your kidney risk looks low. Here's how to keep it that way.",
};

export const KIDNEY_BLOOD_MARKERS = [
  "eGFR",
  "Creatinine",
  "uACR",
  "BUN",
  "HbA1c",
  "Insulin",
  "Electrolytes",
] as const;

export const KIDNEY_RESULT_DISCLAIMER =
  "This check looks at common risk factors. It can't tell you whether you have kidney disease. Only a blood test can.";

export const KIDNEY_DRIVER_TITLES = Object.values(DRIVER_COPY).map((item) => item.title);

export const KIDNEY_ASSESSMENT_UI: OrganAssessmentUiCopy = {
  organ: "kidney",
  headlines: KIDNEY_RESULT_HEADLINES,
  markers: KIDNEY_BLOOD_MARKERS,
  disclaimer: KIDNEY_RESULT_DISCLAIMER,
  ctaLabel: "Check My Kidneys Risk",
  checkoutSource: "kidney_health",
  checkoutButton: "kidney_quiz_result",
  consentOrgan: "kidney",
  apiPath: "/api/public/organ-assessment-results",
  leadContentName: "Kidney assessment email results",
};

/** Same cut-offs as before. Elevated and high both show as High. */
export function kidneyDisplayTier(score: number): OrganResultTier {
  if (score <= 4) return "low";
  if (score <= 9) return "moderate";
  return "high";
}

export function kidneyScoreFromAnswers(answers: KidneyAnswers): number {
  let score = AGE_POINTS[answers.age] || 0;
  if (answers.diabetes === "type2") score += 4;
  else if (answers.diabetes === "type1") score += 3;
  else if (answers.diabetes === "prediabetes") score += 2;
  if (answers.bp === "high-uncontrolled") score += 4;
  else if (answers.bp === "high-controlled") score += 2;
  else if (answers.bp === "borderline") score += 1;
  if (answers.weight === "obese") score += 3;
  else if (answers.weight === "overweight") score += 2;
  if (answers.family === "kidney-disease") score += 3;
  else if (answers.family === "diabetes-bp") score += 2;
  score += answers.symptoms.length;
  if (answers.medications === "frequent") score += 2;
  else if (answers.medications === "occasional") score += 1;
  return score;
}

export function kidneyDriversFromAnswers(answers: KidneyAnswers): OrganDriver[] {
  const candidates: OrganDriver[] = [];

  const agePoints = AGE_POINTS[answers.age] || 0;
  if (agePoints > 0) candidates.push({ id: "age", points: agePoints, ...DRIVER_COPY.age });

  const diabetesPoints =
    answers.diabetes === "type2" ? 4 : answers.diabetes === "type1" ? 3 : answers.diabetes === "prediabetes" ? 2 : 0;
  if (diabetesPoints > 0) {
    candidates.push({ id: "diabetes", points: diabetesPoints, ...DRIVER_COPY.diabetes });
  }

  const bpPoints =
    answers.bp === "high-uncontrolled" ? 4 : answers.bp === "high-controlled" ? 2 : answers.bp === "borderline" ? 1 : 0;
  if (bpPoints > 0) candidates.push({ id: "bp", points: bpPoints, ...DRIVER_COPY.bp });

  const weightPoints = answers.weight === "obese" ? 3 : answers.weight === "overweight" ? 2 : 0;
  if (weightPoints > 0) candidates.push({ id: "weight", points: weightPoints, ...DRIVER_COPY.weight });

  const familyPoints = answers.family === "kidney-disease" ? 3 : answers.family === "diabetes-bp" ? 2 : 0;
  if (familyPoints > 0) candidates.push({ id: "family", points: familyPoints, ...DRIVER_COPY.family });

  if (answers.symptoms.length > 0) {
    candidates.push({ id: "symptoms", points: answers.symptoms.length, ...DRIVER_COPY.symptoms });
  }

  const medicationPoints = answers.medications === "frequent" ? 2 : answers.medications === "occasional" ? 1 : 0;
  if (medicationPoints > 0) {
    candidates.push({ id: "medications", points: medicationPoints, ...DRIVER_COPY.medications });
  }

  return pickTopDrivers(candidates);
}
