import {
  filterMetabolicConditionsForGender,
  filterSeriousConditionsForGender,
  type QuizGender,
} from "@/lib/quiz-gender-filters";

export const WM_CLINICAL_NONE = "None of these apply";
export const WM_CLINICAL_NONE_MEDS = "None of the above";

export const WM_CLINICAL_ASSESSMENT_SOURCE = "wm_clinical_assessment";

export type WeightManagementClinicalAnswers = {
  metabolicConditions: string[];
  digestiveConditions: string[];
  cardiovascularConditions: string[];
  mentalHealthConditions: string[];
  seriousConditions: string[];
  currentMedications: string[];
};

export type WeightManagementClinicalQuestionId = keyof WeightManagementClinicalAnswers;

export type WeightManagementClinicalQuestion = {
  id: WeightManagementClinicalQuestionId;
  prompt: string;
  subtitle: string;
  noneValue: string;
  options: readonly string[];
};

export const WM_METABOLIC_CONDITIONS = [
  "High blood sugar",
  "Insulin resistance",
  "Type 2 diabetes",
  "Prediabetes",
  "Polycystic ovary syndrome (PCOS)",
  "Thyroid issues (hyper or hypothyroidism)",
  WM_CLINICAL_NONE,
] as const;

export const WM_DIGESTIVE_CONDITIONS = [
  "Fatty liver disease",
  "Reflux (GORD / heartburn)",
  "Irritable bowel syndrome (IBS)",
  "Crohn's disease",
  "Ulcerative colitis",
  "Gastroparesis (slow stomach emptying)",
  "Previous bowel or stomach surgery",
  "Gallstones or gallbladder removal",
  WM_CLINICAL_NONE,
] as const;

export const WM_CARDIOVASCULAR_CONDITIONS = [
  "High blood pressure",
  "High cholesterol",
  "High triglycerides",
  "Heart disease or angina",
  "Previous heart attack",
  "Heart failure",
  "Irregular heartbeat (arrhythmia)",
  "History of stroke",
  WM_CLINICAL_NONE,
] as const;

export const WM_MENTAL_HEALTH_CONDITIONS = [
  "Depression",
  "Anxiety disorder",
  "Binge eating disorder",
  "History of anorexia or bulimia",
  "Taking psychiatric medications",
  WM_CLINICAL_NONE,
] as const;

export const WM_SERIOUS_CONDITIONS = [
  "Pancreatitis (current or history)",
  "Medullary thyroid cancer (personal or family)",
  "Multiple endocrine neoplasia type 2 (MEN2)",
  "Chronic kidney disease (eGFR < 30)",
  "Severe liver disease (cirrhosis)",
  "Active cancer treatment",
  "Pregnancy or actively trying",
  "Currently breastfeeding",
  WM_CLINICAL_NONE,
] as const;

export const WM_CURRENT_MEDICATIONS = [
  "Insulin",
  "Metformin or other diabetes medications",
  "Blood pressure medications",
  "Blood thinners (warfarin, etc.)",
  "Thyroid medications",
  "Antidepressants",
  "Anti-anxiety medications",
  "Steroids (prednisolone, etc.)",
  WM_CLINICAL_NONE_MEDS,
] as const;

const CLINICAL_FIELDS: WeightManagementClinicalQuestionId[] = [
  "metabolicConditions",
  "digestiveConditions",
  "cardiovascularConditions",
  "mentalHealthConditions",
  "seriousConditions",
  "currentMedications",
];

