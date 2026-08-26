import { prisma } from "@/lib/prisma";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { createOnboardingPreTriageTask } from "@/lib/funnel/program-pre-triage";
import { recordPortalPaymentInvoice } from "@/lib/portal/purchase-invoice";

export type ActivateOrganCareMembershipInput = {
  paymentIntentId: string;
  customerId?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
};

/** Idempotent activation for public Organ & Metabolic Care annual checkout. */
export async function activateOrganCarePublicMembership(
  input: ActivateOrganCareMembershipInput
): Promise<{ userId: string; email: string }> {
  const userEmail = input.email.toLowerCase().trim();
  if (!userEmail) {
    throw new Error("Email is required to activate organ care membership");
  }

  let user = await prisma.user.findUnique({ where: { email: userEmail } });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName || user.firstName,
        lastName: input.lastName || user.lastName,
        phone: input.phone ?? user.phone,
        dateOfBirth: input.dateOfBirth ?? user.dateOfBirth,
        address: input.address ?? user.address,
        addressLine1: input.addressLine1 ?? user.addressLine1,
        addressLine2: input.addressLine2 ?? user.addressLine2,
        suburb: input.suburb ?? user.suburb,
        state: input.state ?? user.state,
        postcode: input.postcode ?? user.postcode,
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "membership",
        journeyStatus: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        address: input.address ?? null,
        addressLine1: input.addressLine1 ?? null,
        addressLine2: input.addressLine2 ?? null,
        suburb: input.suburb ?? null,
        state: input.state ?? null,
        postcode: input.postcode ?? null,
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "membership",
        journeyStatus: "ACTIVE",
        role: "MEMBER",
      },
    });
  }

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

  const pricing = await getPublicOrganCareAnnualPricing();
  const amountAud = pricing.amountAud;

  await prisma.membershipSubscription.upsert({
    where: { userId: user.id },
    update: {
      stripeCustomerId: input.customerId ?? undefined,
      status: "ACTIVE",
      startDate: new Date(),
      currentPeriodEnd,
      amount: amountAud,
      currency: "AUD",
      billingCycle: "yearly",
      planName: "Organ & Metabolic Care",
    },
    create: {
      userId: user.id,
      stripeCustomerId: input.customerId ?? undefined,
      status: "ACTIVE",
      startDate: new Date(),
      currentPeriodEnd,
      amount: amountAud,
      currency: "AUD",
      billingCycle: "yearly",
      planName: "Organ & Metabolic Care",
    },
  });

  await grantEntitlement({
    userId: user.id,
    type: "SCOPE",
    key: "ORGAN_CARE",
    status: "ACTIVE",
    source: "SUBSCRIPTION",
    notes: `Public organ care membership. PI ${input.paymentIntentId}`,
  }).catch((err) =>
    console.error("[organ_care_membership] entitlement grant failed:", err)
  );

  await recordPortalPaymentInvoice({
    userId: user.id,
    paymentIntentId: input.paymentIntentId,
    amountAud,
    description: "Organ & Metabolic Care: annual membership",
  }).catch((err) =>
    console.error("[organ_care_membership] invoice record failed:", err)
  );

  await createOnboardingPreTriageTask({
    userId: user.id,
    programLabel: "Organ & Metabolic Care",
    programSlug: "organ_care",
    paymentIntentId: input.paymentIntentId,
  }).catch((err) =>
    console.error("[organ_care_membership] triage enqueue failed:", err)
  );

  return { userId: user.id, email: user.email };
}
