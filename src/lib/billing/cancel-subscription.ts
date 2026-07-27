import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  isProgramKey,
  normalizeProgramKey,
  PROGRAM_LABELS,
  PROGRAM_TO_ESSENTIAL_SLUG,
  SCOPE_LABELS,
  type ProgramKey,
  type ScopeKey,
} from "@/lib/membership/keys";
import {
  revokeEntitlement,
  syncEntitlementsFromSignals,
} from "@/lib/membership/entitlement-service";
import { sendMembershipCancellationEmail } from "@/lib/email";
import { syncMemberSubscriptionFromStripe } from "./sync-subscription";
import { getMemberBillingOverview, programSlugFromProgramKey } from "./member-billing-summary";
import type { BillableScopeKey } from "./paid-till";

export type CancelMembershipEffective = "period_end" | "immediate";

export type CancelMemberProgramInput = {
  memberId: string;
  /** Program slug (`hair_loss`) or canonical key (`HAIR_LOSS`) or scope slug (`organ_care`). */
  program: string;
  effective?: CancelMembershipEffective;
  reason?: string;
  cancelledBy: string;
  cancelledByName?: string;
};

export type CancelMemberProgramResult = {
  program: string;
  programLabel: string;
  effective: CancelMembershipEffective;
  stripeCancelled: string[];
  stripeScheduled: string[];
  entitlementsRevoked: string[];
  entitlementsScheduled: string[];
  programMembersUpdated: number;
  accessEndsAt: string | null;
};

const SCOPE_SLUG: Record<BillableScopeKey, string> = {
  BIOLOGICAL_CLOCK: "biological_clock",
  ORGAN_CARE: "organ_care",
};

type BillingTarget =
  | { kind: "program"; key: ProgramKey; slug: string; label: string }
  | { kind: "scope"; key: BillableScopeKey | "MEMBERSHIP"; slug: string; label: string };

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function resolveBillingTarget(input: string): BillingTarget | null {
  const normalized = input.trim().toLowerCase().replace(/-/g, "_");

  if (normalized === "membership" || normalized === "sanative_membership") {
    return {
      kind: "scope",
      key: "MEMBERSHIP",
      slug: "membership",
      label: SCOPE_LABELS.MEMBERSHIP,
    };
  }

  if (normalized === "biological_clock") {
    return {
      kind: "scope",
      key: "BIOLOGICAL_CLOCK",
      slug: SCOPE_SLUG.BIOLOGICAL_CLOCK,
      label: SCOPE_LABELS.BIOLOGICAL_CLOCK,
    };
  }
  if (normalized === "organ_care") {
    return {
      kind: "scope",
      key: "ORGAN_CARE",
      slug: SCOPE_SLUG.ORGAN_CARE,
      label: SCOPE_LABELS.ORGAN_CARE,
    };
  }

  const programKey = normalizeProgramKey(input);
  if (programKey) {
    return {
      kind: "program",
      key: programKey,
      slug: programSlugFromProgramKey(programKey),
      label: PROGRAM_LABELS[programKey],
    };
  }

  return null;
}

function productProgramForTarget(target: BillingTarget): string {
  return target.key;
}

async function appendEntitlementCancellationNote(params: {
  userId: string;
  type: "PROGRAM" | "SCOPE";
  key: string;
  note: string;
  expiresAt?: Date | null;
}) {
  const row = await prisma.entitlement.findFirst({
    where: { userId: params.userId, type: params.type, key: params.key },
  });
  if (!row) return;

  const stamp = new Date().toISOString();
  const mergedNotes = [row.notes, `[${stamp}] ${params.note}`].filter(Boolean).join("\n");

  await prisma.entitlement.update({
    where: { id: row.id },
    data: {
      notes: mergedNotes,
      ...(params.expiresAt ? { expiresAt: params.expiresAt } : {}),
    },
  });
}

async function maybeRevokeSharedProgramEssential(
  userId: string,
  cancelledProgram: ProgramKey
) {
  const essentialSlug = PROGRAM_TO_ESSENTIAL_SLUG[cancelledProgram];
  const remainingPrograms = await prisma.entitlement.findMany({
    where: {
      userId,
      type: "PROGRAM",
      status: { in: ["ACTIVE", "PENDING"] },
    },
  });

  const stillNeedsEssential = remainingPrograms.some((row) => {
    if (!isProgramKey(row.key)) return false;
    return PROGRAM_TO_ESSENTIAL_SLUG[row.key] === essentialSlug;
  });

  if (!stillNeedsEssential) {
    await revokeEntitlement({
      userId,
      type: "SCOPE",
      key: "PROGRAM_ESSENTIAL",
    });
  }
}

