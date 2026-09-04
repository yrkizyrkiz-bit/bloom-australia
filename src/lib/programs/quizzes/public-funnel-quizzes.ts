/**
 * In-portal quiz steps aligned with public assessment funnels.
 * Clinical questions only, no PII, payment, or booking steps.
 */

import type { ProgramKey } from "@/lib/membership/keys";
import { SEXUAL_HEALTH_PREVIOUS_TREATMENT, type QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";
import {
  HAIR_FEMALE_STAGES,
  HAIR_MALE_STAGES,
  HAIR_MEDICAL_CONDITIONS,
  HAIR_OTHER_CONCERNS,
  hairOptionsForSex,
  resolveHairQuizSex,
} from "@/lib/programs/quizzes/hair-assessment-options";

function opts(items: Array<{ id: string; label: string; description?: string }>) {
  return items;
}

function labels(items: string[], prefix = "opt"): QuizStep["options"] {
  return items.map((label, i) => ({ id: `${prefix}-${i}`, label }));
}

const START_TIMING: QuizStep = {
  id: "startTiming",
  prompt: "How soon would you like to speak with a doctor?",
  options: [
    { id: "asap", label: "As soon as possible" },
    { id: "this-week", label: "Within the next week" },
    { id: "exploring", label: "I'm exploring options for now" },
  ],
};

const PREVIOUS_TREATMENT: QuizStep = {
  id: "previousTreatment",
  prompt: "Have you tried treatment for this before?",
  options: SEXUAL_HEALTH_PREVIOUS_TREATMENT.options,
};

// ─── Weight Management (from /weight-management/assessment) ─────────────────

const WEIGHT_QUIZ: QuizStep[] = [
  {
    id: "weightLossGoal",
    prompt: "How much weight are you looking to lose?",
    options: opts([
      { id: "1-10", label: "A little (under 10 kg)" },
      { id: "10-25", label: "A moderate amount (10–25 kg)" },
      { id: "25+", label: "A significant amount (25+ kg)" },
      { id: "unsure", label: "I'm not sure yet" },
    ]),
  },
  {
    id: "motivation",
    prompt: "What's your main motivation?",
    options: opts([
      { id: "health", label: "Improve overall health" },
      { id: "energy", label: "Have more energy" },
      { id: "mobility", label: "Move more easily" },
      { id: "confidence", label: "Feel more confident" },
      { id: "chronic", label: "Manage a chronic condition" },
      { id: "longevity", label: "Live longer for family" },
    ]),
  },
  {
    id: "previousAttempt",
    prompt: "Have you tried to lose weight before?",
    options: labels([
      "Calorie counting / tracking apps",
      "Keto or low-carb diets",
      "Exercise programs",
      "Previous prescription medications",
      "None, this is my first attempt",
    ]),
  },
  {
    id: "metabolicConditions",
    prompt: "Do any of these metabolic conditions apply to you?",
    subtitle: "Select the closest match. Your doctor will review in full.",
    options: labels([
      "High blood sugar or insulin resistance",
      "Type 2 diabetes or prediabetes",
      "PCOS",
      "Thyroid issues",
      "None of these apply",
    ]),
  },
  PREVIOUS_TREATMENT,
  START_TIMING,
];

// ─── Hair (from /hair-assessment) ───────────────────────────────────────────

function hairStageStep(sex: "male" | "female" | ""): QuizStep {
  const isFemale = sex === "female";
  const stages = isFemale ? HAIR_FEMALE_STAGES : HAIR_MALE_STAGES;
  return {
    id: "hairStage",
    prompt: "How would you describe your hair right now?",
    subtitle: isFemale ? "Based on the Ludwig scale" : "Based on the Norwood scale",
    options: stages.map((stage) => ({
      id: stage.id || stage.label,
      label: stage.label,
      description: stage.description,
    })),
  };
}

function getHairQuiz(gender?: string | null, answers?: Record<string, unknown>): QuizStep[] {
  const sex = resolveHairQuizSex(gender, answers);
  const isFemale = sex === "female";
  const steps: QuizStep[] = [
    {
      id: "gender",
      prompt: "What's your biological sex?",
      options: [
        { id: "male", label: "Male" },
        { id: "female", label: "Female" },
      ],
    },
    hairStageStep(sex),
    {
      id: "hairLossTimeline",
      prompt: "When did you start noticing changes?",
      options: [
        { id: "Just in the last few months", label: "Just in the last few months" },
        { id: "Gradually over the past year", label: "Gradually over the past year" },
        { id: "Sudden patches appearing", label: "Sudden patches appearing" },
        { id: "Rapid loss recently", label: "Rapid loss recently" },
        { id: "Slowly over many years", label: "Slowly over many years" },
      ],
    },
    {
      id: "familyHistory",
      prompt: "Any hair loss in your family?",
      options: [
        { id: "yes", label: "Yes, on one or both sides" },
        { id: "no", label: "No, not that I know of" },
        { id: "unsure", label: "I'm not really sure" },
        { id: "Yes", label: "Yes, on one or both sides" },
        { id: "No", label: "No, not that I know of" },
        { id: "Unsure", label: "I'm not really sure" },
      ],
    },
    {
      id: "medicalConditions",
      prompt: "Any health conditions we should know about?",
      options: hairOptionsForSex(HAIR_MEDICAL_CONDITIONS, sex).map((condition) => ({
        id: condition.label,
        label: condition.label,
      })),
    },
  ];

  if (isFemale) {
    steps.push({
      id: "pregnancyStatus",
      prompt: "Are you currently pregnant or planning to be?",
      options: [
        { id: "No", label: "No, neither" },
        { id: "Yes", label: "Yes, one or both" },
        { id: "Maybe", label: "Possibly" },
      ],
    });
  }

  steps.push({
    id: "otherConcerns",
    prompt: "Anything else on your health radar?",
    options: hairOptionsForSex(HAIR_OTHER_CONCERNS, sex).map((concern) => ({
      id: concern.label,
      label: concern.label,
    })),
  });

  return steps;
}

// ─── Men's Vitality (from /mens-health/assessment energy path) ─────────────

const MENS_VITALITY_PORTAL_QUIZ: QuizStep[] = [
  {
    id: "symptomDuration",
    prompt: "How long have you noticed changes in your energy or vitality?",
    options: opts([
      { id: "less-3-months", label: "Less than 3 months", description: "A recent change in energy, drive, or recovery" },
      { id: "3-6-months", label: "3 to 6 months", description: "Noticeable for a few months now" },
      { id: "6-12-months", label: "6 to 12 months", description: "Ongoing for most of the year" },
      { id: "more-2-years", label: "More than 2 years", description: "Long-standing energy or vitality concerns" },
    ]),
  },
  {
    id: "severity",
    prompt: "How would you describe the severity?",
    options: opts([
      { id: "mild", label: "Mild", description: "Some tiredness or lower motivation, but mostly manageable" },
      { id: "moderate", label: "Moderate", description: "Regular fatigue, low drive, or slower recovery" },
      { id: "severe", label: "Severe", description: "Persistent symptoms affecting work, training, mood, or daily life" },
    ]),
  },
  {
    id: "mainConcern",
    prompt: "What best describes what you're experiencing?",
    options: opts([
      { id: "fatigue", label: "Low energy or fatigue", description: "Feeling tired, flat, or run down more often" },
      { id: "motivation", label: "Low motivation or drive", description: "Harder to feel switched on or productive" },
      { id: "recovery", label: "Poor recovery or reduced strength", description: "Training or stress takes longer to recover from" },
      { id: "libido", label: "Lower libido or confidence", description: "Reduced interest, confidence, or vitality" },
      { id: "mixed", label: "A mix of these", description: "Several areas are affected" },
    ]),
  },
  {
    id: "contributor",
    prompt: "What do you think might be contributing?",
    options: labels([
      "Stress or anxiety",
      "Poor sleep",
      "Hormones or low testosterone",
      "Nutrition or vitamin deficiency",
      "Weight or metabolic health",
      "I'm not sure",
    ]),
  },
  PREVIOUS_TREATMENT,
];

const MENS_VITALITY_PUBLIC_QUIZ: QuizStep[] = [
  {
    id: "edDuration",
    prompt: "How long have you noticed changes in your energy or vitality?",
    options: opts([
      { id: "less-3-months", label: "Less than 3 months" },
      { id: "3-6-months", label: "3 to 6 months" },
      { id: "6-12-months", label: "6 to 12 months" },
      { id: "1-2-years", label: "1 to 2 years" },
      { id: "more-2-years", label: "More than 2 years" },
    ]),
  },
  {
    id: "edSeverity",
    prompt: "How much is this affecting you?",
    options: opts([
      { id: "mild", label: "Mild" },
      { id: "moderate", label: "Moderate" },
      { id: "severe", label: "Severe" },
    ]),
  },
  {
    id: "erectionDifficulty",
    prompt: "What best describes what you're experiencing?",
    options: opts([
      { id: "fatigue", label: "Low energy or fatigue" },
      { id: "motivation", label: "Low motivation or drive" },
      { id: "recovery", label: "Poor recovery or reduced strength" },
      { id: "libido", label: "Lower libido or confidence" },
      { id: "mixed", label: "A mix of these" },
    ]),
  },
  {
    id: "morningErections",
    prompt: "When is your energy usually lowest?",
    options: opts([
      { id: "morning-low", label: "Low from the moment I wake up" },
      { id: "afternoon-crash", label: "Afternoon crash" },
      { id: "variable", label: "It varies day to day" },
      { id: "sleep-dependent", label: "Mostly linked to sleep" },
      { id: "not-sure", label: "I'm not sure" },
    ]),
  },
  {
    id: "edCauses",
    prompt: "What do you think might be contributing?",
    options: labels([
      "Stress or anxiety",
      "Burnout or high workload",
      "Poor sleep or waking unrefreshed",
      "Depression or low mood",
      "Hormones or low testosterone",
      "Nutrition or vitamin deficiency",
      "Weight, blood sugar, or metabolic health",
      "Side effect of medication",
      "I'm not sure",
    ]),
  },
  {
    id: "medicalConditions",
    prompt: "Do you have any of these conditions?",
    options: labels([
      "Heart disease or heart condition",
      "High blood pressure",
      "Diabetes (Type 1 or 2)",
      "High cholesterol",
      "Thyroid condition",
      "Sleep apnoea or heavy snoring",
      "Low iron, anaemia, or B12 deficiency",
      "Previously low testosterone",
      "Anxiety, depression, or chronic stress",
      "Previous stroke or major cardiovascular event",
      "None of these apply to me",
    ]),
  },
  {
    id: "takingNitrates",
    prompt: "Are you taking regular medications?",
    options: opts([
      { id: "no", label: "No regular medications" },
      { id: "yes", label: "Yes, I take regular medication" },
      { id: "not-sure", label: "I'm not sure" },
    ]),
  },
  {
    id: "lifestyleFactors",
    prompt: "Any lifestyle factors we should know about?",
    options: labels([
      "I smoke or vape",
      "I drink alcohol regularly (10+ drinks/week)",
      "I don't sleep well",
      "I'm not very physically active",
      "I train hard but don't recover well",
      "I'm overweight",
      "I'm under ongoing stress",
      "My meals or nutrition are inconsistent",
      "None of these apply",
    ]),
  },
  {
    id: "previousTreatment",
    prompt: "Have you tried anything for energy or vitality before?",
    options: opts([
      { id: "blood-tests", label: "Blood tests or hormone testing" },
      { id: "supplements", label: "Vitamins, minerals, or supplements" },
      { id: "sleep-support", label: "Sleep support or sleep apnoea review" },
      { id: "fitness-nutrition", label: "Exercise, nutrition, or weight-loss plan" },
      { id: "prescription", label: "Prescription medication or hormone treatment" },
      { id: "none", label: "No, I haven't tried anything yet" },
    ]),
  },
  {
    id: "treatmentGoal",
    prompt: "What's your main goal?",
    options: opts([
      { id: "energy", label: "Improve daily energy" },
      { id: "focus", label: "Improve focus and mental clarity" },
      { id: "strength", label: "Improve strength and recovery" },
      { id: "libido", label: "Improve libido and confidence" },
      { id: "root-cause", label: "Find the root cause" },
    ]),
  },
  {
    id: "otherConcerns",
    prompt: "While we're here, is there anything else you would like support with?",
    options: opts([
      { id: "hair-loss", label: "Hair Loss" },
      { id: "weight", label: "Weight Management" },
      { id: "sexual-health", label: "Sexual Health" },
      { id: "energy", label: "Energy & Vitality" },
      { id: "none", label: "No, I'm only interested in this pathway" },
    ]),
  },
];

function getMensVitalityQuiz(answers?: Record<string, unknown>): QuizStep[] {
  if (
    answers &&
    (answers.edDuration || answers.erectionDifficulty || answers.morningErections || answers.edCauses)
  ) {
    return MENS_VITALITY_PUBLIC_QUIZ;
  }
  return MENS_VITALITY_PORTAL_QUIZ;
}

// ─── Women's Health (from /womens-health/assessment) ────────────────────────

const WOMENS_PUBLIC_ASSESSMENT_QUIZ: QuizStep[] = [
  {
    id: "category",
    prompt: "What brings you here today?",
    options: opts([
      { id: "menopause", label: "Menopause & Perimenopause" },
      { id: "hrt", label: "Hormone Replacement Therapy" },
      { id: "contraception", label: "Contraception" },
      { id: "fertility", label: "Fertility & Hormonal Health" },
      { id: "sexual", label: "Sexual Health & Intimacy" },
      { id: "unsure", label: "Not sure where to start" },
    ]),
  },
  {
    id: "primaryConcerns",
    prompt: "What are your main concerns?",
    options: labels([
      "Hot flushes",
      "Night sweats",
      "Sleep disturbances",
      "Mood changes",
      "Brain fog",
      "Vaginal dryness",
      "Low libido",
      "Weight gain",
      "Joint pain",
      "Fatigue",
      "Starting HRT",
      "Reviewing current HRT",
      "Adjusting dosage",
      "Switching HRT type",
      "Managing side effects",
      "HRT safety questions",
      "Starting contraception",
      "Changing method",
      "Side effects",
      "Emergency contraception",
      "Post-pregnancy",
      "Long-acting options",
      "Irregular periods",
      "PCOS symptoms",
      "Trying to conceive",
      "Preconception health",
      "Hormonal imbalance",
      "Endometriosis",
      "Low libido or reduced desire",
      "Discomfort or pain with intimacy",
      "Desire or arousal changes",
      "Menopause-related sexual changes",
      "Vaginal dryness affecting intimacy",
      "Other intimacy concerns",
      "Hormonal concerns",
      "Menstrual issues",
      "Pelvic pain",
      "Breast health",
      "Fatigue or low energy",
      "Mood or sleep",
      "Other",
    ]),
  },
  {
    id: "symptomDuration",
    prompt: "How long have you had these concerns?",
    options: labels([
      "Less than 1 month",
      "1-3 months",
      "3-6 months",
      "6-12 months",
      "More than 1 year",
      "Several years",
    ]),
  },
  {
    id: "currentTreatments",
    prompt: "Current treatments?",
    options: labels([
      "HRT (patches, gel, tablets)",
      "Oral contraceptive",
      "Hormonal IUD",
      "Antidepressants",
      "Supplements",
      "Other medication",
      "No current treatment",
    ]),
  },
  {
    id: "medicalConditions",
    prompt: "Any of these conditions?",
    options: labels([
      "High blood pressure",
      "Diabetes",
      "Blood clotting disorder",
      "Breast cancer history",
      "Ovarian cancer history",
      "Heart disease",
      "Stroke",
      "Liver disease",
      "Migraines with aura",
      "Endometriosis",
      "Fibroids",
      "PCOS",
      "Thyroid condition",
      "None of these",
    ]),
  },
  {
    id: "menstrualStatus",
    prompt: "Your menstrual status?",
    options: labels([
      "Regular periods",
      "Irregular periods",
      "Menopause (stopped)",
      "Perimenopause",
      "No periods (contraception)",
      "Post-hysterectomy",
      "Menopause (periods stopped)",
    ]),
  },
  {
    id: "familyHistory",
    prompt: "Family history?",
    options: labels([
      "Breast cancer",
      "Ovarian cancer",
      "Blood clots",
      "Early heart disease",
      "Early stroke",
      "Osteoporosis",
      "None of these",
    ]),
  },
  {
    id: "goals",
    prompt: "What are your goals?",
    options: opts([
      { id: "symptoms", label: "Relieve symptoms" },
      { id: "understand", label: "Understand options" },
      { id: "start", label: "Start treatment" },
      { id: "review", label: "Review treatment" },
      { id: "prevention", label: "Preventive health" },
      { id: "fertility", label: "Optimise fertility" },
    ]),
  },
];

const WOMENS_VITALITY_PORTAL_QUIZ: QuizStep[] = [
  {
    id: "primaryConcern",
    prompt: "What's your main concern right now?",
    options: labels([
      "Fatigue or low energy",
      "Low libido",
      "Mood changes or brain fog",
      "Sleep disturbances",
      "Weight gain",
      "Hot flushes or hormonal shifts",
    ]),
  },
  {
    id: "symptomDuration",
    prompt: "How long have you had these symptoms?",
    options: labels([
      "Less than 1 month",
      "1–3 months",
      "3–6 months",
      "6–12 months",
      "More than 1 year",
    ]),
  },
  {
    id: "menstrualStatus",
    prompt: "Which best describes your menstrual status?",
    options: labels([
      "Regular periods",
      "Irregular periods",
      "Perimenopause",
      "Menopause (periods stopped)",
      "No periods (contraception or other)",
    ]),
  },
  {
    id: "goal",
    prompt: "What would you like to get from this program?",
    options: opts([
      { id: "symptoms", label: "Relieve symptoms" },
      { id: "understand", label: "Understand my options" },
      { id: "start", label: "Start treatment" },
      { id: "review", label: "Review current treatment" },
      { id: "prevention", label: "Preventive health" },
    ]),
  },
  PREVIOUS_TREATMENT,
  START_TIMING,
];

function getWomensVitalityQuiz(answers?: Record<string, unknown>): QuizStep[] {
  if (
    answers &&
    (answers.category ||
      (Array.isArray(answers.primaryConcerns) && answers.primaryConcerns.length > 0) ||
      (Array.isArray(answers.goals) && answers.goals.length > 0) ||
      (Array.isArray(answers.currentTreatments) && answers.currentTreatments.length > 0))
  ) {
    return WOMENS_PUBLIC_ASSESSMENT_QUIZ;
  }
  return WOMENS_VITALITY_PORTAL_QUIZ;
}

export function getPublicFunnelQuizSteps(
  programKey: ProgramKey,
  gender?: string | null,
  answers?: Record<string, unknown>
): QuizStep[] | null {
  switch (programKey) {
    case "WEIGHT_MANAGEMENT":
      return WEIGHT_QUIZ;
    case "HAIR_LOSS":
      return getHairQuiz(gender, answers);
    case "MENS_HEALTH_VITALITY":
      return getMensVitalityQuiz(answers);
    case "WOMENS_HEALTH_VITALITY":
      return getWomensVitalityQuiz(answers);
    default:
      return null;
  }
}
