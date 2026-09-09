const FACE_ID_DISMISS_PREFIX = "sanative_faceid_prompt_dismissed";

export type FaceIdDeviceEnv = {
  userAgent?: string;
  mobile?: boolean;
  coarse?: boolean;
  narrow?: boolean;
};

export function isFaceIdDevice(env?: FaceIdDeviceEnv): boolean {
  if (env) {
    const mobileUa = /iPhone|iPad|iPod|Android|Mobile/i.test(env.userAgent || "");
    return Boolean(env.mobile || mobileUa || (env.coarse && env.narrow));
  }
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  const uaMobile = userAgentData?.mobile === true;
  const mobileUa = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const narrow = window.matchMedia?.("(max-width: 900px)").matches ?? false;
  return Boolean(uaMobile || mobileUa || (coarse && narrow));
}

/**
 * True when this browser can run a platform biometric (Face ID / Touch ID / fingerprint).
 * Do not require a "mobile" user-agent — iPhone Safari "Request Desktop Website" looks like a Mac
 * but Face ID still works.
 */
export async function canUseFaceId(): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (typeof window.PublicKeyCredential !== "function") return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    // Fall through to a soft device heuristic.
  }
  // Older browsers: allow an attempt on phone-like clients.
  return isFaceIdDevice();
}

export function faceIdPromptDismissed(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(`${FACE_ID_DISMISS_PREFIX}_${userId}`) === "1";
  } catch {
    return true;
  }
}

export function dismissFaceIdPrompt(userId: string) {
  try {
    window.localStorage.setItem(`${FACE_ID_DISMISS_PREFIX}_${userId}`, "1");
  } catch {
    // ignore
  }
}

export function deviceNameFromUserAgent(userAgent = ""): string {
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/Android/i.test(userAgent)) return "Android";
  return "This device";
}
