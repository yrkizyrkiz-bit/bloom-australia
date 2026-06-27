import { validatePrePaymentConsent } from "@/lib/legal/consent-record";

export async function requirePrePaymentConsent(input: {
  consentRecordId?: string | null;
  userId?: string;
  email?: string;
}) {
  if (!input.consentRecordId) {
    return {
      ok: false as const,
      error: "Payment consent is required before completing checkout",
      status: 400,
    };
  }

  const result = await validatePrePaymentConsent({
    consentRecordId: input.consentRecordId,
    userId: input.userId,
    email: input.email,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, status: result.status };
  }

  return { ok: true as const, recordId: result.recordId };
}
