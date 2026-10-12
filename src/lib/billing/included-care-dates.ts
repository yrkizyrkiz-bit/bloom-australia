import type { ProgramKey } from "@/lib/membership/keys";
import { normalizeProgramKey } from "@/lib/membership/keys";

export const DEFAULT_INCLUDED_CARE_DAYS = 30;
export const DEFAULT_CHARGE_LEAD_DAYS = 7;
export const QUARTER_DAYS = 90;
export const YEAR_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export type IncludedCarePolicy = {
  enabled: boolean;
  includedDays: number;
  chargeLeadDays: number;
};

export type IncludedCareSlotState = "OPEN" | "RESERVED" | "USED";

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function normalizeIncludedCarePolicy(input?: {
  enabled?: boolean | null;
  includedDays?: number | null;
  chargeLeadDays?: number | null;
}): IncludedCarePolicy {
  const includedDays = Math.max(
    0,
    Math.floor(input?.includedDays ?? DEFAULT_INCLUDED_CARE_DAYS)
  );
  const chargeLeadDays = Math.max(
    0,
    Math.floor(input?.chargeLeadDays ?? DEFAULT_CHARGE_LEAD_DAYS)
  );
  const enabled = input?.enabled !== false && includedDays > 0;
  return {
    enabled,
    includedDays: enabled ? includedDays : 0,
    chargeLeadDays,
  };
}

export function intervalDaysForTerm(term: string | null | undefined): number {
  return term === "12m" ? YEAR_DAYS : QUARTER_DAYS;
}

export function billingIntervalForTerm(term: string | null | undefined): "YEARLY" | "QUARTERLY" {
  return term === "12m" ? "YEARLY" : "QUARTERLY";
}

/** Public funnel intent. Biomarkers and unknown intents do not reserve a program. */
export function programKeyFromPublicIntent(intent: string | null | undefined): ProgramKey | null {
  return normalizeProgramKey(intent);
}

export function resolveApprovalProgramKey(
  category: string | null | undefined,
  reservedProgram: ProgramKey | null
): ProgramKey | null {
  if (category === "HAIR_LOSS") return "HAIR_LOSS";
  if (category === "SEXUAL_HEALTH") return "MENS_HEALTH_SEXUAL";
  if (category === "HORMONE_THERAPY") return "WOMENS_HEALTH_SEXUAL";
  if (category === "WEIGHT_MANAGEMENT") return "WEIGHT_MANAGEMENT";
  return reservedProgram;
}

export function canReserveIncludedSlot(input: {
  policy: IncludedCarePolicy;
  slotStatus: IncludedCareSlotState | null;
  initialConsultCompleted: boolean;
}): boolean {
  if (!input.policy.enabled) return false;
  if (input.initialConsultCompleted) return false;
  return input.slotStatus === "OPEN";
}

/**
 * Paid coverage starts `includedDays` after approval when the slot is on.
 * The card is charged `chargeLeadDays` before that. A charge time that is not
 * in the future means collect at approval.
 */
export function programCareDates(input: {
  approvedAt: Date;
  policy: IncludedCarePolicy;
  usesIncludedSlot: boolean;
  intervalDays: number;
}): {
  serviceStart: Date;
  serviceEnd: Date;
  chargeAt: Date;
  chargeNow: boolean;
  nextRenewalAt: Date;
} {
  const serviceStart = input.usesIncludedSlot
    ? addDays(input.approvedAt, input.policy.includedDays)
    : input.approvedAt;
  const serviceEnd = addDays(serviceStart, input.intervalDays);
  const lead = input.policy.chargeLeadDays;
  const firstCharge = addDays(serviceStart, -lead);
  const chargeNow = firstCharge.getTime() <= input.approvedAt.getTime() + 60_000;
  const chargeAt = chargeNow ? input.approvedAt : firstCharge;
  const nextRenewalAt = addDays(serviceEnd, -lead);
  return { serviceStart, serviceEnd, chargeAt, chargeNow, nextRenewalAt };
}

/** Portal purchase already collected this period. The next card charge is one week before it ends. */
export function renewalAfterPrepaidPeriod(input: {
  paidAt: Date;
  intervalDays: number;
  chargeLeadDays: number;
}): { serviceStart: Date; serviceEnd: Date; nextChargeAt: Date } {
  const serviceStart = input.paidAt;
  const serviceEnd = addDays(serviceStart, input.intervalDays);
  const lead = Math.min(input.chargeLeadDays, input.intervalDays);
  const nextChargeAt = addDays(serviceEnd, -lead);
  return { serviceStart, serviceEnd, nextChargeAt };
}

export function applyProgramCareInvoice(input: {
  servicePeriodStart: Date;
  servicePeriodEnd: Date;
  nextChargeAt: Date;
  intervalDays: number;
  chargeLeadDays: number;
  paidAt: Date;
}): {
  servicePeriodStart: Date;
  servicePeriodEnd: Date;
  nextChargeAt: Date;
  kind: "first_fee" | "renewal" | "ignore";
} {
  const skewMs = 2 * DAY_MS;
  if (input.paidAt.getTime() + skewMs < input.nextChargeAt.getTime()) {
    return { ...input, kind: "ignore" };
  }

  const firstFee = input.nextChargeAt.getTime() < input.servicePeriodStart.getTime();
  if (firstFee) {
    return {
      servicePeriodStart: input.servicePeriodStart,
      servicePeriodEnd: input.servicePeriodEnd,
      nextChargeAt: addDays(input.servicePeriodEnd, -input.chargeLeadDays),
      kind: "first_fee",
    };
  }

  const servicePeriodStart = input.servicePeriodEnd;
  const servicePeriodEnd = addDays(servicePeriodStart, input.intervalDays);
  return {
    servicePeriodStart,
    servicePeriodEnd,
    nextChargeAt: addDays(servicePeriodEnd, -input.chargeLeadDays),
    kind: "renewal",
  };
}

export function periodLabel(term: string | null | undefined): string {
  return term === "12m" ? "annual" : "every 3 months";
}
