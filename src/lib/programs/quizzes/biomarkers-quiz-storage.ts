/** Persist in-portal biomarkers quiz progress in localStorage (per user). */

export const BIOMARKERS_QUIZ_STORAGE_VERSION = 1;
export const BIOMARKERS_QUIZ_RESUME_THRESHOLD = 0.25;

export type BiomarkersQuizSavedProgress = {
  version: typeof BIOMARKERS_QUIZ_STORAGE_VERSION;
  stepIndex: number;
  answers: Record<string, string>;
  updatedAt: string;
  completed: boolean;
};

function storageKey(userId: string) {
  return `sanative_biomarkers_quiz_${userId}`;
}

export function readBiomarkersQuizProgressRaw(
  userId: string | undefined | null
): BiomarkersQuizSavedProgress | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BiomarkersQuizSavedProgress;
    if (parsed.version !== BIOMARKERS_QUIZ_STORAGE_VERSION) return null;
    if (parsed.completed) return null;
    if (parsed.stepIndex < 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getBiomarkersQuizProgress(
  userId: string | undefined | null,
  totalSteps: number
): BiomarkersQuizSavedProgress | null {
  const parsed = readBiomarkersQuizProgressRaw(userId);
  if (!parsed || totalSteps <= 0) return null;
  if (parsed.stepIndex > totalSteps) return null;
  return parsed;
}

export function getBiomarkersQuizProgressPercent(
  progress: BiomarkersQuizSavedProgress | null,
  totalSteps: number
): number {
  if (!progress || totalSteps <= 0) return 0;
  return Math.round(((progress.stepIndex + 1) / totalSteps) * 100);
}

export function canResumeBiomarkersQuiz(
  progress: BiomarkersQuizSavedProgress | null,
  totalSteps: number
): boolean {
  if (!progress || progress.completed) return false;
  const ratio = (progress.stepIndex + 1) / totalSteps;
  return ratio > BIOMARKERS_QUIZ_RESUME_THRESHOLD;
}

export function saveBiomarkersQuizProgress(
  userId: string,
  data: Omit<BiomarkersQuizSavedProgress, "version" | "updatedAt">
) {
  try {
    const payload: BiomarkersQuizSavedProgress = {
      version: BIOMARKERS_QUIZ_STORAGE_VERSION,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // localStorage unavailable — quiz still works without resume.
  }
}

export function clearBiomarkersQuizProgress(userId: string) {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
