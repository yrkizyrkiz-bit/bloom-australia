export type QuizAssessment = {
  weightLossGoal: string;
  currentWeight: string;
  targetWeight: string;
  height: string;
  gender: string;
  dateOfBirth: string;
  ethnicity: string;
  metabolicConditions: string[];
  digestiveConditions: string[];
  cardiovascularConditions: string[];
  mentalHealthConditions: string[];
  seriousConditions: string[];
  currentMedications: string[];
  motivations: string[];
  otherGoals: string[];
  howHeard: string;
  consultationDate: string;
  consultationTime: string;
  submittedAt: string;
  selectedPlan: string;
  bmi: number | null;
};

const WEIGHT_MANAGEMENT_QUIZ_SIGNAL_FIELDS = [
  "weightLossGoal",
  "currentWeight",
  "targetWeight",
  "height",
  "metabolicConditions",
  "digestiveConditions",
  "cardiovascularConditions",
  "mentalHealthConditions",
  "seriousConditions",
  "motivations",
  "selectedPlan",
] as const;

function hasQuizFieldValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return value != null && value !== "";
}

/** True when intake/quiz payload is from the weight management assessment funnel. */
export function isWeightManagementQuizData(
  quizData: Record<string, unknown> | null | undefined
): boolean {
  if (!quizData || typeof quizData !== "object") return false;

  const programType = quizData.programType;
  if (typeof programType === "string" && programType !== "WEIGHT_MANAGEMENT") {
    return false;
  }

  return WEIGHT_MANAGEMENT_QUIZ_SIGNAL_FIELDS.some((field) =>
    hasQuizFieldValue(quizData[field])
  );
}

export function resolveWeightManagementQuizData(input: {
  wmIntakeQuizData?: Record<string, unknown> | null;
  programMemberProgram?: string | null;
  programMemberIntake?: Record<string, unknown> | null;
}): Record<string, unknown> | null {
  if (input.wmIntakeQuizData && isWeightManagementQuizData(input.wmIntakeQuizData)) {
    return input.wmIntakeQuizData;
  }

  if (
    input.programMemberProgram === "WEIGHT_MANAGEMENT" &&
    input.programMemberIntake &&
    isWeightManagementQuizData(input.programMemberIntake)
  ) {
    return input.programMemberIntake;
  }

  return null;
}

export function resolveLegacyHairSurveyData(input: {
  programMemberProgram?: string | null;
  programMemberIntake?: Record<string, unknown> | null;
}): Record<string, unknown> | null {
  const intake = input.programMemberIntake;
  if (!intake) return null;
  if (input.programMemberProgram === "HAIR_LOSS" || intake.programType === "HAIR_LOSS") {
    return intake;
  }
  return null;
}

export function buildAssessmentFromQuizData(
  quizData: Record<string, unknown>,
  user?: {
    gender?: string | null;
    dateOfBirth?: Date | null;
    leadSource?: string | null;
    createdAt?: Date;
  },
  booking?: { scheduledAt?: Date | null } | null
): QuizAssessment {
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

  return {
    weightLossGoal: (quizData.weightLossGoal as string) || "",
    currentWeight: quizData.currentWeight?.toString() || "",
    targetWeight: quizData.targetWeight?.toString() || "",
    height: quizData.height?.toString() || "",
    gender: (quizData.gender as string) || user?.gender || "",
    dateOfBirth: user?.dateOfBirth
      ? formatDate(new Date(user.dateOfBirth))
      : (quizData.dateOfBirth as string) || "",
    ethnicity: (quizData.ethnicity as string) || "",
    metabolicConditions: (quizData.metabolicConditions as string[]) || [],
    digestiveConditions: (quizData.digestiveConditions as string[]) || [],
    cardiovascularConditions: (quizData.cardiovascularConditions as string[]) || [],
    mentalHealthConditions: (quizData.mentalHealthConditions as string[]) || [],
    seriousConditions: (quizData.seriousConditions as string[]) || [],
    currentMedications: (quizData.currentMedications as string[]) || [],
    motivations: (quizData.motivations as string[]) || [],
    otherGoals: (quizData.otherGoals as string[]) || [],
    howHeard: (quizData.howHeard as string) || user?.leadSource || "",
    consultationDate: booking?.scheduledAt
      ? formatDate(new Date(booking.scheduledAt))
      : (quizData.consultationDate as string) || "",
    consultationTime: booking?.scheduledAt
      ? formatTime(new Date(booking.scheduledAt))
      : (quizData.consultationTime as string) || "",
    submittedAt:
      (quizData.submittedAt as string) ||
      user?.createdAt?.toISOString() ||
      "",
    selectedPlan: (quizData.selectedPlan as string) || "",
    bmi: typeof quizData.bmi === "number" ? quizData.bmi : null,
  };
}

export function buildMedicalNotesFromQuiz(
  quizData: Record<string, unknown>
): Array<{ title: string; content: string }> {
  const groups = [
    { title: "Triage — Metabolic Conditions", items: (quizData.metabolicConditions as string[]) || [] },
    { title: "Triage — Digestive Conditions", items: (quizData.digestiveConditions as string[]) || [] },
    { title: "Triage — Cardiovascular Conditions", items: (quizData.cardiovascularConditions as string[]) || [] },
    { title: "Triage — Mental Health Conditions", items: (quizData.mentalHealthConditions as string[]) || [] },
    {
      title: "Triage — Serious Conditions (FLAG)",
      items: ((quizData.seriousConditions as string[]) || []).filter(
        (c) => c !== "None of these apply"
      ),
    },
    { title: "Triage — Current Medications", items: (quizData.currentMedications as string[]) || [] },
    { title: "Patient Motivations", items: (quizData.motivations as string[]) || [] },
  ];

  return groups
    .filter((g) => g.items.filter(Boolean).length > 0)
    .map((g) => ({
      title: g.title,
      content: g.items.filter(Boolean).join(", "),
    }));
}
