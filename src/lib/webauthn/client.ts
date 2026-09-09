"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export function webauthnErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") {
      if (/enable|setup|enroll|register/i.test(fallback)) {
        return "Face ID setup was cancelled. On iPhone: Settings → Passwords → Password Options → turn on AutoFill Passwords, then try again.";
      }
      return "Face ID was cancelled.";
    }
    if (error.name === "NotSupportedError" || error.name === "InvalidStateError") {
      return "This browser can’t use Face ID. Open Sanative in Safari on your iPhone and try again.";
    }
    if (error.message) return error.message;
  }
  return fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function enrollFaceId() {
  const optionsRes = await fetch("/api/auth/webauthn/register-options", { method: "POST" });
  const options = await readJson(optionsRes);
  if (!optionsRes.ok) {
    throw new Error(options.error || "Could not start Face ID setup");
  }

  const attestation = await startRegistration({ optionsJSON: options });
  const verifyRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attestation),
  });
  const data = await readJson(verifyRes);
  if (!verifyRes.ok) {
    throw new Error(data.error || "Could not enable Face ID");
  }
  return data.passkey;
}

export async function loginWithFaceId(email?: string) {
  const optionsRes = await fetch("/api/auth/webauthn/login-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email?.trim() || undefined }),
  });
  const options = await readJson(optionsRes);
  if (!optionsRes.ok) {
    throw new Error(options.error || "Face ID is not available");
  }

  const assertion = await startAuthentication({ optionsJSON: options });
  const verifyRes = await fetch("/api/auth/webauthn/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assertion),
  });
  const data = await readJson(verifyRes);
  if (!verifyRes.ok) {
    throw new Error(data.error || "Face ID could not be verified");
  }
  return data.webauthnToken as string;
}
