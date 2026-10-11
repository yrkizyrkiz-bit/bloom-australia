/**
 * A prospective application can be updated when this browser already holds
 * that user id, or when the person has just verified they own the email.
 * Typing the email alone is not enough.
 */
export function prospectiveResumeAuthorized(input: {
  sameSession: boolean;
  tokenValid: boolean;
}): boolean {
  return input.sameSession || input.tokenValid;
}
