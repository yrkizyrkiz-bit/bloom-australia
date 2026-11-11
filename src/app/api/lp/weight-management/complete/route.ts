import { after, NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  LP_WM_STAFF_INBOX,
  lpWmStaffNotificationEmail,
  lpWmWelcomeEmail,
} from "@/lib/lp/weight-management-emails";
import {
  LP_WM_APPOINTMENT_TYPE,
  LP_WM_ASSESSMENT_CENTS,
  LP_WM_PURCHASE_TYPE,
  collectLpWmUtm,
  validateLpWmContact,
  validateLpWmSlot,
} from "@/lib/lp/weight-management-funnel";
import {
  TO_PROCESS_STATUS,
  createToProcess,
  findOpenToProcessLeadByEmail,
  findToProcessByAccessToken,
  findToProcessByPaymentIntent,
  markToProcessEmailsSent,
  markToProcessPaid,
} from "@/lib/lp/to-process";
import { LP_FUNNEL_SOURCE } from "@/lib/lp/weight-management";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Payments are not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const accessToken = String(body.accessToken || "").trim();
    if (accessToken.length < 32) {
      const ipLimited = await enforceIpRateLimit(
        req,
        "lp-wm-complete:ip",
        RATE_LIMITS.checkoutIp
      );
      if (!ipLimited.allowed) {
        return rateLimitExceededResponse(ipLimited.retryAfterSec);
      }
    }

    const paymentIntentId = String(body.paymentIntentId || "").trim();
    if (!paymentIntentId.startsWith("pi_")) {
      return NextResponse.json({ error: "Payment is required" }, { status: 400 });
    }

    const contact = validateLpWmContact(body);
    if (!contact.ok) {
      return NextResponse.json({ error: contact.error }, { status: 400 });
    }
    const slot = validateLpWmSlot(body);
    if (!slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment was not completed" }, { status: 400 });
    }
    if (
      paymentIntent.amount !== LP_WM_ASSESSMENT_CENTS ||
      paymentIntent.currency !== "aud" ||
      paymentIntent.metadata?.purchaseType !== LP_WM_PURCHASE_TYPE ||
      paymentIntent.metadata?.source !== LP_FUNNEL_SOURCE
    ) {
      return NextResponse.json({ error: "Payment does not match this assessment" }, { status: 400 });
    }

    const existing =
      (accessToken.length >= 32 ? await findToProcessByAccessToken(accessToken) : null) ??
      (await findToProcessByPaymentIntent(paymentIntentId)) ??
      (await findOpenToProcessLeadByEmail(contact.value.email));

    const paidFields = {
      firstName: contact.value.firstName,
      lastName: contact.value.lastName,
      email: contact.value.email,
      phone: contact.value.phone,
      appointmentSlotId: slot.value.slotId,
      appointmentStart: new Date(slot.value.startTime),
      appointmentEnd: new Date(slot.value.endTime),
      stripePaymentIntentId: paymentIntentId,
    };

    const row =
      (existing ? await markToProcessPaid(existing.id, paidFields) : null) ??
      (await createToProcess({
        ...paidFields,
        appointmentType: LP_WM_APPOINTMENT_TYPE,
        amountCents: LP_WM_ASSESSMENT_CENTS,
        source: LP_FUNNEL_SOURCE,
        utm: collectLpWmUtm(String(body.search || "")),
        status: TO_PROCESS_STATUS.paid,
      }));

    if (!row.emailsSentAt) {
      const payload = {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        appointmentStart: (row.appointmentStart ?? new Date(slot.value.startTime)).toISOString(),
        paymentIntentId,
      };
      after(async () => {
        try {
          const welcome = lpWmWelcomeEmail(payload);
          const staff = lpWmStaffNotificationEmail(payload);
          await Promise.allSettled([
            sendEmail({
              to: row.email,
              subject: welcome.subject,
              body: welcome.html,
              text: welcome.text,
              process: "bookings",
            }),
            sendEmail({
              to: LP_WM_STAFF_INBOX,
              subject: staff.subject,
              body: staff.html,
              text: staff.text,
              process: "bookings",
            }),
          ]);
          await markToProcessEmailsSent(row.id);
        } catch (error) {
          console.error("[lp/weight-management/complete] emails", error);
        }
      });
    }

    return NextResponse.json({
      accessToken: row.accessToken,
      status: row.status,
    });
  } catch (error) {
    console.error("[lp/weight-management/complete]", error);
    return NextResponse.json({ error: "Failed to save your booking" }, { status: 500 });
  }
}
