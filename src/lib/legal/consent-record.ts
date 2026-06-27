import { prisma } from "@/lib/prisma";
import { LEGAL_VERSION } from "@/lib/legal/constants";
import {
  PRE_PAYMENT_CONSENT_CHECKBOX_LABEL,
  PRE_PAYMENT_CONSENT_MAX_AGE_MS,
  PRE_PAYMENT_CONSENT_METHOD,
} from "@/lib/legal/pre-payment-consent";

export type ConsentPayload = {
  method: "passive_continue" | "explicit_checkbox";
  checkboxLabels?: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CreateConsentRecordInput = {
  consentType: string;
  consentVersion: string;
  sourcePage: string;
  email?: string;
  userId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload: ConsentPayload;
};

export async function createConsentRecord(input: CreateConsentRecordInput) {
  const payload: ConsentPayload = {
    ...input.payload,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  };

  let userId = input.userId;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      userId = undefined;
    }
  }

  try {
    return await prisma.consentRecord.create({
      data: {
        consentType: input.consentType,
        consentVersion: input.consentVersion,
        sourcePage: input.sourcePage,
        email: input.email,
        userId,
        payload,
      },
    });
  } catch (error) {
    console.error("[consent] createConsentRecord failed:", error);
    throw error;
  }
}

export type ValidatePrePaymentConsentInput = {
  consentRecordId: string;
  userId?: string;
  email?: string;
};

export type ValidatePrePaymentConsentResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string; status: number };

export async function validatePrePaymentConsent(
  input: ValidatePrePaymentConsentInput
): Promise<ValidatePrePaymentConsentResult> {
  const record = await prisma.consentRecord.findUnique({
    where: { id: input.consentRecordId },
  });

  if (!record) {
    return { ok: false, error: "Payment consent record not found", status: 400 };
  }

  if (record.consentType !== "PRE_PAYMENT") {
    return { ok: false, error: "Invalid payment consent type", status: 400 };
  }

  if (record.consentVersion !== LEGAL_VERSION) {
    return {
      ok: false,
      error: "Payment consent is out of date — please review and accept again",
      status: 400,
    };
  }

  const payload = record.payload as ConsentPayload | null;
  if (!payload || payload.method !== PRE_PAYMENT_CONSENT_METHOD) {
    return { ok: false, error: "Explicit payment consent was not recorded", status: 400 };
  }

  const labels = payload.checkboxLabels ?? [];
  if (!labels.includes(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL)) {
    return { ok: false, error: "Required payment consent checkbox was not accepted", status: 400 };
  }

  if (input.userId && record.userId && record.userId !== input.userId) {
    return { ok: false, error: "Payment consent does not belong to this user", status: 403 };
  }

  if (input.email && record.email && record.email.toLowerCase() !== input.email.toLowerCase()) {
    return { ok: false, error: "Payment consent does not match this email", status: 403 };
  }

  const ageMs = Date.now() - record.acceptedAt.getTime();
  if (ageMs > PRE_PAYMENT_CONSENT_MAX_AGE_MS) {
    return {
      ok: false,
      error: "Payment consent has expired — please review and accept again",
      status: 400,
    };
  }

  return { ok: true, recordId: record.id };
}
