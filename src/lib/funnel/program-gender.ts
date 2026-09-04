/** Prisma User.gender values. */
export type UserGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export function mapGenderInput(gender: string): UserGender {
  const g = gender.toLowerCase();
  if (g === "female" || g === "woman") return "FEMALE";
  if (g === "male" || g === "man") return "MALE";
  return "PREFER_NOT_TO_SAY";
}

/**
 * Gender implied by a public consult / checkout program slug.
 * Hair loss is mixed-sex, never infer male from that program alone.
 */
export function genderForPublicConsultSlug(slug?: string | null): UserGender | null {
  const s = (slug || "").toLowerCase();
  if (s === "mens_health") return "MALE";
  if (s === "womens_health") return "FEMALE";
  return null;
}

/** Gender implied by subscription tier (matches User.subscriptionTier). */
export function genderForSubscriptionTier(tier?: string | null): UserGender | null {
  const t = (tier || "").toLowerCase();
  if (t === "mens_health") return "MALE";
  if (t === "womens_health") return "FEMALE";
  return null;
}

/**
 * Resolve gender when enrolling via intake.
 * Men's / women's programs imply sex. Hair loss collects biological sex on the quiz.
 */
export function genderForIntakeProgram(
  programType: string,
  dataGender?: string
): UserGender {
  if (programType === "WOMENS_HEALTH") return "FEMALE";
  if (programType === "MENS_HEALTH") return "MALE";
  if (dataGender) return mapGenderInput(dataGender);
  return "PREFER_NOT_TO_SAY";
}

/** Prefer quiz-collected sex when it is male/female, otherwise keep the stored User.gender. */
export function resolveDisplayedGender(options: {
  stored?: string | null;
  quizGender?: unknown;
}): string {
  if (typeof options.quizGender === "string" && options.quizGender.trim()) {
    const fromQuiz = mapGenderInput(options.quizGender);
    if (fromQuiz === "MALE" || fromQuiz === "FEMALE") return fromQuiz;
  }
  return options.stored || "Not specified";
}
