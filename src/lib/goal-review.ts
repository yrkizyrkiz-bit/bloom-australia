/** Health goals use `targetDate` in the DB; in the UI this is the review date. */

export function formatReviewDate(date: string | Date, locale = "en-AU"): string {
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getDaysUntilReview(reviewDate: string | Date): number {
  const target = new Date(reviewDate);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isReviewDue(reviewDate: string | Date): boolean {
  return getDaysUntilReview(reviewDate) <= 0;
}

export function reviewDueLabel(reviewDate: string | Date): string {
  const days = getDaysUntilReview(reviewDate);
  if (days < 0) return `Review overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Review due today";
  if (days === 1) return "Review due tomorrow";
  return `Review in ${days} days`;
}

export function appendReviewNote(
  existingNotes: string | null | undefined,
  reviewNotes: string
): string {
  const trimmed = reviewNotes.trim();
  if (!trimmed) return existingNotes?.trim() || "";

  const stamp = new Date().toISOString().split("T")[0];
  const entry = `[Review ${stamp}] ${trimmed}`;
  const prior = existingNotes?.trim();
  return prior ? `${entry}\n\n${prior}` : entry;
}

export function defaultNextReviewDate(months = 3): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}
