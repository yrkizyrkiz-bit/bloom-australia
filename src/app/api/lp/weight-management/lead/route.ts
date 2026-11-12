import { NextRequest, NextResponse } from "next/server";
import {
  LP_WM_APPOINTMENT_TYPE,
  LP_WM_ASSESSMENT_CENTS,
  collectLpWmUtm,
  readLpWmQuizMap,
  validateLpWmIdentity,
  validateLpWmQuizAnswers,
  validateLpWmSlot,
} from "@/lib/lp/weight-management-funnel";
import { upsertToProcessLead } from "@/lib/lp/to-process";
import { LP_FUNNEL_SOURCE } from "@/lib/lp/weight-management";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = String(body.accessToken || "").trim();
    const hasExistingLead = accessToken.length >= 32;

    if (!hasExistingLead) {
      const ipLimited = await enforceIpRateLimit(
        req,
        "lp-wm-lead:ip",
        RATE_LIMITS.lpWmLeadIp
      );
      if (!ipLimited.allowed) {
        return rateLimitExceededResponse(ipLimited.retryAfterSec);
      }
    }

    const identity = validateLpWmIdentity(body);
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: 400 });
    }

    const hasSlot = Boolean(String(body.slotId || "").trim());
    const slot = hasSlot ? validateLpWmSlot(body) : null;
    if (hasSlot && slot && !slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 400 });
    }
    const slotValue = slot && slot.ok ? slot.value : null;

    const quizComplete = validateLpWmQuizAnswers(body.quizAnswers);
    const quizAnswers = quizComplete.ok ? quizComplete.value : readLpWmQuizMap(body.quizAnswers);

    const row = await upsertToProcessLead({
      accessToken: accessToken.length >= 32 ? accessToken : null,
      firstName: identity.value.firstName,
      lastName: identity.value.lastName,
      email: identity.value.email,
      phone: identity.value.phone,
      appointmentSlotId: slotValue?.slotId ?? null,
      appointmentStart: slotValue ? new Date(slotValue.startTime) : null,
      appointmentEnd: slotValue ? new Date(slotValue.endTime) : null,
      appointmentType: LP_WM_APPOINTMENT_TYPE,
      stripePaymentIntentId: String(body.paymentIntentId || "").trim().startsWith("pi_")
        ? String(body.paymentIntentId).trim()
        : null,
      amountCents: LP_WM_ASSESSMENT_CENTS,
      source: LP_FUNNEL_SOURCE,
      utm: collectLpWmUtm(String(body.search || "")),
      quizAnswers,
    });

    return NextResponse.json({
      accessToken: row.accessToken,
      status: row.status,
    });
  } catch (error) {
    console.error("[lp/weight-management/lead]", error);
    return NextResponse.json({ error: "Could not save your details" }, { status: 500 });
  }
}
