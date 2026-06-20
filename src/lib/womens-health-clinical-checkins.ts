export type WomensHealthCareArea = "hormones" | "menopause" | "pcos" | "fertility";

export type ClinicalFieldType = "select" | "multi" | "rating" | "number" | "text";

export type ClinicalField = {
  id: string;
  label: string;
  type: ClinicalFieldType;
  helper?: string;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type ClinicalSection = {
  title: string;
  description: string;
  fields: ClinicalField[];
};

export type ClinicalFieldValue = string | number | string[] | null;
export type ClinicalMetadata = Record<string, ClinicalFieldValue>;

export const WOMENS_HEALTH_CLINICAL_SECTIONS: Record<WomensHealthCareArea, ClinicalSection[]> = {
  hormones: [
    {
      title: "Your cycle and symptoms",
      description: "Tell us what has been happening recently, in plain language. This helps your care team connect symptoms with your blood results.",
      fields: [
        {
          id: "cyclePattern",
          label: "How would you describe your periods lately?",
          type: "select",
          options: ["regular", "irregular", "missed_period", "heavy_bleeding", "no_period", "not_applicable"],
          helper: "This helps interpret hormones that naturally change across the cycle.",
        },
        {
          id: "pmsSeverity",
          label: "How much do symptoms affect you before your period?",
          type: "rating",
          helper: "1 = hardly at all, 5 = significantly affects daily life.",
        },
        {
          id: "hormoneSymptoms",
          label: "Which of these have you noticed?",
          type: "multi",
          options: ["breast_tenderness", "mood_swings", "brain_fog", "low_libido", "acne", "hair_changes", "cold_intolerance", "heat_intolerance"],
        },
      ],
    },
    {
      title: "Medication and questions",
      description: "Some medicines, contraception and supplements can change symptoms or hormone levels.",
      fields: [
        {
          id: "hormoneMedicationContext",
          label: "Are you using any of these at the moment?",
          type: "multi",
          options: ["combined_pill", "progesterone_only", "iud", "hrt", "thyroid_medication", "anti_androgen", "none"],
        },
        {
          id: "clinicalQuestion",
          label: "What would you most like help understanding?",
          type: "text",
          placeholder: "e.g. Why am I feeling tired before my period?",
        },
      ],
    },
  ],
  menopause: [
    {
      title: "Where you are in the transition",
      description: "These answers help us understand whether symptoms may fit perimenopause, menopause or post-menopause patterns.",
      fields: [
        {
          id: "menopauseStage",
          label: "Which best describes you right now?",
          type: "select",
          options: ["perimenopause", "menopause", "postmenopause", "surgical_menopause", "unsure"],
        },
        {
          id: "hotFlushFrequency",
          label: "How many hot flushes or night sweats did you have in the last 24 hours?",
          type: "select",
          options: ["none", "1_to_2", "3_to_5", "6_to_10", "more_than_10"],
        },
        {
          id: "sleepDisruption",
          label: "How much are symptoms affecting your sleep?",
          type: "rating",
          helper: "1 = sleeping well, 5 = waking often or exhausted.",
        },
      ],
    },
    {
      title: "Bleeding, intimacy and treatment context",
      description: "These details help highlight changes that may need care-team follow-up.",
      fields: [
        {
          id: "bleedingPattern",
          label: "What has bleeding been like recently?",
          type: "select",
          options: ["none", "regular", "irregular", "heavy", "spotting", "postmenopausal_bleeding"],
        },
        {
          id: "genitourinarySymptoms",
          label: "Any vaginal, intimacy or urinary symptoms?",
          type: "multi",
          options: ["vaginal_dryness", "painful_sex", "urinary_frequency", "urinary_urgency", "recurrent_utis", "none"],
        },
        {
          id: "hrtContext",
          label: "Are you using or considering menopause treatment?",
          type: "select",
          options: ["not_using", "considering", "started_recently", "stable", "side_effect_concern"],
        },
      ],
    },
  ],
  pcos: [
    {
      title: "Periods, skin and hair changes",
      description: "These symptoms can help your care team understand PCOS or androgen-related patterns.",
      fields: [
        {
          id: "cycleFrequency",
          label: "How often do you usually get a period?",
          type: "select",
          options: ["regular_21_35_days", "longer_than_35_days", "less_than_8_periods_year", "no_period", "irregular_unknown"],
        },
        {
          id: "androgenSymptoms",
          label: "Have you noticed any of these skin or hair changes?",
          type: "multi",
          options: ["acne", "oily_skin", "excess_facial_hair", "excess_body_hair", "scalp_hair_thinning", "none"],
        },
        {
          id: "androgenSymptomSeverity",
          label: "How much do these skin or hair symptoms bother you?",
          type: "rating",
          helper: "1 = not much, 5 = a major concern.",
        },
      ],
    },
    {
      title: "Cravings, energy and weight changes",
      description: "These answers help connect symptoms with insulin, glucose and metabolic markers.",
      fields: [
        {
          id: "metabolicPattern",
          label: "Which patterns have you noticed?",
          type: "multi",
          options: ["cravings", "energy_crashes", "weight_gain", "difficulty_losing_weight", "increased_hunger", "none"],
        },
        {
          id: "waistChange",
          label: "Has your waist or weight changed recently?",
          type: "select",
          options: ["stable", "increased", "decreased", "unsure"],
        },
        {
          id: "pcosTreatmentContext",
          label: "Are you using any PCOS or metabolic support?",
          type: "multi",
          options: ["metformin", "inositol", "contraceptive_pill", "anti_androgen", "glp1", "none"],
        },
      ],
    },
  ],
  fertility: [
    {
      title: "Cycle and ovulation signs",
      description: "These details help build a clearer picture of timing, ovulation and reproductive health.",
      fields: [
        {
          id: "tryingToConceive",
          label: "Are you currently trying for pregnancy?",
          type: "select",
          options: ["not_currently", "trying_now", "planning_soon", "ivf_or_fertility_treatment", "pregnancy_possible"],
        },
        {
          id: "usualCycleLength",
          label: "About how long is your usual cycle?",
          type: "number",
          min: 15,
          max: 90,
          placeholder: "e.g. 28",
        },
        {
          id: "ovulationSignals",
          label: "Have you noticed any ovulation signs?",
          type: "multi",
          options: ["positive_lh_test", "fertile_mucus", "basal_temp_rise", "ovulation_pain", "none"],
        },
      ],
    },
    {
      title: "Pregnancy planning context",
      description: "This gives your care team helpful context for preconception or fertility conversations.",
      fields: [
        {
          id: "pregnancyTestStatus",
          label: "Have you taken a pregnancy test recently?",
          type: "select",
          options: ["not_tested", "negative", "positive", "unclear", "not_applicable"],
        },
        {
          id: "bleedingOrPainPattern",
          label: "Any bleeding or pain symptoms?",
          type: "multi",
          options: ["spotting", "heavy_bleeding", "cramps", "pelvic_pain", "one_sided_pain", "none"],
        },
        {
          id: "preconceptionContext",
          label: "Anything already part of your pregnancy planning?",
          type: "multi",
          options: ["folate", "prenatal_supplement", "thyroid_review", "iron_review", "vitamin_d_review", "previous_miscarriage", "none"],
        },
      ],
    },
  ],
};

export function getClinicalFieldIds(careArea: WomensHealthCareArea): Set<string> {
  return new Set(
    WOMENS_HEALTH_CLINICAL_SECTIONS[careArea].flatMap((section) =>
      section.fields.map((field) => field.id)
    )
  );
}

const CLINICAL_LABELS: Record<string, string> = {
  hormones: "Hormone Health",
  menopause: "Menopause",
  pcos: "PCOS",
  fertility: "Fertility",
  cyclePattern: "Period pattern",
  pmsSeverity: "Symptoms before period",
  hormoneSymptoms: "Symptoms noticed",
  hormoneMedicationContext: "Medication or contraception",
  clinicalQuestion: "Main question",
  menopauseStage: "Menopause stage",
  hotFlushFrequency: "Flushes or night sweats",
  sleepDisruption: "Sleep impact",
  bleedingPattern: "Bleeding pattern",
  genitourinarySymptoms: "Vaginal or urinary symptoms",
  hrtContext: "Menopause treatment",
  cycleFrequency: "Period frequency",
  androgenSymptoms: "Skin or hair changes",
  androgenSymptomSeverity: "Skin or hair impact",
  metabolicPattern: "Cravings or energy pattern",
  waistChange: "Waist or weight change",
  pcosTreatmentContext: "PCOS support",
  tryingToConceive: "Pregnancy plans",
  usualCycleLength: "Usual cycle length",
  ovulationSignals: "Ovulation signs",
  pregnancyTestStatus: "Pregnancy test",
  bleedingOrPainPattern: "Bleeding or pain",
  preconceptionContext: "Pregnancy planning",
  regular: "Regular",
  irregular: "Irregular",
  missed_period: "Missed period",
  heavy_bleeding: "Heavy bleeding",
  no_period: "No period",
  not_applicable: "Not applicable",
  breast_tenderness: "Breast tenderness",
  mood_swings: "Mood swings",
  brain_fog: "Brain fog",
  low_libido: "Low libido",
  acne: "Acne",
  hair_changes: "Hair changes",
  cold_intolerance: "Feeling unusually cold",
  heat_intolerance: "Feeling unusually hot",
  combined_pill: "Combined pill",
  progesterone_only: "Progesterone-only contraception",
  iud: "IUD",
  hrt: "Hormone replacement therapy",
  thyroid_medication: "Thyroid medication",
  anti_androgen: "Anti-androgen medication",
  none: "None",
  perimenopause: "Perimenopause",
  postmenopause: "Post-menopause",
  surgical_menopause: "Surgical menopause",
  unsure: "Unsure",
  "1_to_2": "1 to 2 times",
  "3_to_5": "3 to 5 times",
  "6_to_10": "6 to 10 times",
  more_than_10: "More than 10 times",
  spotting: "Spotting",
  postmenopausal_bleeding: "Bleeding after menopause",
  vaginal_dryness: "Vaginal dryness",
  painful_sex: "Pain during sex",
  urinary_frequency: "Passing urine more often",
  urinary_urgency: "Sudden urge to urinate",
  recurrent_utis: "Recurring UTIs",
  not_using: "Not using",
  considering: "Considering",
  started_recently: "Started recently",
  stable: "Stable",
  side_effect_concern: "Concerned about side effects",
  regular_21_35_days: "Every 21 to 35 days",
  longer_than_35_days: "Usually longer than 35 days",
  less_than_8_periods_year: "Fewer than 8 periods a year",
  irregular_unknown: "Irregular or hard to predict",
  oily_skin: "Oily skin",
  excess_facial_hair: "More facial hair",
  excess_body_hair: "More body hair",
  scalp_hair_thinning: "Scalp hair thinning",
  cravings: "Cravings",
  energy_crashes: "Energy crashes",
  weight_gain: "Weight gain",
  difficulty_losing_weight: "Difficulty losing weight",
  increased_hunger: "Increased hunger",
  increased: "Increased",
  decreased: "Decreased",
  metformin: "Metformin",
  inositol: "Inositol",
  contraceptive_pill: "Contraceptive pill",
  glp1: "GLP-1 medication",
  not_currently: "Not currently",
  trying_now: "Trying now",
  planning_soon: "Planning soon",
  ivf_or_fertility_treatment: "IVF or fertility treatment",
  pregnancy_possible: "Pregnancy is possible",
  positive_lh_test: "Positive ovulation test",
  fertile_mucus: "Fertile cervical mucus",
  basal_temp_rise: "Basal temperature rise",
  ovulation_pain: "Ovulation pain",
  not_tested: "Not tested",
  negative: "Negative",
  positive: "Positive",
  unclear: "Unclear",
  cramps: "Cramps",
  pelvic_pain: "Pelvic pain",
  one_sided_pain: "One-sided pain",
  folate: "Folate",
  prenatal_supplement: "Prenatal supplement",
  thyroid_review: "Thyroid review",
  iron_review: "Iron review",
  vitamin_d_review: "Vitamin D review",
  previous_miscarriage: "Previous miscarriage",
};

export function formatClinicalLabel(value: string): string {
  return CLINICAL_LABELS[value] || value.replace(/_/g, " ");
}

export function formatClinicalValue(value: ClinicalFieldValue): string {
  if (Array.isArray(value)) return value.map(formatClinicalLabel).join(", ");
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return formatClinicalLabel(value);
  return "";
}
