import { NextRequest, NextResponse } from "next/server";
import {
  LP_WM_APPOINTMENT_TYPE,
  LP_WM_ASSESSMENT_CENTS,
  collectLpWmUtm,
  validateLpWmContact,
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

    const contact = validateLpWmContact(body);
    if (!contact.ok) {
      return NextResponse.json({ error: contact.error }, { status: 400 });
    }
    const slot = validateLpWmSlot(body);
    if (!slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 400 });
    }

    const paymentIntentId = String(body.paymentIntentId || "").trim();

    const row = await upsertToProcessLead({
      accessToken: accessToken.length >= 32 ? accessToken : null,
      firstName: contact.value.firstName,
      lastName: contact.value.lastName,
      email: contact.value.email,
      phone: contact.value.phone,
      appointmentSlotId: slot.value.slotId,
      appointmentStart: new Date(slot.value.startTime),
      appointmentEnd: new Date(slot.value.endTime),
      appointmentType: LP_WM_APPOINTMENT_TYPE,
      stripePaymentIntentId: paymentIntentId.startsWith("pi_") ? paymentIntentId : null,
      amountCents: LP_WM_ASSESSMENT_CENTS,
      source: LP_FUNNEL_SOURCE,
      utm: collectLpWmUtm(String(body.search || "")),
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
