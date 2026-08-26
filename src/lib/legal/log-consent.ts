import { LEGAL_VERSION } from "@/lib/legal/constants";
import { PRE_PAYMENT_CONSENT_CHECKBOX_LABEL } from "@/lib/legal/pre-payment-consent";

export type ConsentType = "PRE_QUIZ" | "CONTACT_SMS_EMAIL" | "PRE_PAYMENT";

export type RecordConsentResult =
  | { ok: true; id: string; acceptedAt: string }
  | { ok: false; error: string };

type ConsentRequestBody = {
  consentType: ConsentType;
  sourcePage: string;
  email?: string;
  userId?: string;
  consentVersion?: string;
  checkboxLabels?: string[];
};

async function postConsent(body: ConsentRequestBody): Promise<RecordConsentResult> {
  try {
    const response = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        consentVersion: body.consentVersion ?? LEGAL_VERSION,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: data.error || `Failed to record consent (${response.status})`,
      };
    }

    const data = await response.json();
    return { ok: true, id: data.id, acceptedAt: data.acceptedAt };
  } catch {
    return { ok: false, error: "Failed to record consent" };
  }
}

/** Passive consent for quiz/contact steps, non-blocking for funnel continuity. */
export async function logConsentEvent(input: {
  consentType: Exclude<ConsentType, "PRE_PAYMENT">;
  sourcePage: string;
  email?: string;
  userId?: string;
}): Promise<void> {
  await postConsent(input);
}

/** Explicit pre-payment consent, must succeed before charging the card. */
export async function recordPrePaymentConsent(input: {
  sourcePage: string;
  email?: string;
  userId?: string;
}): Promise<RecordConsentResult> {
  return postConsent({
    consentType: "PRE_PAYMENT",
    sourcePage: input.sourcePage,
    email: input.email,
    userId: input.userId,
    checkboxLabels: [PRE_PAYMENT_CONSENT_CHECKBOX_LABEL],
  });
}