async function cancelStripeSubscription(
  stripe: Stripe,
  subscriptionId: string,
  effective: CancelMembershipEffective
) {
  if (effective === "period_end") {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
  return stripe.subscriptions.cancel(subscriptionId);
}

async function updateProgramMemberStatus(
  userId: string,
  target: BillingTarget,
  effective: CancelMembershipEffective
) {
  if (effective !== "immediate") return 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return 0;

  const members = await prisma.programMember.findMany({
    where: { email: user.email.toLowerCase() },
    select: { id: true, program: true },
  });

  let updated = 0;
  for (const member of members) {
    const memberKey =
      target.kind === "program" ? normalizeProgramKey(member.program) : null;
    const matchesProgram = memberKey === target.key;
    const matchesScope =
      target.kind === "scope" &&
      (member.program === target.key || normalizeProgramKey(member.program) === null);

    if (!matchesProgram && !matchesScope) continue;

    await prisma.programMember.update({
      where: { id: member.id },
      data: { membershipStatus: "CANCELLED" },
    });
    updated += 1;
  }

  return updated;
}

async function refreshMemberStatusIfFullyCancelled(userId: string) {
  const activePrograms = await prisma.entitlement.count({
    where: {
      userId,
      type: "PROGRAM",
      status: { in: ["ACTIVE", "PENDING"] },
    },
  });
  const activeScopes = await prisma.entitlement.count({
    where: {
      userId,
      type: "SCOPE",
      status: { in: ["ACTIVE", "PENDING"] },
      key: { in: ["MEMBERSHIP", "ORGAN_CARE", "BIOLOGICAL_CLOCK", "COMPLETE_HEALTH"] },
    },
  });

  if (activePrograms === 0 && activeScopes === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "CANCELLED",
        memberStatus: "CANCELLED",
        journeyStatus: "CANCELLED",
      },
    });
  }
}

