import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { resolveSanativeMembershipStripePriceId } from "@/lib/portal/sanative-membership";
import { createIncompleteSubscription } from "@/lib/portal/stripe-subscription";
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
 * Create a Sanative Membership PaymentIntent for an in-progress public funnel
 * (email already captured, user record exists). No OTP session required.
 */
export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "membership-checkout-funnel:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await req.json().catch(() => ({}));
    const { userId, email, phone, firstName, lastName, postcode, intentProgram } =
      body as Record<string, string | undefined>;

    const resolvedEmail = (email || "").toLowerCase().trim();
    if (!userId || !resolvedEmail) {
      return NextResponse.json({ error: "Account details are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user || user.email.toLowerCase() !== resolvedEmail) {
      return NextResponse.json({ error: "Account not found" }, { status: 403 });
    }

    const existing = await prisma.membershipSubscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });
    if (existing?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You already have an active membership" },
        { status: 400 }
      );
    }

    const { stripePriceId, pricing } = await resolveSanativeMembershipStripePriceId();
    const stripe = getStripeClient();
    const resolvedPhone = phone || user.phone || "";
    const resolvedFirst = firstName || user.firstName || "";
    const resolvedLast = lastName || user.lastName || "";

    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: resolvedEmail,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      await stripe.customers
        .update(customerId, {
          name: [resolvedFirst, resolvedLast].filter(Boolean).join(" ") || undefined,
          phone: resolvedPhone || undefined,
          metadata: { userId: user.id },
        })
        .catch(() => undefined);
    } else {
      const customer = await stripe.customers.create({
        email: resolvedEmail,
        name: [resolvedFirst, resolvedLast].filter(Boolean).join(" ") || undefined,
        phone: resolvedPhone || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const metadata = {
      purchaseType: "sanative_membership",
      productSlug: "sanative_membership",
      billingPriceId: pricing.billingPriceId ?? "",
      intentProgram: intentProgram || "weight_management",
      email: resolvedEmail,
      phone: resolvedPhone,
      postcode: postcode || "",
      userId: user.id,
      source: "weight_management_assessment",
    };

    const { subscriptionId, clientSecret, paymentIntentId } =
      await createIncompleteSubscription({
        customerId,
        items: [{ priceId: stripePriceId }],
        metadata,
        description: `${pricing.productName}, annual membership (auto-renews)`,
      });

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
    console.error("[public/membership-checkout/funnel-intent]", error);
    return NextResponse.json({ error: "Failed to initialise payment" }, { status: 500 });
  }
}
