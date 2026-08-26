/**
 * Organ & Metabolic Care, clinical intake quiz for the member portal.
 *
 * Organ-focused questions derived from the public biomarkers intake (heart, liver,
 * kidney, thyroid, hormones, metabolic) with Medicare-eligible indication mapping
 * for doctor-ordered blood tests.
 */

import {
  biomarkersQuizGenderLabel,
  deriveBiomarkersQuizResult,
  getBiomarkersQuizQuestions,
  isBiomarkersQuestionAnswered,
  needsClinicalSexQuestion,
  parseBiomarkersAnswer,
  resolveBiomarkersQuizGender,
  toggleBiomarkersMultiAnswer,
  type BiomarkersQuizQuestion,
  type BiomarkersQuizResult,
  type CategoryRecommendation,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";

export type OrganCareQuizResult = BiomarkersQuizResult & {
  organFocusAreas: string[];
};

const ORGAN_BODY_QUESTION_IDS = [
  "heartRisk",
  "metabolicRisk",
  "thyroidSymptoms",
  "hormoneConcerns",
  "liverRisk",
  "kidneyRisk",
  "lastBloods",
] as const;

const ORGAN_FOCUS_OPTIONS = [
  { id: "heart", label: "Heart & cardiovascular health" },
  { id: "liver", label: "Liver & fatty liver / metabolic liver" },
  { id: "kidney", label: "Kidney function" },
  { id: "thyroid", label: "Thyroid function" },
  { id: "hormones", label: "Hormone balance" },
  { id: "metabolic", label: "Blood sugar & metabolic health" },
  { id: "all", label: "All of the above, full organ review" },
] as const;

const ORGAN_FOCUS_QUESTION: BiomarkersQuizQuestion = {
  id: "organFocus",
  sectionId: "intro",
  sectionTitle: "Your focus",
  sectionDescription: "Which organ systems should we prioritise in your care plan?",
  prompt: "Which areas are you most concerned about?",
  subtitle: "Your doctor will use this to prioritise clinically indicated blood tests.",
  allowMultiple: true,
  options: ORGAN_FOCUS_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  optionFlags: {
    heart: ["organ-focus-heart"],
    liver: ["organ-focus-liver"],
    kidney: ["organ-focus-kidney"],
    thyroid: ["organ-focus-thyroid"],
    hormones: ["organ-focus-hormones"],
    metabolic: ["organ-focus-metabolic"],
    all: [
      "organ-focus-heart",
      "organ-focus-liver",
      "organ-focus-kidney",
      "organ-focus-thyroid",
      "organ-focus-hormones",
      "organ-focus-metabolic",
    ],
    none: [],
  },
};

function organFocusLabels(raw: string | undefined): string[] {
  const ids = parseBiomarkersAnswer(raw);
  if (ids.includes("all")) {
    return ORGAN_FOCUS_OPTIONS.filter((o) => o.id !== "all").map((o) => o.label);
  }
  return ids
    .map((id) => ORGAN_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .filter(Boolean);
}

/** Questions for the organ care portal funnel (excludes biomarkers panel / nutrients-only steps). */
export function getOrganCareQuizQuestions(
  profileGender?: string | null,
  answers?: Record<string, string>
): BiomarkersQuizQuestion[] {
  if (needsClinicalSexQuestion(profileGender) && !answers?.clinicalSex) {
    return getBiomarkersQuizQuestions(profileGender, answers);
  }

  const biomarkersQs = getBiomarkersQuizQuestions(profileGender, {
    ...answers,
    primaryGoal: "prevention",
  });

  const bodyQuestions = biomarkersQs.filter((q) =>
    (ORGAN_BODY_QUESTION_IDS as readonly string[]).includes(q.id)
  );

  return [ORGAN_FOCUS_QUESTION, ...bodyQuestions];
}

export function organCareQuizTotalSteps(
  profileGender?: string | null,
  answers?: Record<string, string>
): number {
  return getOrganCareQuizQuestions(profileGender, answers).length + 1;
}

export function organCareQuizMissingAnswers(
  profileGender?: string | null,
  answers?: Record<string, string>
): string[] {
  const questions = getOrganCareQuizQuestions(profileGender, answers);
  return questions
    .filter((question) => !isBiomarkersQuestionAnswered(question, answers?.[question.id]))
    .map((question) => question.id);
}

export function deriveOrganCareQuizResult(
  answers: Record<string, string>,
  profileGender?: string | null
): OrganCareQuizResult {
  const organFocusAreas = organFocusLabels(answers.organFocus);
  const base = deriveBiomarkersQuizResult(
    { ...answers, primaryGoal: answers.primaryGoal ?? "prevention" },
    profileGender
  );

  const focusSection: CategoryRecommendation | null =
    organFocusAreas.length > 0
      ? {
          sectionId: "intro",
          categoryName: "Member priority areas",
          priority: "high",
          suggestedTests: [],
          clinicalIndications: organFocusAreas.map((area) => `Member requested focus: ${area}`),
          medicareNotes: [],
        }
      : null;

  const sections = focusSection ? [focusSection, ...base.sections] : base.sections;

  const doctorSummary = [
    "Organ & Metabolic Care intake",
    organFocusAreas.length
      ? `Priority organ systems: ${organFocusAreas.join("; ")}`
      : "Priority organ systems: general organ & metabolic review",
    "",
    base.doctorSummary,
    "",
    "Recommended action: AHPRA doctor to review clinical indications, order Medicare-eligible pathology where criteria are met, and arrange any private panel add-ons if the member selected biomarkers.",
  ].join("\n");

  return {
    ...base,
    sections,
    organFocusAreas,
    doctorSummary,
  };
}

export {
  biomarkersQuizGenderLabel,
  isBiomarkersQuestionAnswered,
  parseBiomarkersAnswer,
  resolveBiomarkersQuizGender,
  toggleBiomarkersMultiAnswer,
  type BiomarkersQuizQuestion,
};
