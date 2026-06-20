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
    title: "Your goals",
    description: "Helps us prioritise what matters most for your first panel.",
    categoryName: "General",
  },
  heart: {
    title: "Heart health",
    description: "Cardiovascular risk markers — lipids, inflammation, glucose.",
    categoryName: "Heart Health",
  },
  metabolic: {
    title: "Metabolic health",
    description: "Blood sugar, insulin resistance and metabolic syndrome markers.",
    categoryName: "Metabolic Panel",
  },
  thyroid: {
    title: "Thyroid function",
    description: "TSH and thyroid hormones when symptoms or risk factors apply.",
    categoryName: "Thyroid Function",
  },
  hormones: {
    title: "Hormone health",
    description: "Sex and stress hormones when clinically indicated.",
    categoryName: "Hormone Health",
  },
  liver: {
    title: "Liver function",
    description: "LFTs when hepatic disease or medication effects are suspected.",
    categoryName: "Liver Function",
  },
  kidney: {
    title: "Kidney function",
    description: "Renal panel when CKD risk or monitoring is clinically appropriate.",
    categoryName: "Kidney Function",
  },
  nutrients: {
    title: "Nutrients & inflammation",
    description: "Iron, B12, vitamin D and inflammatory markers when indicated.",
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
    "Any metabolic or diabetes-related concerns?",
    isFemale
      ? [
          { id: "diabetes-family", label: "Family history of type 2 diabetes" },
          { id: "weight-waist", label: "Weight gain around the waist or difficulty losing weight" },
          { id: "polydipsia", label: "Excessive thirst, hunger or frequent urination" },
          { id: "pcos", label: "PCOS, irregular cycles or insulin resistance" },
          { id: "gestational-diabetes", label: "History of gestational diabetes or pregnancy-related glucose issues" },
          { id: "none", label: "None of these" },
        ]
      : [
          { id: "diabetes-family", label: "Family history of type 2 diabetes" },
          { id: "weight-waist", label: "Weight gain around the waist or difficulty losing weight" },
          { id: "polydipsia", label: "Excessive thirst, hunger or frequent urination" },
          { id: "low-t-metabolic", label: "Low energy with reduced muscle or central weight gain" },
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
    "HbA1c and fasting glucose may be Medicare-eligible with clinical indication (MBS 66551).",
    true
  );
}

