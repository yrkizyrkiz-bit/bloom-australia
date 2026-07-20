export type IntakeSubmitOutcome =
  | { ok: true; userId: string }
  | { ok: false; emailExists: true }
  | {
      ok: false;
      resumeVerificationRequired: true;
      email: string;
      firstName?: string | null;
    }
  | { ok: false; emailExists: false; message: string };

export type SubmitPublicIntakeOptions = {
  resumeVerificationToken?: string;
};

export async function submitPublicIntake(
  payload: Record<string, unknown>,
  options?: SubmitPublicIntakeOptions
): Promise<IntakeSubmitOutcome> {
  const response = await fetch("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      ...(options?.resumeVerificationToken
        ? { resumeVerificationToken: options.resumeVerificationToken }
        : {}),
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return { ok: true, userId: data.userId as string };
  }

  if (data.code === "EMAIL_EXISTS") {
    return { ok: false, emailExists: true };
  }

  if (data.code === "RESUME_VERIFICATION_REQUIRED") {
    return {
      ok: false,
      resumeVerificationRequired: true,
      email: (data.email as string) || String(payload.email || ""),
      firstName:
        typeof data.firstName === "string" ? data.firstName : null,
    };
  }

  return {
    ok: false,
    emailExists: false,
    message:
      (data.message as string) ||
      (data.error as string) ||
      (data.detail as string) ||
      "Could not save your details",
  };
}

export async function sendPublicResumeVerificationCode(
  email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: email.toLowerCase().trim(), type: "email" }),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        message: (data.error as string) || "Failed to send verification code",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to send verification code" };
  }
}

export async function verifyPublicResumeCode(
  email: string,
  code: string
): Promise<
  { ok: true; sessionToken: string } | { ok: false; message: string }
> {
  try {
    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: email.toLowerCase().trim(),
        type: "email",
        code,
      }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.sessionToken !== "string") {
      return {
        ok: false,
        message: (data.error as string) || "Invalid verification code",
      };
    }
    return { ok: true, sessionToken: data.sessionToken };
  } catch {
    return { ok: false, message: "Failed to verify code" };
  }
}

export async function fetchExistingAccountFirstName(
  email: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.firstName === "string" && data.firstName.trim()
      ? data.firstName.trim()
      : null;
  } catch {
    return null;
  }
}

export function buildLoginRedirectUrl(redirectPath: string): string {
  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}
