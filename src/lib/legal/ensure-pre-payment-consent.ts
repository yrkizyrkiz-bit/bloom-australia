import { recordPrePaymentConsent } from "@/lib/legal/log-consent";

export type EnsurePrePaymentConsentResult =
  | { ok: true; consentRecordId: string }
  | { ok: false; error: string };

/** Records explicit pre-payment consent immediately before charging the card. */
export async function ensurePrePaymentConsentRecorded(options: {
  consentChecked: boolean;
  sourcePage: string;
  email?: string;
  userId?: string;
}): Promise<EnsurePrePaymentConsentResult> {
  if (!options.consentChecked) {
    return {
      ok: false,
      error: "Please accept the terms before completing payment.",
    };
  }

  const result = await recordPrePaymentConsent({
    sourcePage: options.sourcePage,
    email: options.email,
    userId: options.userId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, consentRecordId: result.id };
}

export function paymentSourcePage(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/checkout";
}
