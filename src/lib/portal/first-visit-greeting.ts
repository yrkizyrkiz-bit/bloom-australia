const STORAGE_PREFIX = "sanative_portal_signed_in_";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** True until the member has completed their first portal landing on this browser. */
export function isFirstPortalSignIn(userId: string | null | undefined): boolean {
  if (!userId || typeof window === "undefined") return false;
  try {
    return !localStorage.getItem(storageKey(userId));
  } catch {
    return false;
  }
}

/** Call after the first-sign-in greeting has been shown. */
export function markPortalSignInComplete(userId: string | null | undefined): void {
  if (!userId || typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), "1");
  } catch {
    // private mode / blocked storage — treat as one-shot only this render
  }
}
