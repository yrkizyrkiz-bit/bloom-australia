/** Prisma User.gender values. */
export type UserGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export function mapGenderInput(gender: string): UserGender {
  const g = gender.toLowerCase();
  if (g === "female" || g === "woman") return "FEMALE";
  if (g === "male" || g === "man") return "MALE";
  return "PREFER_NOT_TO_SAY";
}

/** Gender implied by a public consult / checkout program slug. */
export function genderForPublicConsultSlug(slug?: string | null): UserGender | null {
  const s = (slug || "").toLowerCase();
  if (s === "mens_health" || s === "hair_loss") return "MALE";
  if (s === "womens_health") return "FEMALE";
  return null;
}

/** Gender implied by subscription tier (matches User.subscriptionTier). */
export function genderForSubscriptionTier(tier?: string | null): UserGender | null {
  const t = (tier || "").toLowerCase();
  if (t === "mens_health" || t === "hair_loss") return "MALE";
  if (t === "womens_health") return "FEMALE";
  return null;
}

/**
 * Resolve gender when enrolling via intake.
 * Gendered health programs always set gender from the program, funnels do not collect it.
 */
export function genderForIntakeProgram(
  programType: string,
  dataGender?: string
): UserGender {
  if (programType === "WOMENS_HEALTH") return "FEMALE";
  if (programType === "MENS_HEALTH" || programType === "HAIR_LOSS") return "MALE";
  if (dataGender) return mapGenderInput(dataGender);
  return "PREFER_NOT_TO_SAY";
}
