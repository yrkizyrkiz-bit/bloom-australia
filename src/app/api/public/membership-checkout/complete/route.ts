import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { activateSanativeMembership } from "@/lib/portal/sanative-membership";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";
import { MAGIC_LINK_BROWSER_TTL, signMagicLoginToken } from "@/lib/magic-link";
import { resolveAppBaseUrl } from "@/lib/app-base-url";
import { sendMembershipWelcomeEmail } from "@/lib/email";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";
import { getStripeSubscriptionPeriod } from "@/lib/stripe/subscription-period";
import {
  bindCheckoutEmail,
  verifyVerifiedContactToken,
} from "@/lib/auth/verified-contact-token";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

function parseAuDate(value?: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Activate Sanative Membership after the first subscription invoice is paid:
 * user record, Stripe subscription linkage, entitlements, invoice, triage,
 * magic login link + welcome email.
 */
export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "membership-checkout-complete:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const {
      paymentIntentId,
      subscriptionId: bodySubscriptionId,
      consentRecordId,
      sessionToken,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      gender,
      intentProgram,
      clientOrigin,
    } = body as Record<string, string | undefined>;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
    }

    const tokenData = verifyVerifiedContactToken(sessionToken);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const priorInvoice =
      typeof paymentIntentId === "string" && paymentIntentId
        ? await prisma.invoice.findUnique({
            where: { stripeId: paymentIntentId },
            select: { userId: true },
          })
        : null;
    const identity = await bindCheckoutEmail(tokenData, email, {
      activatedUserId: priorInvoice?.userId ?? null,
    });
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: identity.status });
    }
    const resolvedEmail = identity.email;
    if (!resolvedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      userId: identity.userId ?? undefined,
      email: resolvedEmail,
    });
    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }
    if (paymentIntent.metadata?.purchaseType !== "sanative_membership") {
      return NextResponse.json({ error: "Payment does not match this checkout" }, { status: 400 });
    }
    // The intent route stamped the verified email (and account, if any) on the
    // payment. Activation must land on that same identity.
    const paidForEmail = (paymentIntent.metadata?.email || "").toLowerCase().trim();
    if (paidForEmail && paidForEmail !== resolvedEmail) {
      return NextResponse.json({ error: "Payment does not match this checkout" }, { status: 400 });
    }
    const paidForUserId = paymentIntent.metadata?.userId || "";
    if (paidForUserId && identity.userId && paidForUserId !== identity.userId) {
      return NextResponse.json({ error: "Payment does not match this checkout" }, { status: 400 });
    }

    const stripeSubscriptionId =
      bodySubscriptionId ||
      paymentIntent.metadata?.subscriptionId ||
      null;

    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const period = getStripeSubscriptionPeriod(subscription);
      periodStart = period.start;
      periodEnd = period.end;
    }

    const result = await activateSanativeMembership({
      paymentIntentId,
      stripeSubscriptionId,
      customerId: (paymentIntent.customer as string) || null,
      email: resolvedEmail,
      firstName,
      lastName,
      phone: phone || (tokenData.type === "phone" ? tokenData.contact : null),
      dateOfBirth: parseAuDate(dateOfBirth),
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      gender: gender === "MALE" || gender === "FEMALE" ? gender : null,
      intentProgram: intentProgram || paymentIntent.metadata?.intentProgram || null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      await syncMemberSubscriptionFromStripe(subscription, {
        userId: result.userId,
        changeType: "SANATIVE_MEMBERSHIP_ACTIVATED",
      }).catch((err) =>
        console.error("[membership-checkout/complete] subscription sync failed:", err)
      );
    }

    const userForLink = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, firstName: true, passwordHash: true },
    });

    let magicLink: string | null = null;
    if (userForLink?.email) {
      const baseUrl = resolveAppBaseUrl({ clientOrigin, request });
      const linkFor = (token: string) =>
        `${baseUrl}/auth/magic?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent("/dashboard")}`;
      // The browser that just paid gets a short-lived link; the emailed copy keeps the 7-day life.
      magicLink = linkFor(
        signMagicLoginToken(userForLink.id, userForLink.email, MAGIC_LINK_BROWSER_TTL)
      );

      if (!result.alreadyProcessed) {
        await sendMembershipWelcomeEmail({
          to: userForLink.email,
          firstName: userForLink.firstName || firstName || "",
          magicLink: linkFor(signMagicLoginToken(userForLink.id, userForLink.email)),
          needsPassword: !userForLink.passwordHash,
        }).catch((err) =>
          console.error("[membership-checkout/complete] welcome email failed:", err)
        );
      }
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      email: result.email,
      subscriptionId: stripeSubscriptionId,
      subscriptionStatus: "ACTIVE",
      magicLink,
      needsPassword: Boolean(userForLink && !userForLink.passwordHash),
    });
  } catch (error) {
    console.error("[public/membership-checkout/complete]", error);
    const message = error instanceof Error ? error.message : "Failed to activate membership";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
