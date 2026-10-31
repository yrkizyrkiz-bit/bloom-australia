import {
  pickTopDrivers,
  sanitizeAssessmentFirstName,
  sanitizeOrganDrivers,
  type OrganAssessmentUiCopy,
  type OrganDriver,
  type OrganResultTier,
} from "@/lib/promo/organ-assessment-results";

export type LiverResultTier = OrganResultTier;
export type LiverDriver = OrganDriver;

export const LIVER_RESULT_HEADLINES: Record<LiverResultTier, string> = {
  high: "Your answers suggest your liver deserves a closer look.",
  moderate: "A few things are worth checking.",
  low: "Your liver risk looks low. Here's how to keep it that way.",
};

export const LIVER_BLOOD_MARKERS = [
  "ALT",
  "AST",
  "GGT",
  "HbA1c",
  "Insulin",
  "Triglycerides",
  "HDL",
] as const;

export const LIVER_RESULT_DISCLAIMER =
  "This check looks at common risk factors. It can't tell you whether you have fatty liver. Only a blood test or scan can.";

const DRIVER_COPY = {
  waist: {
    title: "Belly fat",
    body: "Fat around the middle is closely linked to fat in the liver.",
  },
  diabetes: {
    title: "Pre-diabetes or diabetes",
    body: "Blood sugar problems are one of the strongest risk factors for fatty liver.",
  },
  cholesterol: {
    title: "Cholesterol or triglycerides",
    body: "High blood fats often travel with fat in the liver.",
  },
  alcohol: {
    title: "Alcohol 8+ drinks a week",
    body: "Your liver processes alcohol, so regular drinking adds to its load.",
  },
  bmi: {
    title: "BMI 25+",
    body: "Extra weight is the most common reason fat builds up in the liver.",
  },
} as const;

export const LIVER_DRIVER_TITLES = Object.values(DRIVER_COPY).map((item) => item.title);

export const LIVER_ASSESSMENT_UI: OrganAssessmentUiCopy = {
  organ: "liver",
  headlines: LIVER_RESULT_HEADLINES,
  markers: LIVER_BLOOD_MARKERS,
  disclaimer: LIVER_RESULT_DISCLAIMER,
  ctaLabel: "Check My Liver Risk",
  checkoutSource: "fatty_liver",
  checkoutButton: "liver_quiz_result",
  consentOrgan: "liver",
  apiPath: "/api/public/liver-assessment-results",
  leadContentName: "Liver assessment email results",
};

/** Same cut-offs as before. Elevated and high both show as High. */
export function liverDisplayTier(score: number): LiverResultTier {
  if (score <= 8) return "low";
  if (score <= 16) return "moderate";
  return "high";
}

export function liverDriversFromAnswers(
  answers: Record<string, number>,
  bmi: number | null
): LiverDriver[] {
  const candidates: LiverDriver[] = [];

  const waist = answers.waist ?? 0;
  if (waist > 0) candidates.push({ id: "waist", points: waist, ...DRIVER_COPY.waist });

  const diabetes = answers.diabetes ?? 0;
  if (diabetes > 0) candidates.push({ id: "diabetes", points: diabetes, ...DRIVER_COPY.diabetes });

  const cholesterol = answers.cholesterol ?? 0;
  if (cholesterol > 0) {
    candidates.push({ id: "cholesterol", points: cholesterol, ...DRIVER_COPY.cholesterol });
  }

  const alcohol = answers.alcohol ?? 0;
  if (alcohol >= 3) candidates.push({ id: "alcohol", points: alcohol, ...DRIVER_COPY.alcohol });

  if (bmi !== null && bmi >= 25) {
    const points = answers.bmi ?? (bmi < 30 ? 2 : bmi < 35 ? 4 : 6);
    candidates.push({ id: "bmi", points, ...DRIVER_COPY.bmi });
  }

  return pickTopDrivers(candidates);
}

export function isLiverResultTier(value: unknown): value is LiverResultTier {
  return value === "low" || value === "moderate" || value === "high";
}

export function sanitizeLiverFirstName(value: unknown): string | null {
  return sanitizeAssessmentFirstName(value);
}

export function sanitizeLiverDrivers(value: unknown): string[] {
  return sanitizeOrganDrivers(value, LIVER_DRIVER_TITLES);
}
