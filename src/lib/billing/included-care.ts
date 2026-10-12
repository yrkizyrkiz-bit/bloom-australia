import type { ProgramKey } from "@/lib/membership/keys";
import { prisma } from "@/lib/prisma";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { PROGRAM_LABELS } from "@/lib/membership/keys";
import {
  canReserveIncludedSlot,
  DEFAULT_CHARGE_LEAD_DAYS,
  DEFAULT_INCLUDED_CARE_DAYS,
  normalizeIncludedCarePolicy,
  programKeyFromPublicIntent,
  type IncludedCarePolicy,
  type IncludedCareSlotState,
} from "@/lib/billing/included-care-dates";

export type IncludedCareSlotRecord = {
  status: IncludedCareSlotState;
  programKey: ProgramKey | null;
  billingTerm: string | null;
};

function asSlotStatus(value: string | null | undefined): IncludedCareSlotState {
  if (value === "RESERVED" || value === "USED") return value;
  return "OPEN";
}

export async function getIncludedCarePolicy(): Promise<IncludedCarePolicy> {
  const row = await prisma.billingSettings.findUnique({ where: { id: "default" } });
  return normalizeIncludedCarePolicy({
    enabled: row?.includedCareEnabled,
    includedDays: row?.includedCareDays,
    chargeLeadDays: row?.chargeLeadDays,
  });
}

export async function saveIncludedCarePolicy(input: {
  enabled: boolean;
  includedDays: number;
}): Promise<IncludedCarePolicy> {
  const days = Math.max(0, Math.floor(input.includedDays));
  const enabled = input.enabled && days > 0;
  await prisma.billingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      includedCareEnabled: enabled,
      includedCareDays: days || DEFAULT_INCLUDED_CARE_DAYS,
      chargeLeadDays: DEFAULT_CHARGE_LEAD_DAYS,
    },
    update: {
      includedCareEnabled: enabled,
      includedCareDays: days || DEFAULT_INCLUDED_CARE_DAYS,
    },
  });
  return getIncludedCarePolicy();
}

async function initialConsultCompleted(userId: string): Promise<boolean> {
  const completed = await prisma.consultationBooking.findFirst({
    where: { userId, status: "BOOKING_COMPLETED" },
    select: { id: true },
  });
  return !!completed;
}

async function readSlot(userId: string): Promise<IncludedCareSlotRecord | null> {
  const row = await prisma.includedCareSlot.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    status: asSlotStatus(row.status),
    programKey: programKeyFromPublicIntent(row.programKey),
    billingTerm: row.billingTerm,
  };
}

/** New membership only. Existing clinical subscriptions keep the member off the offer. */
export async function openIncludedCareForNewMember(
  userId: string,
  intentProgram: string | null | undefined
): Promise<void> {
  const existing = await prisma.includedCareSlot.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;

  const clinical = await prisma.memberSubscription.findFirst({
    where: { userId, product: { program: { not: "MEMBERSHIP" } } },
    select: { id: true },
  });
  if (clinical) return;

  const policy = await getIncludedCarePolicy();
  const programKey = programKeyFromPublicIntent(intentProgram);
  if (!policy.enabled) {
    await prisma.includedCareSlot.create({
      data: { userId, status: "USED", usedAt: new Date(), usedReason: "included_care_disabled" },
    });
    return;
  }

  if (!programKey) {
    await prisma.includedCareSlot.create({ data: { userId, status: "OPEN" } });
    return;
  }

  await prisma.includedCareSlot.create({
    data: {
      userId,
      status: "RESERVED",
      programKey,
      billingTerm: "3m",
      reservedAt: new Date(),
    },
  });
  await grantReservedEntitlement(userId, programKey);
}

export async function includedCareAvailableFor(
  userId: string,
  programKey: ProgramKey
): Promise<boolean> {
  const [policy, slot, consultDone, alreadyOnProgram] = await Promise.all([
    getIncludedCarePolicy(),
    readSlot(userId),
    initialConsultCompleted(userId),
    prisma.memberSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        product: { program: programKey },
      },
      select: { id: true },
    }),
  ]);
  if (alreadyOnProgram) return false;
  if (slot?.status === "RESERVED") return slot.programKey === programKey;
  return canReserveIncludedSlot({
    policy,
    slotStatus: slot?.status ?? null,
    initialConsultCompleted: consultDone,
  });
}

export async function reserveIncludedCareProgram(input: {
  userId: string;
  programKey: ProgramKey;
  billingTerm: string;
}): Promise<{ reserved: boolean; reason?: string }> {
  const available = await includedCareAvailableFor(input.userId, input.programKey);
  if (!available) return { reserved: false, reason: "Included care is not available for this program" };

  const term = input.billingTerm === "12m" ? "12m" : "3m";
  const existing = await prisma.includedCareSlot.findUnique({ where: { userId: input.userId } });
  if (!existing || existing.status === "USED") {
    return { reserved: false, reason: "Included care is not available for this program" };
  }

  if (existing.status === "RESERVED" && existing.programKey === input.programKey) {
    await prisma.includedCareSlot.update({
      where: { userId: input.userId },
      data: { billingTerm: term },
    });
    return { reserved: true };
  }

  if (existing.status !== "OPEN") {
    return { reserved: false, reason: "Included care is already reserved" };
  }

  await prisma.includedCareSlot.update({
    where: { userId: input.userId },
    data: {
      status: "RESERVED",
      programKey: input.programKey,
      billingTerm: term,
      reservedAt: new Date(),
      usedAt: null,
      usedReason: null,
    },
  });
  await grantReservedEntitlement(input.userId, input.programKey);
  return { reserved: true };
}

async function grantReservedEntitlement(userId: string, programKey: ProgramKey) {
  const label = PROGRAM_LABELS[programKey];
  await grantEntitlement({
    userId,
    type: "PROGRAM",
    key: programKey,
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Included care reserved: ${label}. The program fee starts after doctor approval.`,
  }).catch((err) => console.error("[included-care] entitlement grant failed:", err));
}

export async function loadIncludedCareForBilling(userId: string): Promise<{
  policy: IncludedCarePolicy;
  slot: IncludedCareSlotRecord | null;
}> {
  const [policy, slot] = await Promise.all([
    getIncludedCarePolicy(),
    readSlot(userId),
  ]);
  return { policy, slot };
}

/** A declined initial consult ends the offer, whichever program was reserved. */
export async function closeReservedIncludedCareSlot(userId: string): Promise<boolean> {
  const slot = await prisma.includedCareSlot.findUnique({ where: { userId } });
  if (!slot || slot.status !== "RESERVED") return false;
  await prisma.includedCareSlot.update({
    where: { userId },
    data: { status: "USED", usedAt: new Date(), usedReason: "declined" },
  });
  return true;
}

/** Decline uses the slot only when this consult is the reserved program. */
export async function useIncludedCareSlot(input: {
  userId: string;
  programKey: ProgramKey;
  reason: "approved" | "declined" | "cancelled";
}): Promise<boolean> {
  const slot = await prisma.includedCareSlot.findUnique({ where: { userId: input.userId } });
  if (!slot || slot.status !== "RESERVED" || slot.programKey !== input.programKey) return false;
  await prisma.includedCareSlot.update({
    where: { userId: input.userId },
    data: { status: "USED", usedAt: new Date(), usedReason: input.reason },
  });
  return true;
}
