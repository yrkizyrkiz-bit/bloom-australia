import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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
