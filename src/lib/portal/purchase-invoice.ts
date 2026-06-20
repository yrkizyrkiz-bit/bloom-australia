import { prisma } from "@/lib/prisma";

/** Idempotent invoice + activation guard keyed by Stripe PaymentIntent id. */
export async function hasProcessedPortalPayment(paymentIntentId: string): Promise<boolean> {
  const existing = await prisma.invoice.findUnique({
    where: { stripeId: paymentIntentId },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function recordPortalPaymentInvoice(params: {
  userId: string;
  paymentIntentId: string;
  amountAud: number;
  description: string;
}) {
  const existing = await prisma.invoice.findUnique({
    where: { stripeId: params.paymentIntentId },
  });
  if (existing) return existing;

  return prisma.invoice.create({
    data: {
      userId: params.userId,
      stripeId: params.paymentIntentId,
      amount: params.amountAud,
      currency: "AUD",
      status: "PAID",
      paidAt: new Date(),
      description: params.description,
    },
  });
}
