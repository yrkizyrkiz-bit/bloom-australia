import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isRenewalGateLegacyFailOpenEnabled,
  resolveProgramSubscriptionGate,
} from "@/lib/billing/subscription-gate";

describe("subscription gate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows active subscriptions when billing is known", () => {
    const gate = resolveProgramSubscriptionGate({
      found: true,
      programLabel: "Weight Management",
      subscriptionAccess: {
        isActive: true,
        isExpired: false,
        expiresAt: "2026-08-07T00:00:00.000Z",
        message: null,
      },
    });

    expect(gate.gateAction).toBe("allow");
    expect(gate.billingKnown).toBe(true);
  });

  it("blocks renewal when subscription is expired", () => {
    const gate = resolveProgramSubscriptionGate({
      found: true,
      programLabel: "Hair Health",
      subscriptionAccess: {
        isActive: false,
        isExpired: true,
        expiresAt: "2026-01-01T00:00:00.000Z",
        message: "Expired",
      },
    });

    expect(gate.gateAction).toBe("block_renewal");
    expect(gate.billingKnown).toBe(true);
  });

  it("fails closed when billing is missing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RENEWAL_GATE_LEGACY_FAIL_OPEN", "false");

    const gate = resolveProgramSubscriptionGate({
      found: false,
      programLabel: "Weight Management",
      reason: "not_found",
    });

    expect(gate.gateAction).toBe("block_unknown");
    expect(gate.billingKnown).toBe(false);
    expect(gate.subscriptionAccess.isActive).toBe(false);
  });

  it("fails open for legacy members when override is enabled", () => {
    vi.stubEnv("RENEWAL_GATE_LEGACY_FAIL_OPEN", "true");

    const gate = resolveProgramSubscriptionGate({
      found: false,
      reason: "not_found",
    });

    expect(gate.gateAction).toBe("allow");
    expect(gate.billingKnown).toBe(false);
    expect(gate.subscriptionAccess.isActive).toBe(true);
  });

  it("defaults to fail open outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.RENEWAL_GATE_LEGACY_FAIL_OPEN;

    expect(isRenewalGateLegacyFailOpenEnabled()).toBe(true);
  });

  it("defaults to fail closed in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.RENEWAL_GATE_LEGACY_FAIL_OPEN;

    expect(isRenewalGateLegacyFailOpenEnabled()).toBe(false);
  });
});