function nutrientsQuestion(gender: BiomarkersQuizGender): BiomarkersQuizQuestion {
  const isFemale = gender === "female";
  return q(
    "nutrients",
    "nutrientsInflammation",
    "Nutrient or inflammation concerns?",
    isFemale
      ? [
          { id: "restricted-diet", label: "Vegan, vegetarian or restricted diet" },
          { id: "fatigue-iron", label: "Fatigue, breathlessness or heavy periods" },
          { id: "pregnancy-nutrients", label: "Pregnant, breastfeeding or planning pregnancy" },
          { id: "frequent-illness", label: "Frequent infections or slow recovery" },
          { id: "joint-pain", label: "Joint pain or unexplained inflammation" },
          { id: "none", label: "None of these" },
        ]
      : [
          { id: "restricted-diet", label: "Vegan, vegetarian or restricted diet" },
          { id: "fatigue-iron", label: "Fatigue, breathlessness or reduced exercise tolerance" },
          { id: "frequent-illness", label: "Frequent infections or slow recovery" },
          { id: "joint-pain", label: "Joint pain or unexplained inflammation" },
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
    "Iron studies, B12/folate and CRP are often privately billed unless specific criteria are met.",
    true
  );
}

function hormonesQuestion(gender: BiomarkersQuizGender): BiomarkersQuizQuestion {
  const isFemale = gender === "female";
  return q(
    "hormones",
    "hormoneConcerns",
    isFemale
      ? "Any menstrual, menopause or hormone-related concerns?"
      : "Any testosterone, vitality or hormone-related concerns?",
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
    isFemale
      ? "Female hormone panels may include estradiol, progesterone, FSH/LH and SHBG when clinically indicated."
      : "Male hormone panels may include total/free testosterone and SHBG when clinically indicated.",
    true
  );
}

const CLINICAL_SEX_QUESTION = q(
  "intro",
  "clinicalSex",
  "For clinical reference, which sex were you assigned at birth?",
  [
    { id: "female", label: "Female", description: "Panels aligned to female reference ranges" },
    { id: "male", label: "Male", description: "Panels aligned to male reference ranges" },
  ],
  { female: [], male: [] },
  "This helps us recommend the right reference ranges and Medicare indications."
);

function mensHormoneOptions(): QuizOption[] {
  return [
    { id: "low-t", label: "Low energy, libido or muscle strength", description: "Possible androgen deficiency symptoms" },
    { id: "mood-stress", label: "Stress, poor sleep or mood changes", description: "Cortisol / adrenal axis review" },
    { id: "none", label: "None of these apply" },
  ];
}

function womensHormoneOptions(): QuizOption[] {
  return [
    { id: "perimenopause", label: "Hot flushes, sleep or cycle changes", description: "Perimenopause / menopause review" },
    { id: "cycle-fertility", label: "Irregular periods or fertility concerns", description: "Ovarian / cycle hormone panel" },
    { id: "fatigue-mood", label: "Fatigue, low mood or weight change", description: "Thyroid-adjacent hormone screen" },
    { id: "none", label: "None of these apply" },
  ];
}

function buildCoreQuestions(gender: BiomarkersQuizGender): BiomarkersQuizQuestion[] {
  return [
    q(
      "intro",
      "primaryGoal",
      "What is your main reason for testing?",
      [
        { id: "biological-age", label: "Understand my biological age", description: "Core ageing biomarkers panel" },
        { id: "prevention", label: "Preventive health check", description: "Baseline whole-body screen" },
        { id: "symptoms", label: "I have symptoms I want explained", description: "Symptom-directed testing" },
        { id: "doctor-referred", label: "My doctor suggested blood tests", description: "GP-aligned panel" },
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
      "Any cardiovascular risk factors?",
      [
        { id: "family-cvd", label: "Family history of heart attack or stroke before 60" },
        { id: "hypertension", label: "High blood pressure (treated or untreated)" },
        { id: "known-lipids", label: "Previously high cholesterol or triglycerides" },
        { id: "smoker", label: "Current or recent smoker" },
        { id: "none", label: "None of these" },
      ],
      {
        "family-cvd": ["cvd-family", "lipids-indicated"],
        hypertension: ["cvd-hypertension", "lipids-indicated"],
        "known-lipids": ["cvd-dyslipidaemia", "lipids-indicated"],
        smoker: ["cvd-smoking", "lipids-indicated"],
        none: [],
      },
      "Supports lipid panel and cardiovascular risk assessment (MBS 66503 / 66597 when clinically indicated).",
      true
    ),
    metabolicQuestion(gender),
    q(
      "thyroid",
      "thyroidSymptoms",
      "Any thyroid-related symptoms?",
      [
        { id: "fatigue-weight", label: "Unexplained fatigue with weight change" },
        { id: "temperature", label: "Feeling unusually cold or hot" },
        { id: "palpitations", label: "Palpitations, tremor or anxiety" },
        { id: "hair-skin", label: "Hair thinning, dry skin or constipation" },
        { id: "none", label: "None of these" },
      ],
      {
        "fatigue-weight": ["thyroid-symptoms", "tsh-indicated"],
        temperature: ["thyroid-symptoms", "tsh-indicated"],
        palpitations: ["thyroid-hyper", "tsh-indicated", "tft-indicated"],
        "hair-skin": ["thyroid-hypo", "tsh-indicated"],
        none: [],
      },
      "TSH testing may be Medicare-eligible when thyroid dysfunction is suspected (MBS 66732).",
      true
    ),
    hormonesQuestion(gender),
    q(
      "liver",
      "liverRisk",
      "Any liver-related risk factors?",
      [
        { id: "alcohol", label: "Regular alcohol above recommended limits" },
        { id: "fatty-liver", label: "Fatty liver, NAFLD or metabolic syndrome" },
        { id: "meds", label: "Regular medications that can affect the liver" },
        { id: "jaundice", label: "Yellowing of skin/eyes or upper abdominal pain" },
        { id: "none", label: "None of these" },
      ],
      {
        alcohol: ["liver-alcohol", "lft-indicated"],
        "fatty-liver": ["liver-nafld", "lft-indicated"],
        meds: ["liver-meds", "lft-indicated"],
        jaundice: ["liver-acute", "lft-indicated", "urgent-review"],
        none: [],
      },
      "LFTs may be Medicare-eligible when hepatic disease is suspected (MBS 66548).",
      true
    ),
    q(
      "kidney",
      "kidneyRisk",
      "Any kidney-related concerns?",
      [
        { id: "hypertension-diabetes", label: "Diabetes or high blood pressure" },
        { id: "swelling", label: "Ankle swelling or puffiness around eyes" },
        { id: "urine-changes", label: "Foamy urine or reduced urine output" },
        { id: "family-ckd", label: "Family history of kidney disease" },
        { id: "none", label: "None of these" },
      ],
      {
        "hypertension-diabetes": ["ckd-risk", "renal-indicated"],
        swelling: ["ckd-oedema", "renal-indicated"],
        "urine-changes": ["ckd-proteinuria", "renal-indicated", "uacr-indicated"],
        "family-ckd": ["ckd-family", "renal-indicated"],
        none: [],
      },
      "U&E, creatinine and eGFR may be Medicare-eligible for CKD monitoring (MBS 66572).",
      true
    ),
    nutrientsQuestion(gender),
    q(
      "intro",
      "lastBloods",
      "When did you last have comprehensive blood tests?",
      [
        { id: "never", label: "Never, or not in the last 2 years" },
        { id: "1-2-years", label: "Within the last 1–2 years" },
        { id: "recent", label: "Within the last 6 months" },
        { id: "ongoing", label: "I have regular monitoring already" },
      ],
      {
        never: ["bloods-overdue", "baseline-panel"],
        "1-2-years": ["bloods-due", "baseline-panel"],
        recent: ["bloods-recent"],
        ongoing: ["bloods-monitored"],
      },
      "Helps your doctor decide whether repeat testing is clinically appropriate."
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
