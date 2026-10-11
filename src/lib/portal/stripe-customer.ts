import type Stripe from "stripe";
import { isEstablishedMember } from "@/lib/auth/member-identity-guard";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

async function isEstablishedUserId(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      subscriptionStatus: true,
      journeyStatus: true,
      memberStatus: true,
    },
  });
  return user ? isEstablishedMember(user) : false;
}

/**
 * Resolve the Stripe customer for a public membership checkout.
 * Established members: reuse the existing customer (or create email-only).
 * Never write name/phone from the public form onto their Stripe record.
 */
export async function resolvePublicCheckoutStripeCustomer(params: {
  stripe: Stripe;
  email: string;
  userId?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<string> {
  const established = await isEstablishedUserId(params.userId);
  const existing = await params.stripe.customers.list({
    email: params.email,
    limit: 1,
  });
  const name =
    [params.firstName, params.lastName].filter(Boolean).join(" ") || undefined;

  if (existing.data.length > 0) {
    const customerId = existing.data[0].id;
    if (!established) {
      await params.stripe.customers
        .update(customerId, {
          name,
          phone: params.phone || undefined,
          ...(params.userId ? { metadata: { userId: params.userId } } : {}),
        })
        .catch(() => undefined);
    }
    return customerId;
  }

  const customer = await params.stripe.customers.create({
    email: params.email,
    ...(established
      ? {}
      : {
          name,
          phone: params.phone || undefined,
        }),
    ...(params.userId ? { metadata: { userId: params.userId } } : {}),
  });
  return customer.id;
}

export async function getOrCreateStripeCustomer(userId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!user) throw new Error("User not found");

  const existing = await stripe.customers.list({ email: user.email, limit: 10 });
  const byUserId = existing.data.find((c) => c.metadata?.userId === user.id);
  if (byUserId) {
    return { customerId: byUserId.id, user };
  }
  if (existing.data.length > 0) {
    return { customerId: existing.data[0].id, user };
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim() || undefined,
    metadata: { userId: user.id },
  });

  return { customerId: customer.id, user };
}
