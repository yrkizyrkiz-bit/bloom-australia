export type IntakeSubmitOutcome =
  | { ok: true; userId: string }
  | { ok: false; emailExists: true }
  | { ok: false; emailExists: false; message: string };

export async function submitPublicIntake(
  payload: Record<string, unknown>
): Promise<IntakeSubmitOutcome> {
  const response = await fetch("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (response.ok) {
    return { ok: true, userId: data.userId as string };
  }

  if (data.code === "EMAIL_EXISTS") {
    return { ok: false, emailExists: true };
  }

  return {
    ok: false,
    emailExists: false,
    message:
      (data.error as string) ||
      (data.detail as string) ||
      "Could not save your details",
  };
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
