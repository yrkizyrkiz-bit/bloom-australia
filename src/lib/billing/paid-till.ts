import type { BillingInterval } from "@prisma/client";
import type { ProgramKey } from "@/lib/membership/keys";

export type BillableScopeKey = "BIOLOGICAL_CLOCK" | "ORGAN_CARE";

export type BillingInvoiceRow = {
  stripeId: string | null;
  description: string | null;
  amount: number;
  paidAt: Date | null;
};

export type SubscriptionAccessStatus = {
  isActive: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  message: string | null;
};

export function extractPaymentIntentId(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/\bPI\s+(pi_[a-zA-Z0-9]+)/i);
  return match?.[1] ?? null;
}

export function invoiceMatchesProgram(
  description: string | null | undefined,
  programKey: ProgramKey
): boolean {
  const text = (description || "").toLowerCase();
  if (!text) return false;

  switch (programKey) {
    case "HAIR_LOSS":
      return text.includes("hair");
    case "WEIGHT_MANAGEMENT":
      return (
        text.includes("weight") ||
        text.includes("sanative core") ||
        text.includes("sanative precision")
      );
    case "MENS_HEALTH_VITALITY":
      return (
        text.includes("vitality") ||
        text.includes("energy") ||
        ((text.includes("men's health") || text.includes("mens health")) &&
          !text.includes("sexual"))
      );
    case "WOMENS_HEALTH_VITALITY":
      return (
        text.includes("vitality") ||
        text.includes("energy") ||
        ((text.includes("women's health") || text.includes("womens health")) &&
          !text.includes("sexual"))
      );
    case "MENS_HEALTH_SEXUAL":
      return (
        text.includes("sexual") ||
        text.includes("erectile") ||
        text.includes("premature")
      );
    case "WOMENS_HEALTH_SEXUAL":
      return text.includes("sexual");
    default:
      return false;
  }
}

export function invoiceMatchesScope(
  description: string | null | undefined,
  scopeKey: BillableScopeKey
): boolean {
  const text = (description || "").toLowerCase();
  if (!text) return false;

  switch (scopeKey) {
    case "BIOLOGICAL_CLOCK":
      return (
        text.includes("biomarker") ||
        text.includes("biological") ||
        text.includes("essential panel") ||
        text.includes("extended panel") ||
        text.includes("comprehensive panel") ||
        /\b(essential|extended|comprehensive)\b/.test(text)
      );
    case "ORGAN_CARE":
      return (
        text.includes("organ care") ||
        text.includes("organ &") ||
        text.includes("metabolic care")
      );
    default:
      return false;
  }
}

export function invoiceMatchesBillingTarget(
  description: string | null | undefined,
  target: { programKey?: ProgramKey; scopeKey?: BillableScopeKey }
): boolean {
  if (target.programKey) return invoiceMatchesProgram(description, target.programKey);
  if (target.scopeKey) return invoiceMatchesScope(description, target.scopeKey);
  return false;
}

/** Prefer PaymentIntent id from entitlement notes; fall back to description matching. */
export function resolveInvoiceForBilling(
  invoices: BillingInvoiceRow[],
  entitlement: { notes: string | null } | null | undefined,
  matchers: { programKey?: ProgramKey; scopeKey?: BillableScopeKey }
): BillingInvoiceRow | undefined {
  const paymentIntentId = extractPaymentIntentId(entitlement?.notes);
  if (paymentIntentId) {
    const byPaymentIntent = invoices.find((inv) => inv.stripeId === paymentIntentId);
    if (byPaymentIntent) {
      if (matchers.scopeKey && !invoiceMatchesScope(byPaymentIntent.description, matchers.scopeKey)) {
        return undefined;
      }
      if (matchers.programKey && !invoiceMatchesProgram(byPaymentIntent.description, matchers.programKey)) {
        return undefined;
      }
      return byPaymentIntent;
    }
  }

  if (matchers.programKey) {
    const programKey = matchers.programKey;
    return invoices.find((inv) => invoiceMatchesProgram(inv.description, programKey));
  }
  if (matchers.scopeKey) {
    const scopeKey = matchers.scopeKey;
    return invoices.find((inv) => invoiceMatchesScope(inv.description, scopeKey));
  }
  return undefined;
}

