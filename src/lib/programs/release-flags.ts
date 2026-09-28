/** Flip when men's Vitality / separate Menopause Care cards ship later. */
export const VITALITY_PROGRAM_RELEASED = false;

/** PCOS, Fertility & Hormone Health — hide for Women's Health v2 (Menopause remains). */
export const WOMENS_PCOS_FERTILITY_RELEASED = false;

/** Hidden from the programs hub until released. Women's Wellness remains live. */
const HIDDEN_VITALITY_PROGRAM_KEYS = new Set([
  "MENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_VITALITY",
]);

export function isVitalityProgramKey(key: string | null | undefined): boolean {
  return key === "MENS_HEALTH_VITALITY" || key === "WOMENS_HEALTH_VITALITY";
}

export function isHiddenVitalityProgram(key: string | null | undefined): boolean {
  return !VITALITY_PROGRAM_RELEASED && Boolean(key && HIDDEN_VITALITY_PROGRAM_KEYS.has(key));
}

/** True when a Women's Health portal care area is withheld from v2. */
export function isHiddenWomensPortalArea(area: string | null | undefined): boolean {
  if (WOMENS_PCOS_FERTILITY_RELEASED) return false;
  return area === "pcos" || area === "fertility" || area === "hormones";
}