export async function cancelMemberProgramSubscription(
  input: CancelMemberProgramInput
): Promise<CancelMemberProgramResult> {
  const target = resolveBillingTarget(input.program);
  if (!target) {
    throw new Error("Unknown program or membership type");
  }

  const effective = input.effective ?? "period_end";
  const productProgram = productProgramForTarget(target);

  const overview = await getMemberBillingOverview(input.memberId);
  const billing = overview.programs.find((row) => row.program === target.slug);
  const accessEndsAt =
    billing?.recurring.paidTill ??
    billing?.subscription?.currentPeriodEnd ??
    null;

  const stripeCancelled: string[] = [];
  const stripeScheduled: string[] = [];
  const entitlementsRevoked: string[] = [];
  const entitlementsScheduled: string[] = [];

  const stripe = getStripe();
  const memberSubs = await prisma.memberSubscription.findMany({
    where: {
      userId: input.memberId,
      product: { program: productProgram },
      status: { in: ["ACTIVE", "PAST_DUE"] },
    },
    include: { product: true, billingPrice: true },
  });

  for (const memberSub of memberSubs) {
    if (memberSub.stripeSubscriptionId && stripe) {
      const updated = await cancelStripeSubscription(
        stripe,
        memberSub.stripeSubscriptionId,
        effective
      );
      await syncMemberSubscriptionFromStripe(updated, {
        userId: input.memberId,
        changedBy: input.cancelledBy,
        changeType:
          effective === "immediate" ? "admin_cancelled" : "admin_cancel_scheduled",
      });

      if (effective === "immediate") {
        stripeCancelled.push(memberSub.stripeSubscriptionId);
      } else {
        stripeScheduled.push(memberSub.stripeSubscriptionId);
      }

      await prisma.memberSubscriptionHistory.create({
        data: {
          memberSubscriptionId: memberSub.id,
          changeType:
            effective === "immediate" ? "ADMIN_CANCELLED" : "ADMIN_CANCEL_SCHEDULED",
          changedBy: input.cancelledBy,
          notes: input.reason ?? undefined,
          fromBillingPriceId: memberSub.billingPriceId,
          toBillingPriceId: memberSub.billingPriceId,
          fromPlanTier: memberSub.product.planTier,
          toPlanTier: memberSub.product.planTier,
        },
      });
    } else if (effective === "immediate") {
      await prisma.memberSubscription.update({
        where: { id: memberSub.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });
    } else {
      await prisma.memberSubscription.update({
        where: { id: memberSub.id },
        data: { cancelAtPeriodEnd: true },
      });
    }
  }

  if (
    target.kind === "scope" &&
    (target.key === "ORGAN_CARE" || target.key === "MEMBERSHIP")
  ) {
    const legacy = await prisma.membershipSubscription.findUnique({
      where: { userId: input.memberId },
    });
    if (legacy?.stripeSubscriptionId && stripe) {
      const updated = await cancelStripeSubscription(
        stripe,
        legacy.stripeSubscriptionId,
        effective
      );
      if (effective === "immediate") {
        stripeCancelled.push(legacy.stripeSubscriptionId);
        await prisma.membershipSubscription.update({
          where: { userId: input.memberId },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
      } else {
        stripeScheduled.push(legacy.stripeSubscriptionId);
      }
      void updated;
    } else if (legacy && effective === "immediate") {
      // One-off billing (no Stripe subscription) — cancel the record directly.
      await prisma.membershipSubscription.update({
        where: { userId: input.memberId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    }
  }

  const cancellationNote = `Admin cancellation (${effective.replace("_", " ")}): ${input.reason || "Member requested cancellation"}`;

  if (target.kind === "program") {
    if (effective === "immediate") {
      await revokeEntitlement({
        userId: input.memberId,
        type: "PROGRAM",
        key: target.key,
      });
      entitlementsRevoked.push(target.key);
      await maybeRevokeSharedProgramEssential(input.memberId, target.key);
    } else {
      await appendEntitlementCancellationNote({
        userId: input.memberId,
        type: "PROGRAM",
        key: target.key,
        note: cancellationNote,
        expiresAt: accessEndsAt ? new Date(accessEndsAt) : null,
      });
      entitlementsScheduled.push(target.key);
    }
  } else {
    if (effective === "immediate") {
      await revokeEntitlement({
        userId: input.memberId,
        type: "SCOPE",
        key: target.key as ScopeKey,
      });
      entitlementsRevoked.push(target.key);
    } else {
      await appendEntitlementCancellationNote({
        userId: input.memberId,
        type: "SCOPE",
        key: target.key,
        note: cancellationNote,
        expiresAt: accessEndsAt ? new Date(accessEndsAt) : null,
      });
      entitlementsScheduled.push(target.key);
    }
  }

  const programMembersUpdated = await updateProgramMemberStatus(
    input.memberId,
    target,
    effective
  );

  if (effective === "immediate") {
    await refreshMemberStatusIfFullyCancelled(input.memberId);
  }

  if (target.kind === "scope" && target.key === "MEMBERSHIP") {
    // Membership bundles Essential + Clock + Organ Care; re-sync so the bundle
    // scopes follow the cancelled subscription state.
    if (effective === "immediate") {
      await syncEntitlementsFromSignals(input.memberId).catch((err) =>
        console.error("[cancel-subscription] entitlement sync failed:", err)
      );
    }
    const member = await prisma.user.findUnique({
      where: { id: input.memberId },
      select: { email: true, firstName: true },
    });
    if (member?.email) {
      await sendMembershipCancellationEmail({
        to: member.email,
        firstName: member.firstName || "",
        accessEndsAt: effective === "immediate" ? null : accessEndsAt,
      }).catch((err) =>
        console.error("[cancel-subscription] cancellation email failed:", err)
      );
    }
  }

  const authorName = input.cancelledByName ?? "Admin";
  await prisma.internalNote.create({
    data: {
      userId: input.memberId,
      memberId: input.memberId,
      title: `${target.label} subscription cancelled`,
      content: [
        `Program: ${target.label}`,
        `Effective: ${effective === "period_end" ? "End of billing period" : "Immediately"}`,
        accessEndsAt
          ? `Access until: ${new Date(accessEndsAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : null,
        input.reason ? `Reason: ${input.reason}` : null,
        stripeCancelled.length
          ? `Stripe cancelled: ${stripeCancelled.join(", ")}`
          : null,
        stripeScheduled.length
          ? `Stripe cancel scheduled: ${stripeScheduled.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      category: "BILLING",
      createdBy: input.cancelledBy,
      authorId: input.cancelledBy,
      authorName,
    },
  });

  return {
    program: target.slug,
    programLabel: target.label,
    effective,
    stripeCancelled,
    stripeScheduled,
    entitlementsRevoked,
    entitlementsScheduled,
    programMembersUpdated,
    accessEndsAt,
  };
}

export function listCancellablePrograms(
  programs: Array<{ program: string; programLabel: string; recurring?: { status?: string } }>
) {
  return programs.filter(
    (row) =>
      row.recurring?.status !== "cancelled" &&
      row.program !== "other"
  );
}
