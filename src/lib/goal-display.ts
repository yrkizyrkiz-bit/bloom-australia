import { PAUSED_GOAL_STATUS } from "@/lib/goal-deduplication";
import { formatReviewDate, isReviewDue } from "@/lib/goal-review";

export function goalStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "IN_PROGRESS":
      return "In progress";
    case "ACHIEVED":
      return "Achieved";
    case "CANCELLED":
      return "Paused";
    case "MISSED":
      return "Missed";
    default:
      return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }
}

export function isActiveGoalStatus(status: string): boolean {
  return status.toUpperCase() === "IN_PROGRESS";
}

export function isPausedGoalStatus(status: string): boolean {
  return status.toUpperCase() === PAUSED_GOAL_STATUS;
}

/** Subtle review hint — never a day countdown. */
export function nextReviewHint(reviewDate: string | Date): string {
  return `Next review · ${formatReviewDate(reviewDate)}`;
}

export function reviewDueHint(reviewDate: string | Date): string | null {
  if (!isReviewDue(reviewDate)) return null;
  const days = Math.ceil(
    (new Date(reviewDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Review due today";
  if (days < 0) return "Review overdue";
  return null;
}

export function calculateGoalProgress(
  startValue: number,
  targetValue: number,
  currentValue: number,
  biomarkerId: string
): number {
  const isHigherBetter =
    biomarkerId === "hdl_cholesterol" || biomarkerId === "egfr";

  if (isHigherBetter) {
    const totalChange = targetValue - startValue;
    if (totalChange === 0) return 100;
    const currentChange = currentValue - startValue;
    return Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)));
  }

  const totalChange = startValue - targetValue;
  if (totalChange === 0) return 100;
  const currentChange = startValue - currentValue;
  return Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)));
}

export function isGoalImproving(
  startValue: number,
  targetValue: number,
  currentValue: number
): boolean {
  return targetValue > startValue
    ? currentValue > startValue
    : currentValue < startValue;
}
