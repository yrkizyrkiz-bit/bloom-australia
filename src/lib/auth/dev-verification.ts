/**
 * TEMPORARY testing helper.
 * When DEV_VERIFICATION_CODE is a 6-digit value, that code verifies any
 * email or mobile without a delivered message. Unset it before go-live.
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
