import type { SubscriptionAccessStatus } from "@/lib/billing/paid-till";

export type SubscriptionGateAction = "allow" | "block_renewal" | "block_unknown";

export type ProgramSubscriptionGateResult = {
  gateAction: SubscriptionGateAction;
  billingKnown: boolean;
  subscriptionAccess: SubscriptionAccessStatus;
};

/**
 * When true, missing or errored billing lookups allow portal access (legacy migration).
 * Default: fail closed in production, fail open in non-production.
 */
export function isRenewalGateLegacyFailOpenEnabled(): boolean {
  const explicit = process.env.RENEWAL_GATE_LEGACY_FAIL_OPEN?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function unknownBillingAccess(message: string): SubscriptionAccessStatus {
  return {
    isActive: false,
    isExpired: false,
    expiresAt: null,
    message,
  };
}

function legacyFailOpenAccess(): SubscriptionAccessStatus {
  return {
    isActive: true,
    isExpired: false,
    expiresAt: null,
    message: null,
  };
}

export function resolveProgramSubscriptionGate(input: {
  found: boolean;
  subscriptionAccess?: SubscriptionAccessStatus | null;
  programLabel?: string;
  reason?: "not_found" | "load_error";
}): ProgramSubscriptionGateResult {
  const label = input.programLabel || "this program";

  if (input.found && input.subscriptionAccess) {
    const access = input.subscriptionAccess;
    if (access.isExpired || !access.isActive) {
      return {
        gateAction: "block_renewal",
        billingKnown: true,
        subscriptionAccess: access,
      };
    }

    return {
      gateAction: "allow",
      billingKnown: true,
      subscriptionAccess: access,
    };
  }

  if (isRenewalGateLegacyFailOpenEnabled()) {
    return {
      gateAction: "allow",
      billingKnown: false,
      subscriptionAccess: legacyFailOpenAccess(),
    };
  }

  const message =
    input.reason === "load_error"
      ? "We couldn't verify your subscription right now. Please try again or contact support."
      : `We couldn't find billing details for ${label}. Update billing or contact support to continue.`;

  return {
    gateAction: "block_unknown",
    billingKnown: false,
    subscriptionAccess: unknownBillingAccess(message),
  };
}
