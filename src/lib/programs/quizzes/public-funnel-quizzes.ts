/**
 * In-portal quiz steps aligned with public assessment funnels.
 * Clinical questions only, no PII, payment, or booking steps.
 */

import type { ProgramKey } from "@/lib/membership/keys";
import { SEXUAL_HEALTH_QUIZ_TAIL, type QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

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
  options: SEXUAL_HEALTH_QUIZ_TAIL[0].options,
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

function hairStageStep(gender?: string | null): QuizStep {
  const isFemale = (gender || "").toLowerCase() === "female";
  return {
    id: "hairStage",
    prompt: isFemale ? "How would you describe your hair thinning?" : "How would you describe your hair loss?",
    subtitle: isFemale ? "Based on the Ludwig scale" : "Based on the Norwood scale",
    options: isFemale
      ? opts([
          { id: "not-sure", label: "I'm not sure yet", description: "We'll help you identify it" },
          { id: "type-1", label: "Early thinning", description: "Part line slightly wider than before" },
          { id: "type-2", label: "Noticeable thinning", description: "Scalp visible through hair" },
          { id: "type-3", label: "Significant thinning", description: "Widespread visibility on crown" },
        ])
      : opts([
          { id: "not-sure", label: "I'm not sure yet", description: "We'll help figure it out" },
          { id: "stage-1", label: "Early signs", description: "Hairline starting to shift slightly" },
          { id: "stage-2", label: "Noticeable recession", description: "Temples becoming more visible" },
          { id: "stage-3", label: "Moderate recession", description: "Clear M-shaped hairline forming" },
          { id: "stage-4", label: "Crown thinning", description: "Top of head showing through" },
        ]),
  };
}

function getHairQuiz(gender?: string | null): QuizStep[] {
  return [
    hairStageStep(gender),
    {
      id: "hairLossTimeline",
      prompt: "When did you first notice hair changes?",
      options: labels([
        "Just in the last few months",
        "Gradually over the past year",
        "Sudden patches appearing",
        "Rapid loss recently",
        "Slowly over many years",
      ]),
    },
    {
      id: "familyHistory",
      prompt: "Is there a family history of hair loss?",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
        { id: "unsure", label: "I'm not sure" },
      ],
    },
    PREVIOUS_TREATMENT,
    START_TIMING,
  ];
}

// ─── Men's Vitality (from /mens-health/assessment energy path) ─────────────

const MENS_VITALITY_QUIZ: QuizStep[] = [
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
  START_TIMING,
];

// ─── Women's Vitality (from /womens-health/assessment) ─────────────────────

const WOMENS_VITALITY_QUIZ: QuizStep[] = [
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

export function getPublicFunnelQuizSteps(
  programKey: ProgramKey,
  gender?: string | null
): QuizStep[] | null {
  switch (programKey) {
    case "WEIGHT_MANAGEMENT":
      return WEIGHT_QUIZ;
    case "HAIR_LOSS":
      return getHairQuiz(gender);
    case "MENS_HEALTH_VITALITY":
      return MENS_VITALITY_QUIZ;
    case "WOMENS_HEALTH_VITALITY":
      return WOMENS_VITALITY_QUIZ;
    default:
      return null;
  }
}
