import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { resolveSanativeMembershipStripePriceId } from "@/lib/portal/sanative-membership";
import { createIncompleteSubscription } from "@/lib/portal/stripe-subscription";
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

/**
 * Create an incomplete Stripe Subscription for Sanative Membership.
 * First invoice is paid via Payment Element; the card is saved as the
 * subscription default for annual auto-renewal.
 */
export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "membership-checkout:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await req.json().catch(() => ({}));
    const { sessionToken, email, phone, firstName, lastName, postcode, intentProgram } =
      body as Record<string, string | undefined>;

    if (!sessionToken) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const tokenData = verifyVerifiedContactToken(sessionToken);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const identity = await bindCheckoutEmail(tokenData, email);
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: identity.status });
    }
    const resolvedEmail = identity.email;
    const resolvedPhone = phone || (tokenData.type === "phone" ? tokenData.contact : "");

    if (!resolvedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { stripePriceId, pricing } = await resolveSanativeMembershipStripePriceId();
    const stripe = getStripeClient();

    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: resolvedEmail,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Keep contact details current for receipts / renewals.
      await stripe.customers
        .update(customerId, {
          name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
          phone: resolvedPhone || undefined,
        })
        .catch(() => undefined);
    } else {
      const customer = await stripe.customers.create({
        email: resolvedEmail,
        name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
        phone: resolvedPhone || undefined,
      });
      customerId = customer.id;
    }

    const metadata = {
      purchaseType: "sanative_membership",
      productSlug: "sanative_membership",
      billingPriceId: pricing.billingPriceId ?? "",
      intentProgram: intentProgram || "",
      email: resolvedEmail,
      phone: resolvedPhone || "",
      postcode: postcode || "",
      userId: identity.userId || "",
    };

    const { subscriptionId, clientSecret, paymentIntentId } =
      await createIncompleteSubscription({
        customerId,
        items: [{ priceId: stripePriceId }],
        metadata,
        description: `${pricing.productName}, annual membership (auto-renews)`,
      });

    // Stripe receipts go to the customer email on the subscription invoices.
    await stripe.paymentIntents
      .update(paymentIntentId, { receipt_email: resolvedEmail })
      .catch(() => undefined);

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
      subscriptionId,
      customerId,
      amountAud: pricing.amountAud,
      priceLabel: pricing.priceLabel,
      productName: pricing.productName,
      autoRenew: true,
    });
  } catch (error) {
    console.error("[public/membership-checkout/intent]", error);
    return NextResponse.json({ error: "Failed to initialise payment" }, { status: 500 });
  }
}
