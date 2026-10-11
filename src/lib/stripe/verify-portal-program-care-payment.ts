import type Stripe from "stripe";
import type { DoctorPrescriptionCategory } from "@/lib/admin/doctor-consult-programs";
import { normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type VerifyPortalProgramCarePaymentParams = {
  userId: string;
  consultationId: string;
  prescriptionCategory: DoctorPrescriptionCategory;
  paymentIntentId?: string | null;
};

export type VerifyPortalProgramCarePaymentResult =
  | { ok: true; paymentIntentId: string; programKey: ProgramKey; backfilled: boolean }
  | { ok: false; error: string; status: number };

/** Prescription category → program keys that satisfy the care payment gate. */
export function programKeysForPrescriptionCategory(
  category: DoctorPrescriptionCategory
): ProgramKey[] {
  switch (category) {
    case "HAIR_LOSS":
      return ["HAIR_LOSS"];
    case "SEXUAL_HEALTH":
      return ["MENS_HEALTH_SEXUAL", "MENS_HEALTH_VITALITY"];
    case "HORMONE_THERAPY":
      return ["WOMENS_HEALTH_SEXUAL", "WOMENS_HEALTH_VITALITY"];
    case "WEIGHT_MANAGEMENT":
      return ["WEIGHT_MANAGEMENT"];
    default:
      return [];
  }
}

/**
 * Program payments recorded on entitlements or pre-triage tasks come first.
 * The consult's PaymentIntent is last: a shared visit can carry another
 * program's charge, and that must not hide the payment for this decision.
 */
export function orderProgramPaymentIntentIds(input: {
  matchingIds: string[];
  otherIds: string[];
}): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of [...input.matchingIds, ...input.otherIds]) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ordered.push(trimmed);
  }
  return ordered;
}

/** Catalog amount, when we still have the price row, must equal what Stripe charged. */
export function portalProgramChargeAllowed(
  paidCents: number,
  catalogAmountCents: number | null | undefined
): boolean {
  if (!Number.isFinite(paidCents) || paidCents <= 0) return false;
  if (catalogAmountCents == null) return true;
  return paidCents === catalogAmountCents;
}

/**
 * A portal charge that is not this program is not a reason to stop looking.
 * A refund or wrong-user result on the program's own charge is final.
 */
export function portalPaymentFailureIsTerminal(input: {
  error: string;
  paymentWasForThisProgram: boolean;
}): boolean {
  if (input.error === "Payment does not match the prescribed program") return false;
  return input.paymentWasForThisProgram;
}

function extractPiFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/\bPI\s+(pi_[A-Za-z0-9]+)/i) || notes.match(/\b(pi_[A-Za-z0-9]+)\b/);
  return match?.[1] ?? null;
}

function parsePreTriagePayload(notes: string | null | undefined): {
  source?: string;
  paymentIntentId?: string;
  programKey?: string;
} | null {
  if (!notes?.trim()) return null;
  try {
    return JSON.parse(notes) as {
      source?: string;
      paymentIntentId?: string;
      programKey?: string;
    };
  } catch {
    return null;
  }
}

async function collectProgramPaymentIntentIds(
  params: VerifyPortalProgramCarePaymentParams,
  allowedKeys: ProgramKey[]
): Promise<{ orderedIds: string[]; matchingIds: Set<string> }> {
  const matchingIds: string[] = [];
  const otherIds: string[] = [];

  const tasks = await prisma.preTriageTask.findMany({
    where: {
      patientId: params.userId,
      OR: [{ bookingId: params.consultationId }, { notes: { contains: "portal_upsell" } }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { bookingId: true, notes: true },
  });

  for (const task of tasks) {
    const payload = parsePreTriagePayload(task.notes);
    if (!payload?.paymentIntentId) continue;
    if (payload.source && payload.source !== "portal_upsell") continue;
    const key = normalizeProgramKey(payload.programKey);
    if (key && allowedKeys.includes(key)) {
      matchingIds.push(payload.paymentIntentId);
    } else if (task.bookingId === params.consultationId) {
      otherIds.push(payload.paymentIntentId);
    }
  }

  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId: params.userId,
      type: "PROGRAM",
      key: { in: allowedKeys },
      status: "ACTIVE",
    },
    orderBy: { grantedAt: "desc" },
    select: { notes: true },
  });

  for (const row of entitlements) {
    const pi = extractPiFromNotes(row.notes);
    if (pi) matchingIds.push(pi);
  }

  if (params.paymentIntentId?.trim()) {
    otherIds.push(params.paymentIntentId.trim());
  }

  const orderedIds = orderProgramPaymentIntentIds({ matchingIds, otherIds });
  return {
    orderedIds,
    matchingIds: new Set(matchingIds.map((id) => id.trim()).filter(Boolean)),
  };
}

async function assertPortalProgramPaymentIntent(params: {
  paymentIntentId: string;
  userId: string;
  allowedKeys: ProgramKey[];
}): Promise<
  | { ok: true; paymentIntent: Stripe.PaymentIntent; programKey: ProgramKey }
  | { ok: false; error: string; status: number }
> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Payment verification is not configured", status: 503 };
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
      expand: ["latest_charge"],
    });
  } catch {
    return { ok: false, error: "Invalid payment intent", status: 400 };
  }

  if (paymentIntent.status !== "succeeded") {
    return { ok: false, error: "Program payment not completed", status: 402 };
  }

  const latestCharge = paymentIntent.latest_charge;
  if (latestCharge) {
    const charge =
      typeof latestCharge === "string"
        ? await stripe.charges.retrieve(latestCharge)
        : latestCharge;
    if (charge.refunded || charge.amount_refunded > 0) {
      return { ok: false, error: "Program payment has been refunded", status: 402 };
    }
  }

  const metadata = paymentIntent.metadata ?? {};
  if ((metadata.userId || "").trim() !== params.userId) {
    return { ok: false, error: "Payment does not belong to this user", status: 403 };
  }

  const programKey = normalizeProgramKey(metadata.programKey);
  if (!programKey || !params.allowedKeys.includes(programKey)) {
    return {
      ok: false,
      error: "Payment does not match the prescribed program",
      status: 400,
    };
  }

  const billingPriceId = metadata.firstMonthBillingPriceId?.trim();
  if (billingPriceId) {
    const price = await prisma.billingPrice.findUnique({
      where: { id: billingPriceId },
      select: { amountCents: true },
    });
    if (
      price &&
      !portalProgramChargeAllowed(paymentIntent.amount, price.amountCents)
    ) {
      return { ok: false, error: "Invalid payment amount", status: 400 };
    }
  }

  return { ok: true, paymentIntent, programKey };
}

async function hasActivePaidProgram(
  userId: string,
  allowedKeys: ProgramKey[]
): Promise<ProgramKey | null> {
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      type: "PROGRAM",
      key: { in: allowedKeys },
      status: "ACTIVE",
    },
    select: { key: true },
  });
  if (entitlement) {
    const key = normalizeProgramKey(entitlement.key);
    if (key && allowedKeys.includes(key)) return key;
  }

  const memberSub = await prisma.memberSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      product: { program: { in: allowedKeys } },
    },
    select: { product: { select: { program: true } } },
  });
  const subKey = normalizeProgramKey(memberSub?.product.program);
  if (subKey && allowedKeys.includes(subKey)) return subKey;

  return null;
}

/**
 * A verified portal program charge stands on its own.
 * An empty result, or a PaymentIntent that belongs to another program, falls
 * through to the membership amount check.
 */
export function weightDecisionShouldUseMembershipPayment(
  result: VerifyPortalProgramCarePaymentResult
): boolean {
  if (result.ok) return result.paymentIntentId.length === 0;
  return (
    result.error === "No first-month payment on record for this consultation" ||
    result.error === "Payment does not match the prescribed program"
  );
}

/**
 * Doctor gate for portal program payments (weight, hair, sexual, women's).
 * A shared consult can store another program's PaymentIntent; the charge for
 * the program being approved is used instead.
 */
export async function verifyPortalProgramCarePaymentForDecision(
  params: VerifyPortalProgramCarePaymentParams
): Promise<VerifyPortalProgramCarePaymentResult> {
  const allowedKeys = programKeysForPrescriptionCategory(params.prescriptionCategory);
  if (allowedKeys.length === 0) {
    return {
      ok: false,
      error: "Unsupported prescription category for program payment check",
      status: 400,
    };
  }

  const { orderedIds, matchingIds } = await collectProgramPaymentIntentIds(
    params,
    allowedKeys
  );

  if (orderedIds.length > 0) {
    let lastFailure: { error: string; status: number } | null = null;
    for (const candidatePi of orderedIds) {
      const verified = await assertPortalProgramPaymentIntent({
        paymentIntentId: candidatePi,
        userId: params.userId,
        allowedKeys,
      });
      if (!verified.ok) {
        lastFailure = verified;
        if (
          portalPaymentFailureIsTerminal({
            error: verified.error,
            paymentWasForThisProgram: matchingIds.has(candidatePi),
          })
        ) {
          return verified;
        }
        continue;
      }

      let backfilled = false;
      if (params.paymentIntentId !== candidatePi) {
        const updated = await prisma.consultationBooking.updateMany({
          where: {
            id: params.consultationId,
            userId: params.userId,
            OR: [{ paymentIntentId: null }, { paymentIntentId: "" }],
          },
          data: { paymentIntentId: candidatePi },
        });
        backfilled = updated.count > 0;
      }

      return {
        ok: true,
        paymentIntentId: candidatePi,
        programKey: verified.programKey,
        backfilled,
      };
    }

    if (lastFailure) return lastFailure;
  }

  // Paid program on file but PI not recoverable (e.g. legacy) — still allow prescribe.
  const activeProgram = await hasActivePaidProgram(params.userId, allowedKeys);
  if (activeProgram) {
    return {
      ok: true,
      paymentIntentId: "",
      programKey: activeProgram,
      backfilled: false,
    };
  }

  return {
    ok: false,
    error: "No first-month payment on record for this consultation",
    status: 400,
  };
}

/**
 * When care links a portal-upsell pre-triage task to a booking, copy the PI onto
 * the consult so doctor approval can verify it.
 */
export async function attachPortalUpsellPaymentToBooking(params: {
  bookingId: string;
  taskNotes: string | null | undefined;
}): Promise<string | null> {
  const payload = parsePreTriagePayload(params.taskNotes);
  const paymentIntentId = payload?.paymentIntentId?.trim();
  if (!paymentIntentId) return null;
  if (payload?.source && payload.source !== "portal_upsell") return null;

  await prisma.consultationBooking.updateMany({
    where: {
      id: params.bookingId,
      OR: [{ paymentIntentId: null }, { paymentIntentId: "" }],
    },
    data: { paymentIntentId },
  });

  return paymentIntentId;
}