export const WM_CLINICAL_QUESTIONS: WeightManagementClinicalQuestion[] = [
  {
    id: "metabolicConditions",
    prompt: "Do you have any metabolic conditions?",
    subtitle: "These help your doctor understand your metabolic health profile.",
    noneValue: WM_CLINICAL_NONE,
    options: WM_METABOLIC_CONDITIONS,
  },
  {
    id: "digestiveConditions",
    prompt: "Any digestive or gastrointestinal conditions?",
    subtitle: "These help your doctor assess your full health picture.",
    noneValue: WM_CLINICAL_NONE,
    options: WM_DIGESTIVE_CONDITIONS,
  },
  {
    id: "cardiovascularConditions",
    prompt: "Any heart or cardiovascular conditions?",
    subtitle: "Weight loss can significantly improve heart health.",
    noneValue: WM_CLINICAL_NONE,
    options: WM_CARDIOVASCULAR_CONDITIONS,
  },
  {
    id: "mentalHealthConditions",
    prompt: "Any mental health conditions we should know about?",
    subtitle: "Your mental wellbeing is important to us.",
    noneValue: WM_CLINICAL_NONE,
    options: WM_MENTAL_HEALTH_CONDITIONS,
  },
  {
    id: "seriousConditions",
    prompt: "Have you ever been diagnosed with any of these?",
    subtitle: "These conditions may affect program eligibility.",
    noneValue: WM_CLINICAL_NONE,
    options: WM_SERIOUS_CONDITIONS,
  },
  {
    id: "currentMedications",
    prompt: "Are you currently taking any of these medications?",
    subtitle: "Some medications may affect your care plan options.",
    noneValue: WM_CLINICAL_NONE_MEDS,
    options: WM_CURRENT_MEDICATIONS,
  },
];

export function getWeightManagementClinicalQuestions(
  gender?: QuizGender | null
): WeightManagementClinicalQuestion[] {
  const quizGender: QuizGender =
    gender === "male" || gender === "female" ? gender : "";
  return WM_CLINICAL_QUESTIONS.map((question) => {
    if (question.id === "metabolicConditions") {
      return { ...question, options: filterMetabolicConditionsForGender(question.options, quizGender) };
    }
    if (question.id === "seriousConditions") {
      return { ...question, options: filterSeriousConditionsForGender(question.options, quizGender) };
    }
    return question;
  });
}

export function emptyWeightManagementClinicalAnswers(): WeightManagementClinicalAnswers {
  return {
    metabolicConditions: [],
    digestiveConditions: [],
    cardiovascularConditions: [],
    mentalHealthConditions: [],
    seriousConditions: [],
    currentMedications: [],
  };
}

export function toggleClinicalExclusiveOption(
  current: string[],
  value: string,
  noneValue: string
): string[] {
  if (value === noneValue) {
    return current.includes(value) ? [] : [value];
  }
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current.filter((item) => item !== noneValue), value];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function readClinicalAnswersFromIntake(
  quizData: Record<string, unknown> | null | undefined
): WeightManagementClinicalAnswers {
  const data = quizData ?? {};
  return {
    metabolicConditions: asStringArray(data.metabolicConditions),
    digestiveConditions: asStringArray(data.digestiveConditions),
    cardiovascularConditions: asStringArray(data.cardiovascularConditions),
    mentalHealthConditions: asStringArray(data.mentalHealthConditions),
    seriousConditions: asStringArray(data.seriousConditions),
    currentMedications: asStringArray(data.currentMedications),
  };
}

export function isWeightManagementClinicalHistoryComplete(
  quizData: Record<string, unknown> | null | undefined
): boolean {
  if (quizData?.clinicalHistoryCompletedAt) return true;
  const answers = readClinicalAnswersFromIntake(quizData);
  return CLINICAL_FIELDS.every((field) => answers[field].length > 0);
}

export function isWeightManagementClinicalHistoryDeferred(
  quizData: Record<string, unknown> | null | undefined
): boolean {
  return Boolean(quizData?.clinicalHistoryDeferredAt) && !isWeightManagementClinicalHistoryComplete(quizData);
}

export type WeightManagementClinicalStatus = "needed" | "deferred" | "complete";

export function resolveWeightManagementClinicalStatus(
  quizData: Record<string, unknown> | null | undefined
): WeightManagementClinicalStatus {
  if (isWeightManagementClinicalHistoryComplete(quizData)) return "complete";
  if (isWeightManagementClinicalHistoryDeferred(quizData)) return "deferred";
  return "needed";
}

export function areClinicalAnswersComplete(
  answers: WeightManagementClinicalAnswers
): boolean {
  return CLINICAL_FIELDS.every((field) => answers[field].length > 0);
}
