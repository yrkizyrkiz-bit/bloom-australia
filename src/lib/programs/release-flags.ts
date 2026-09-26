/** Flip when Vitality ships in a later version. */
export const VITALITY_PROGRAM_RELEASED = false;

const VITALITY_PROGRAM_KEYS = new Set([
  "MENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_VITALITY",
]);

export function isVitalityProgramKey(key: string | null | undefined): boolean {
  return Boolean(key && VITALITY_PROGRAM_KEYS.has(key));
}

export function isHiddenVitalityProgram(key: string | null | undefined): boolean {
  return !VITALITY_PROGRAM_RELEASED && isVitalityProgramKey(key);
}
