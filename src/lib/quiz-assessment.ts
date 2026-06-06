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
