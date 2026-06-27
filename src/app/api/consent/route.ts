import { NextRequest, NextResponse } from "next/server";
import { LEGAL_VERSION } from "@/lib/legal/constants";
import { createConsentRecord } from "@/lib/legal/consent-record";
import {
  PRE_PAYMENT_CONSENT_CHECKBOX_LABEL,
  PRE_PAYMENT_CONSENT_METHOD,
} from "@/lib/legal/pre-payment-consent";
import {
  getRequestIpAddress,
  getRequestUserAgent,
} from "@/lib/legal/request-metadata";
import { resolveConsentUserId } from "@/lib/legal/resolve-consent-user";

const ALLOWED_TYPES = new Set(["PRE_QUIZ", "CONTACT_SMS_EMAIL", "PRE_PAYMENT"]);

function sanitizeOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const consentType = String(body.consentType || "");
    const sourcePage = String(body.sourcePage || "");
    const consentVersion = String(body.consentVersion || LEGAL_VERSION);
    const email = sanitizeOptionalString(body.email);
    const ipAddress = getRequestIpAddress(request);
    const userAgent = getRequestUserAgent(request);
    const userId = await resolveConsentUserId({
      userId: sanitizeOptionalString(body.userId),
      email,
    });

    if (!ALLOWED_TYPES.has(consentType) || !sourcePage) {
      return NextResponse.json({ error: "Invalid consent payload" }, { status: 400 });
    }

    if (consentType === "PRE_PAYMENT") {
      const checkboxLabels = Array.isArray(body.checkboxLabels)
        ? body.checkboxLabels.map(String)
        : [];

      if (checkboxLabels.length === 0) {
        return NextResponse.json(
          { error: "Payment consent requires accepted checkbox labels" },
          { status: 400 }
        );
      }

      if (!checkboxLabels.includes(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL)) {
        return NextResponse.json(
          { error: "Required payment consent checkbox was not accepted" },
          { status: 400 }
        );
      }

      const record = await createConsentRecord({
        consentType,
        consentVersion,
        sourcePage,
        email,
        userId,
        ipAddress,
        userAgent,
        payload: {
          method: PRE_PAYMENT_CONSENT_METHOD,
          checkboxLabels,
        },
      });

      return NextResponse.json({ id: record.id, acceptedAt: record.acceptedAt });
    }

    const record = await createConsentRecord({
      consentType,
      consentVersion,
      sourcePage,
      email,
      userId,
      ipAddress,
      userAgent,
      payload: { method: "passive_continue" },
    });

    return NextResponse.json({ id: record.id, acceptedAt: record.acceptedAt });
  } catch (error) {
    console.error("[consent] Failed to record consent:", error);
    const message =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? error.message
        : "Failed to record consent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
