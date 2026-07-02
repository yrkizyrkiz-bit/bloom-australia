/**
 * Get My Biomarkers — clinical intake quiz.
 *
 * One high-yield question per health category (6 organ/system areas + intro).
 * Answers map to Medicare-eligible indications and private panel gaps for
 * doctor review — kept short to protect lead conversion.
 */

import type { QuizOption, QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";

export type BiomarkersSectionId =
  | "intro"
  | "heart"
  | "metabolic"
  | "thyroid"
  | "hormones"
  | "liver"
  | "kidney"
  | "nutrients";

export type BiomarkersQuizQuestion = QuizStep & {
  sectionId: BiomarkersSectionId;
  sectionTitle: string;
  sectionDescription: string;
  /** When true, members may select more than one option (stored comma-separated). */
  allowMultiple?: boolean;
  /** Internal flags triggered by each option id */
  optionFlags: Record<string, string[]>;
};

export const BIOMARKERS_MULTI_ANSWER_SEPARATOR = ",";

export function parseBiomarkersAnswer(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(BIOMARKERS_MULTI_ANSWER_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatBiomarkersAnswer(optionIds: string[]): string {
  return [...new Set(optionIds.filter(Boolean))].join(BIOMARKERS_MULTI_ANSWER_SEPARATOR);
}

export function isBiomarkersQuestionAnswered(
  question: BiomarkersQuizQuestion,
  value: string | undefined
): boolean {
  if (question.allowMultiple) {
    return parseBiomarkersAnswer(value).length > 0;
  }
  return Boolean(value?.trim());
}

export function toggleBiomarkersMultiAnswer(
  currentValue: string | undefined,
  optionId: string
): string {
  const selected = parseBiomarkersAnswer(currentValue);
  if (optionId === "none") {
    return selected.includes("none") ? "" : "none";
  }

  const withoutNone = selected.filter((id) => id !== "none");
  const next = withoutNone.includes(optionId)
    ? withoutNone.filter((id) => id !== optionId)
    : [...withoutNone, optionId];
  return formatBiomarkersAnswer(next);
}

export type CategoryRecommendation = {
  sectionId: BiomarkersSectionId;
  categoryName: string;
  priority: "high" | "routine";
  suggestedTests: string[];
  clinicalIndications: string[];
  medicareNotes: string[];
};

export type BiomarkersQuizResult = {
  primaryGoal: string;
  sections: CategoryRecommendation[];
  suggestedPanel: "essential" | "extended" | "comprehensive";
  doctorSummary: string;
  hasMedicareEligibleIndications: boolean;
  clinicalSex?: string;
};

const SECTION_META: Record<
  BiomarkersSectionId,
  { title: string; description: string; categoryName: string }
> = {
  intro: {
    title: "About you",
    description: "A few quick questions so we can personalise your panel.",
    categoryName: "General",
  },
  heart: {
    title: "Heart & circulation",
    description: "Cholesterol, blood pressure, and related markers.",
    categoryName: "Heart Health",
  },
  metabolic: {
    title: "Blood sugar & weight",
    description: "Diabetes risk, weight around the middle, and energy.",
    categoryName: "Metabolic Panel",
  },
  thyroid: {
    title: "Thyroid & energy",
    description: "How your thyroid may affect weight, mood, and temperature.",
    categoryName: "Thyroid Function",
  },
  hormones: {
    title: "Hormones & wellbeing",
    description: "Periods, menopause, testosterone, stress, and related symptoms.",
    categoryName: "Hormone Health",
  },
  liver: {
    title: "Liver health",
    description: "Alcohol, medications, and symptoms that can affect the liver.",
    categoryName: "Liver Function",
  },
  kidney: {
    title: "Kidney health",
    description: "Blood pressure, diabetes, swelling, and urine changes.",
    categoryName: "Kidney Function",
  },
  nutrients: {
    title: "Vitamins, iron & inflammation",
    description: "Diet, tiredness, immunity, and joint discomfort.",
    categoryName: "Nutrients & Inflammation",
  },
};

function q(
  sectionId: BiomarkersSectionId,
  id: string,
  prompt: string,
  options: QuizOption[],
  optionFlags: Record<string, string[]>,
  subtitle?: string,
  allowMultiple = false
): BiomarkersQuizQuestion {
  const meta = SECTION_META[sectionId];
  return {
    id,
    sectionId,
    sectionTitle: meta.title,
    sectionDescription: meta.description,
    prompt,
    subtitle,
    options,
    optionFlags,
    allowMultiple,
  };
}

export type BiomarkersQuizGender = "female" | "male" | "neutral";

/** Resolve quiz gender from profile and/or in-quiz clinical sex answer. */
export function resolveBiomarkersQuizGender(
  profileGender?: string | null,
  answerOverride?: string | null
): BiomarkersQuizGender {
  const raw = (answerOverride || profileGender || "").toLowerCase();
  if (raw === "female" || raw === "f") return "female";
  if (raw === "male" || raw === "m") return "male";
  return "neutral";
}

export function needsClinicalSexQuestion(profileGender?: string | null): boolean {
  return resolveBiomarkersQuizGender(profileGender) === "neutral";
}

function metabolicQuestion(gender: BiomarkersQuizGender): BiomarkersQuizQuestion {
  const isFemale = gender === "female";
  return q(
    "metabolic",
    "metabolicRisk",
    "Do any of these relate to blood sugar, weight, or diabetes?",
    isFemale
      ? [
          { id: "diabetes-family", label: "Diabetes runs in my family" },
          { id: "weight-waist", label: "Weight gain around my middle, or hard to lose weight" },
          { id: "polydipsia", label: "Very thirsty, very hungry, or peeing much more than usual" },
          { id: "pcos", label: "PCOS, irregular periods, or weight/hormone issues" },
          { id: "gestational-diabetes", label: "Diabetes during pregnancy (or glucose problems when pregnant)" },
          { id: "none", label: "None of these" },
        ]
      : [
          { id: "diabetes-family", label: "Diabetes runs in my family" },
          { id: "weight-waist", label: "Weight gain around my middle, or hard to lose weight" },
          { id: "polydipsia", label: "Very thirsty, very hungry, or peeing much more than usual" },
          { id: "low-t-metabolic", label: "Low energy with less muscle or weight around my middle" },
          { id: "none", label: "None of these" },
        ],
    isFemale
      ? {
          "diabetes-family": ["metabolic-family", "hba1c-indicated"],
          "weight-waist": ["metabolic-syndrome", "hba1c-indicated", "insulin-indicated"],
          polydipsia: ["diabetes-symptoms", "hba1c-indicated", "glucose-indicated"],
          pcos: ["metabolic-pcos", "hba1c-indicated", "insulin-indicated", "hormone-panel-indicated"],
          "gestational-diabetes": ["metabolic-gdm", "hba1c-indicated", "glucose-indicated"],
          none: [],
        }
      : {
          "diabetes-family": ["metabolic-family", "hba1c-indicated"],
          "weight-waist": ["metabolic-syndrome", "hba1c-indicated", "insulin-indicated"],
          polydipsia: ["diabetes-symptoms", "hba1c-indicated", "glucose-indicated"],
          "low-t-metabolic": ["metabolic-androgen", "hba1c-indicated", "testosterone-indicated"],
          none: [],
        },
    "Select all that apply.",
    true
  );
}

function nutrientsQuestion(gender: BiomarkersQuizGender): BiomarkersQuizQuestion {
  const isFemale = gender === "female";
  return q(
    "nutrients",
    "nutrientsInflammation",
    "Do any of these sound like you?",
    isFemale
      ? [
          { id: "restricted-diet", label: "Vegan, vegetarian, or a very restricted diet" },
          { id: "fatigue-iron", label: "Often tired or short of breath (or heavy periods)" },
          { id: "pregnancy-nutrients", label: "Pregnant, breastfeeding, or planning a pregnancy" },
          { id: "frequent-illness", label: "Get sick often or take a long time to recover" },
          { id: "joint-pain", label: "Joint pain or aches without a clear cause" },
          { id: "none", label: "None of these" },
        ]
      : [
          { id: "restricted-diet", label: "Vegan, vegetarian, or a very restricted diet" },
          { id: "fatigue-iron", label: "Often tired or short of breath when active" },
          { id: "frequent-illness", label: "Get sick often or take a long time to recover" },
          { id: "joint-pain", label: "Joint pain or aches without a clear cause" },
          { id: "none", label: "None of these" },
        ],
    isFemale
      ? {
          "restricted-diet": ["nutrient-b12-d", "iron-studies-indicated"],
          "fatigue-iron": ["iron-deficiency", "iron-studies-indicated", "fbc-indicated"],
          "pregnancy-nutrients": ["nutrient-pregnancy", "iron-studies-indicated", "fbc-indicated"],
          "frequent-illness": ["inflammation-immune", "crp-indicated", "fbc-indicated"],
          "joint-pain": ["inflammation", "crp-indicated"],
          none: [],
        }
      : {
          "restricted-diet": ["nutrient-b12-d", "iron-studies-indicated"],
          "fatigue-iron": ["iron-deficiency", "iron-studies-indicated", "fbc-indicated"],
          "frequent-illness": ["inflammation-immune", "crp-indicated", "fbc-indicated"],
          "joint-pain": ["inflammation", "crp-indicated"],
          none: [],
        },
    "Select all that apply.",
    true
  );
}

function hormonesQuestion(gender: BiomarkersQuizGender): BiomarkersQuizQuestion {
  const isFemale = gender === "female";
  return q(
    "hormones",
    "hormoneConcerns",
    isFemale
      ? "Any concerns about your periods, menopause, or hormones?"
      : "Any concerns about testosterone, energy, or hormones?",
    isFemale ? womensHormoneOptions() : mensHormoneOptions(),
    isFemale
      ? {
          perimenopause: ["hormone-menopause", "hormone-panel-indicated"],
          "cycle-fertility": ["hormone-cycle", "hormone-panel-indicated"],
          "fatigue-mood": ["hormone-general", "hormone-panel-indicated"],
          none: [],
        }
      : {
          "low-t": ["hormone-androgen", "testosterone-indicated"],
          "mood-stress": ["hormone-cortisol", "hormone-panel-indicated"],
          none: [],
        },
    "Select all that apply.",
    true
  );
}

const CLINICAL_SEX_QUESTION = q(
  "intro",
  "clinicalSex",
  "Which sex were you assigned at birth?",
  [
    { id: "female", label: "Female", description: "We use female reference ranges for your results" },
    { id: "male", label: "Male", description: "We use male reference ranges for your results" },
  ],
  { female: [], male: [] },
  "This helps us compare your results to the right normal ranges."
);

function mensHormoneOptions(): QuizOption[] {
  return [
    { id: "low-t", label: "Low energy, sex drive, or strength", description: "May relate to testosterone levels" },
    { id: "mood-stress", label: "High stress, poor sleep, or mood changes", description: "May relate to stress hormones" },
    { id: "none", label: "None of these" },
  ];
}

function womensHormoneOptions(): QuizOption[] {
  return [
    { id: "perimenopause", label: "Hot flushes, night sweats, or sleep problems", description: "Common around menopause" },
    { id: "cycle-fertility", label: "Irregular periods or trying to conceive", description: "May relate to cycle hormones" },
    { id: "fatigue-mood", label: "Ongoing tiredness, low mood, or weight changes", description: "Can overlap with thyroid or hormones" },
    { id: "none", label: "None of these" },
  ];
}

function buildCoreQuestions(gender: BiomarkersQuizGender): BiomarkersQuizQuestion[] {
  return [
    q(
      "intro",
      "primaryGoal",
      "What’s the main reason you want blood tests?",
      [
        { id: "biological-age", label: "Understand my biological age", description: "How fast your body is ageing on the inside" },
        { id: "prevention", label: "General health check", description: "Stay on top of things before problems show up" },
        { id: "symptoms", label: "I have symptoms I want explained", description: "Something feels off and you want answers" },
        { id: "doctor-referred", label: "My doctor asked me to get tests", description: "Following up on your GP’s advice" },
      ],
      {
        "biological-age": ["goal-ageing"],
        prevention: ["goal-prevention"],
        symptoms: ["goal-symptoms"],
        "doctor-referred": ["goal-gp"],
      }
    ),
    q(
      "heart",
      "heartRisk",
      "Do any of these apply to your heart or circulation?",
      [
        { id: "family-cvd", label: "Heart attack or stroke in close family before age 60" },
        { id: "hypertension", label: "High blood pressure (diagnosed or on medication)" },
        { id: "known-lipids", label: "Told I have high cholesterol or triglycerides before" },
        { id: "smoker", label: "I smoke, or quit within the last few years" },
        { id: "none", label: "None of these" },
      ],
      {
        "family-cvd": ["cvd-family", "lipids-indicated"],
        hypertension: ["cvd-hypertension", "lipids-indicated"],
        "known-lipids": ["cvd-dyslipidaemia", "lipids-indicated"],
        smoker: ["cvd-smoking", "lipids-indicated"],
        none: [],
      },
      "Select all that apply.",
      true
    ),
    metabolicQuestion(gender),
    q(
      "thyroid",
      "thyroidSymptoms",
      "Have you noticed any of these?",
      [
        { id: "fatigue-weight", label: "Unexplained tiredness with weight going up or down" },
        { id: "temperature", label: "Often feel unusually cold or hot compared to others" },
        { id: "palpitations", label: "Heart racing, shaky hands, or feeling very anxious" },
        { id: "hair-skin", label: "Hair thinning, dry skin, or constipation" },
        { id: "none", label: "None of these" },
      ],
      {
        "fatigue-weight": ["thyroid-symptoms", "tsh-indicated"],
        temperature: ["thyroid-symptoms", "tsh-indicated"],
        palpitations: ["thyroid-hyper", "tsh-indicated", "tft-indicated"],
        "hair-skin": ["thyroid-hypo", "tsh-indicated"],
        none: [],
      },
      "These can sometimes relate to your thyroid — select all that apply.",
      true
    ),
    hormonesQuestion(gender),
    q(
      "liver",
      "liverRisk",
      "Do any of these apply to your liver?",
      [
        { id: "alcohol", label: "I drink more alcohol than health guidelines suggest" },
        { id: "fatty-liver", label: "Diagnosed fatty liver, or told I have fat in my liver" },
        { id: "meds", label: "I take regular medication long-term (including over-the-counter)" },
        { id: "jaundice", label: "Yellow skin/eyes, or pain under ribs on the right side" },
        { id: "none", label: "None of these" },
      ],
      {
        alcohol: ["liver-alcohol", "lft-indicated"],
        "fatty-liver": ["liver-nafld", "lft-indicated"],
        meds: ["liver-meds", "lft-indicated"],
        jaundice: ["liver-acute", "lft-indicated", "urgent-review"],
        none: [],
      },
      "Select all that apply.",
      true
    ),
    q(
      "kidney",
      "kidneyRisk",
      "Do any of these apply to your kidneys?",
      [
        { id: "hypertension-diabetes", label: "I have diabetes or high blood pressure" },
        { id: "swelling", label: "Swollen ankles or puffy eyes" },
        { id: "urine-changes", label: "Foamy urine or peeing much less than usual" },
        { id: "family-ckd", label: "Kidney disease runs in my family" },
        { id: "none", label: "None of these" },
      ],
      {
        "hypertension-diabetes": ["ckd-risk", "renal-indicated"],
        swelling: ["ckd-oedema", "renal-indicated"],
        "urine-changes": ["ckd-proteinuria", "renal-indicated", "uacr-indicated"],
        "family-ckd": ["ckd-family", "renal-indicated"],
        none: [],
      },
      "Select all that apply.",
      true
    ),
    nutrientsQuestion(gender),
    q(
      "intro",
      "lastBloods",
      "When did you last have a full blood test?",
      [
        { id: "never", label: "Never, or not in the last 2 years" },
        { id: "1-2-years", label: "Within the last 1–2 years" },
        { id: "recent", label: "Within the last 6 months" },
        { id: "ongoing", label: "I get blood tests regularly already" },
      ],
      {
        never: ["bloods-overdue", "baseline-panel"],
        "1-2-years": ["bloods-due", "baseline-panel"],
        recent: ["bloods-recent"],
        ongoing: ["bloods-monitored"],
      },
      "A full panel is more than a quick finger-prick or single test."
    ),
  ];
}

/** Question count + review step — stable for resume checks when answers include clinicalSex. */
export function biomarkersQuizTotalSteps(
  profileGender?: string | null,
  answers?: Record<string, string>
): number {
  return getBiomarkersQuizQuestions(profileGender, answers).length + 1;
}

/** Answer ids required before the quiz can be submitted to the member record. */
export function biomarkersQuizMissingAnswers(
  profileGender?: string | null,
  answers?: Record<string, string>
): string[] {
  const questions = getBiomarkersQuizQuestions(profileGender, answers);
  return questions
    .filter((question) => !isBiomarkersQuestionAnswered(question, answers?.[question.id]))
    .map((question) => question.id);
}

export function getBiomarkersQuizQuestions(
  profileGender?: string | null,
  answers?: Record<string, string>
): BiomarkersQuizQuestion[] {
  const showSexQuestion =
    needsClinicalSexQuestion(profileGender) && !answers?.clinicalSex;
  if (showSexQuestion) {
    return [CLINICAL_SEX_QUESTION];
  }

  const resolved = resolveBiomarkersQuizGender(profileGender, answers?.clinicalSex);
  const quizGender: BiomarkersQuizGender =
    resolved === "neutral" ? "male" : resolved;
  return buildCoreQuestions(quizGender);
}

export function biomarkersQuizGenderLabel(gender: BiomarkersQuizGender): string {
  if (gender === "female") return "Female";
  if (gender === "male") return "Male";
  return "Unspecified";
}

function hormoneTestsForGender(gender: BiomarkersQuizGender): string[] {
  if (gender === "female") {
    return [
      "Estradiol",
      "Progesterone",
      "FSH",
      "LH",
      "SHBG",
      "Testosterone",
      "Cortisol",
      "DHEA-S",
    ];
  }
  if (gender === "male") {
    return [
      "Total testosterone",
      "Free testosterone",
      "SHBG",
      "Estradiol",
      "Cortisol",
      "DHEA-S",
      "LH/FSH",
    ];
  }
  return ["Testosterone", "Estradiol", "SHBG", "Cortisol", "DHEA-S", "FSH/LH"];
}

function sectionTestsForGender(
  sectionId: BiomarkersSectionId,
  gender: BiomarkersQuizGender
): string[] {
  if (sectionId === "hormones") return hormoneTestsForGender(gender);
  return SECTION_TESTS[sectionId];
}

const FLAG_TO_SECTION: Partial<
  Record<string, { sectionId: BiomarkersSectionId; indication: string; medicare?: string }>
> = {
  "lipids-indicated": {
    sectionId: "heart",
    indication: "Cardiovascular risk assessment — lipid panel indicated",
    medicare: "MBS 66503 / 66597 (lipid studies when CVD risk factors present)",
  },
  "hba1c-indicated": {
    sectionId: "metabolic",
    indication: "Diabetes screening or metabolic risk — HbA1c indicated",
    medicare: "MBS 66551 (HbA1c when diabetes risk or symptoms documented)",
  },
  "glucose-indicated": {
    sectionId: "metabolic",
    indication: "Symptoms suggestive of hyperglycaemia — fasting glucose indicated",
    medicare: "MBS 66551 (with clinical indication)",
  },
  "insulin-indicated": {
    sectionId: "metabolic",
    indication: "Insulin resistance / metabolic syndrome — fasting insulin & HOMA-IR",
    medicare: "Insulin usually private; HbA1c/glucose may be Medicare-eligible",
  },
  "tsh-indicated": {
    sectionId: "thyroid",
    indication: "Thyroid dysfunction suspected — TSH indicated",
    medicare: "MBS 66732 (TSH when thyroid disease suspected)",
  },
  "tft-indicated": {
    sectionId: "thyroid",
    indication: "Hyperthyroid symptoms — consider Free T4 / Free T3",
    medicare: "MBS 66732 / 66733 (when abnormal TSH or strong clinical suspicion)",
  },
  "hormone-panel-indicated": {
    sectionId: "hormones",
    indication: "Symptoms warrant sex / stress hormone review",
    medicare: "Usually privately billed unless specific Medicare criteria met",
  },
  "testosterone-indicated": {
    sectionId: "hormones",
    indication: "Androgen deficiency symptoms — total & free testosterone",
    medicare: "MBS 66695 in limited circumstances; often private",
  },
  "lft-indicated": {
    sectionId: "liver",
    indication: "Hepatic disease or medication effect suspected — LFT panel",
    medicare: "MBS 66548 (hepatic function tests when clinically indicated)",
  },
  "renal-indicated": {
    sectionId: "kidney",
    indication: "CKD risk or renal symptoms — U&E, creatinine, eGFR",
    medicare: "MBS 66572 (renal function when CKD suspected or monitoring required)",
  },
  "uacr-indicated": {
    sectionId: "kidney",
    indication: "Proteinuria suspected — urine albumin:creatinine ratio",
    medicare: "MBS 66655 (microalbumin when diabetic nephropathy suspected)",
  },
  "iron-studies-indicated": {
    sectionId: "nutrients",
    indication: "Iron deficiency or dietary risk — iron studies + ferritin",
    medicare: "MBS 66596 when iron deficiency clinically suspected",
  },
  "fbc-indicated": {
    sectionId: "nutrients",
    indication: "Anaemia or infection screen — full blood count",
    medicare: "MBS 65070 (FBC when clinically indicated)",
  },
  "crp-indicated": {
    sectionId: "nutrients",
    indication: "Inflammation suspected — CRP",
    medicare: "Usually private unless specific inflammatory condition documented",
  },
  "nutrient-b12-d": {
    sectionId: "nutrients",
    indication: "Dietary restriction — vitamin B12, folate, vitamin D",
    medicare: "Usually private unless deficiency clinically suspected",
  },
  "baseline-panel": {
    sectionId: "intro",
    indication: "No recent comprehensive bloods — baseline panel appropriate",
  },
};

const SECTION_TESTS: Record<BiomarkersSectionId, string[]> = {
  intro: ["Comprehensive metabolic baseline"],
  heart: ["Total cholesterol", "LDL", "HDL", "Triglycerides", "Non-HDL", "hs-CRP"],
  metabolic: ["Fasting glucose", "HbA1c", "Fasting insulin", "HOMA-IR"],
  thyroid: ["TSH", "Free T4", "Free T3"],
  hormones: ["Testosterone", "Estradiol", "SHBG", "Cortisol", "DHEA-S", "FSH/LH"],
  liver: ["ALT", "AST", "GGT", "ALP", "Bilirubin", "Albumin"],
  kidney: ["Creatinine", "eGFR", "U&E", "UACR"],
  nutrients: ["FBC", "Ferritin", "Iron studies", "Vitamin B12", "Vitamin D", "CRP"],
};

function collectFlags(answers: Record<string, string>, questions: BiomarkersQuizQuestion[]): Set<string> {
  const flags = new Set<string>();
  for (const question of questions) {
    const selected = question.allowMultiple
      ? parseBiomarkersAnswer(answers[question.id])
      : answers[question.id]
        ? [answers[question.id]]
        : [];
    for (const optionId of selected) {
      for (const flag of question.optionFlags[optionId] ?? []) {
        flags.add(flag);
      }
    }
  }
  return flags;
}

function goalLabel(goalId: string | undefined): string {
  const map: Record<string, string> = {
    "biological-age": "Biological age assessment",
    prevention: "Preventive health screening",
    symptoms: "Symptom investigation",
    "doctor-referred": "GP-referred testing",
  };
  return map[goalId ?? ""] ?? "General biomarker assessment";
}

export function deriveBiomarkersQuizResult(
  answers: Record<string, string>,
  profileGender?: string | null
): BiomarkersQuizResult {
  const quizGender = resolveBiomarkersQuizGender(profileGender, answers.clinicalSex);
  const effectiveGender: BiomarkersQuizGender =
    quizGender === "neutral" ? "male" : quizGender;
  const questions = getBiomarkersQuizQuestions(profileGender, answers);
  const flags = collectFlags(answers, questions);
  const sectionMap = new Map<BiomarkersSectionId, CategoryRecommendation>();

  for (const flag of flags) {
    const mapping = FLAG_TO_SECTION[flag];
    if (!mapping) continue;
    const existing = sectionMap.get(mapping.sectionId) ?? {
      sectionId: mapping.sectionId,
      categoryName: SECTION_META[mapping.sectionId].categoryName,
      priority: "routine" as const,
      suggestedTests: [...sectionTestsForGender(mapping.sectionId, effectiveGender)],
      clinicalIndications: [],
      medicareNotes: [],
    };
    if (!existing.clinicalIndications.includes(mapping.indication)) {
      existing.clinicalIndications.push(mapping.indication);
    }
    if (mapping.medicare && !existing.medicareNotes.includes(mapping.medicare)) {
      existing.medicareNotes.push(mapping.medicare);
    }
    if (
      flags.has("urgent-review") ||
      flags.has("diabetes-symptoms") ||
      flags.has("liver-acute") ||
      flags.has("cvd-dyslipidaemia")
    ) {
      existing.priority = "high";
    }
    sectionMap.set(mapping.sectionId, existing);
  }

  // Always include biological-clock core if goal is ageing or no recent bloods
  if (flags.has("goal-ageing") || flags.has("baseline-panel") || flags.has("bloods-overdue")) {
    if (!sectionMap.has("heart")) {
      sectionMap.set("heart", {
        sectionId: "heart",
        categoryName: SECTION_META.heart.categoryName,
        priority: "routine",
        suggestedTests: SECTION_TESTS.heart,
        clinicalIndications: ["Baseline cardiovascular markers for biological age panel"],
        medicareNotes: ["MBS 66503 when CVD risk assessment documented"],
      });
    }
    if (!sectionMap.has("metabolic")) {
      sectionMap.set("metabolic", {
        sectionId: "metabolic",
        categoryName: SECTION_META.metabolic.categoryName,
        priority: "routine",
        suggestedTests: SECTION_TESTS.metabolic,
        clinicalIndications: ["Core metabolic markers for biological age calculation"],
        medicareNotes: [],
      });
    }
  }

  const sections = Array.from(sectionMap.values()).sort((a, b) => {
    const order: BiomarkersSectionId[] = [
      "heart",
      "metabolic",
      "thyroid",
      "hormones",
      "liver",
      "kidney",
      "nutrients",
      "intro",
    ];
    return order.indexOf(a.sectionId) - order.indexOf(b.sectionId);
  });

  const medicareCount = sections.filter((s) => s.medicareNotes.length > 0).length;
  const suggestedPanel =
    sections.length >= 5 || flags.has("goal-ageing")
      ? "comprehensive"
      : sections.length >= 3
        ? "extended"
        : "essential";

  const doctorSummary = [
    `Clinical sex for reference ranges: ${biomarkersQuizGenderLabel(effectiveGender)}`,
    `Primary goal: ${goalLabel(answers.primaryGoal)}`,
    `Last bloods: ${answers.lastBloods ?? "not specified"}`,
    "",
    "Clinical indications by category:",
    ...sections.flatMap((s) => [
      `• ${s.categoryName} (${s.priority} priority)`,
      ...s.clinicalIndications.map((i) => `  - ${i}`),
      ...(s.medicareNotes.length ? [`  Medicare: ${s.medicareNotes.join("; ")}`] : []),
    ]),
    "",
    "Recommended action: AHPRA doctor to review indications, request Medicare-eligible tests where criteria met, and arrange private panel top-up for biological age / extended markers as appropriate.",
  ].join("\n");

  return {
    primaryGoal: goalLabel(answers.primaryGoal),
    sections,
    suggestedPanel,
    doctorSummary,
    hasMedicareEligibleIndications: medicareCount > 0,
    clinicalSex: biomarkersQuizGenderLabel(effectiveGender),
  };
}

export function getBiomarkersSectionForStep(
  questions: BiomarkersQuizQuestion[],
  stepIndex: number
): BiomarkersQuizQuestion | undefined {
  return questions[stepIndex];
}

export { SECTION_META };
