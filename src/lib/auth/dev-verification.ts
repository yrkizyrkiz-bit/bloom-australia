/**
 * TEMPORARY development helper.
 * Remove DEV_VERIFICATION_CODE from env (and this module) when finishing development.
 * When the env var is unset, verification behaves normally.
 */
export function getDevVerificationCode(): string | null {
  const raw = process.env.DEV_VERIFICATION_CODE?.trim() ?? "";
  if (!/^\d{6}$/.test(raw)) return null;
  return raw;
}

export function isDevVerificationEnabled(): boolean {
  return getDevVerificationCode() !== null;
}

export function matchesDevVerificationCode(code: unknown): boolean {
  const expected = getDevVerificationCode();
  if (!expected) return false;
  return String(code ?? "").trim() === expected;
}
