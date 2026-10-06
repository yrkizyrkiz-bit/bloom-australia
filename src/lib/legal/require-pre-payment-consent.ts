import { validatePrePaymentConsent, findLatestValidPrePaymentConsent } from "@/lib/legal/consent-record";

export async function requirePrePaymentConsent(input: {
  consentRecordId?: string | null;
  userId?: string;
  email?: string;
}) {
  if (!input.consentRecordId) {
    if (input.userId) {
      const latest = await findLatestValidPrePaymentConsent({
        userId: input.userId,
        email: input.email,
      });
      if (latest.ok) return { ok: true as const, recordId: latest.recordId };
      return { ok: false as const, error: latest.error, status: latest.status };
    }
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
