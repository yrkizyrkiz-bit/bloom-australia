const FACE_ID_DISMISS_PREFIX = "sanative_faceid_prompt_dismissed";
const FACE_ID_READY_KEY = "sanative_faceid_ready";

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
 * Whether we should offer Face ID UI. Prefer the platform-authenticator probe,
 * but do not hard-fail when it returns false — iOS/WebKit sometimes reports
 * unavailable even though Face ID registration still works after a user tap.
 */
export async function canUseFaceId(): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (typeof window.PublicKeyCredential === "function") {
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        if (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
          return true;
        }
      }
    } catch {
      // ignore probe errors and fall through
    }
    // WebAuthn exists — let the user try. Real failures surface from the OS prompt.
    return true;
  }
  return isFaceIdDevice();
}

/** True after Face ID was successfully set up or used on this browser. */
export function isFaceIdSetupOnThisDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FACE_ID_READY_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFaceIdSetupOnThisDevice() {
  try {
    window.localStorage.setItem(FACE_ID_READY_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearFaceIdSetupOnThisDevice() {
  try {
    window.localStorage.removeItem(FACE_ID_READY_KEY);
  } catch {
    // ignore
  }
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