export function addBillingInterval(start: Date, interval: BillingInterval): Date {
  const end = new Date(start);
  switch (interval) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1);
      break;
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3);
      break;
    case "BIANNUAL":
      end.setMonth(end.getMonth() + 6);
      break;
    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function invoiceCoversTarget(
  invoice: BillingInvoiceRow,
  entitlement: { notes: string | null } | null | undefined,
  matchers: { programKey?: ProgramKey; scopeKey?: BillableScopeKey }
): boolean {
  const paymentIntentId = extractPaymentIntentId(entitlement?.notes);
  if (paymentIntentId && invoice.stripeId === paymentIntentId) {
    if (matchers.scopeKey && !invoiceMatchesScope(invoice.description, matchers.scopeKey)) {
      return false;
    }
    if (matchers.programKey && !invoiceMatchesProgram(invoice.description, matchers.programKey)) {
      return false;
    }
    return true;
  }
  return invoiceMatchesBillingTarget(invoice.description, matchers);
}

/**
 * Latest paid-till across Stripe period ends and all matching paid invoices.
 * Each invoice extends access by one billing interval from its paid date.
 */
export function resolveLatestPaidTill(input: {
  billingInterval: BillingInterval;
  invoices: BillingInvoiceRow[];
  entitlement?: { notes: string | null } | null;
  matchers: { programKey?: ProgramKey; scopeKey?: BillableScopeKey };
  stripePeriodEnd?: Date | null;
  legacyPeriodEnd?: Date | null;
  intakePaidAt?: Date | null;
}): Date | null {
  const candidates: Date[] = [];

  if (input.stripePeriodEnd) {
    candidates.push(input.stripePeriodEnd);
  }
  if (input.legacyPeriodEnd) {
    candidates.push(input.legacyPeriodEnd);
  }

  for (const invoice of input.invoices) {
    if (!invoice.paidAt) continue;
    if (!invoiceCoversTarget(invoice, input.entitlement ?? null, input.matchers)) continue;
    candidates.push(addBillingInterval(invoice.paidAt, input.billingInterval));
  }

  if (input.intakePaidAt) {
    candidates.push(addBillingInterval(input.intakePaidAt, input.billingInterval));
  }

  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

export function evaluateSubscriptionAccess(input: {
  paidTill: Date | null;
  recurringStatus: "active" | "pending_approval" | "inactive" | "cancelled" | "past_due";
  memberSubStatus?: string | null;
  firstMonthPaid: boolean;
  programLabel: string;
}): SubscriptionAccessStatus {
  const now = Date.now();
  const expiresAt = input.paidTill?.toISOString() ?? null;

  if (input.memberSubStatus === "CANCELLED" && input.recurringStatus === "cancelled") {
    if (!input.paidTill || input.paidTill.getTime() < now) {
      return {
        isActive: false,
        isExpired: true,
        expiresAt,
        message: `Your ${input.programLabel} subscription was cancelled. Renew to regain access.`,
      };
    }
  }

  if (input.paidTill) {
    if (input.paidTill.getTime() >= now) {
      return {
        isActive: true,
        isExpired: false,
        expiresAt,
        message: null,
      };
    }

    return {
      isActive: false,
      isExpired: true,
      expiresAt,
      message: `Your ${input.programLabel} subscription expired on ${input.paidTill.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}. Update your payment to continue.`,
    };
  }

  if (input.firstMonthPaid && input.recurringStatus === "pending_approval") {
    return {
      isActive: true,
      isExpired: false,
      expiresAt: null,
      message: null,
    };
  }

  if (input.recurringStatus === "active" || input.memberSubStatus === "ACTIVE") {
    return {
      isActive: true,
      isExpired: false,
      expiresAt: null,
      message: null,
    };
  }

  if (input.firstMonthPaid) {
    return {
      isActive: true,
      isExpired: false,
      expiresAt: null,
      message: null,
    };
  }

  return {
    isActive: false,
    isExpired: true,
    expiresAt: null,
    message: `An active subscription is required to access ${input.programLabel}.`,
  };
}
