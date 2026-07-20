import { describe, expect, it, vi, beforeEach } from "vitest";

const retrievePaymentIntent = vi.fn();
const updateSubscription = vi.fn();
const retrieveSubscription = vi.fn();
const syncFromStripe = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    paymentIntents: { retrieve: retrievePaymentIntent },
    subscriptions: {
      update: updateSubscription,
      retrieve: retrieveSubscription,
    },
  }),
}));

vi.mock("@/lib/billing/sync-subscription", () => ({
  syncMemberSubscriptionFromStripe: syncFromStripe,
}));

describe("syncMemberSubscriptionFromPaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs MemberSubscription when payment intent references a subscription", async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: "pi_test",
      metadata: { subscriptionId: "sub_test", source: "public_biomarkers" },
    });
    retrieveSubscription.mockResolvedValue({ id: "sub_test", status: "active" });
    syncFromStripe.mockResolvedValue({ id: "ms_1" });

    const { syncMemberSubscriptionFromPaymentIntent } = await import(
      "@/lib/billing/sync-payment-subscription"
    );

    const result = await syncMemberSubscriptionFromPaymentIntent({
      userId: "user_1",
      paymentIntentId: "pi_test",
      changeType: "TEST",
      extraMetadata: { scope: "BIOLOGICAL_CLOCK" },
    });

    expect(result).toEqual({ synced: true, subscriptionId: "sub_test" });
    expect(updateSubscription).toHaveBeenCalledWith("sub_test", {
      metadata: expect.objectContaining({
        userId: "user_1",
        scope: "BIOLOGICAL_CLOCK",
      }),
    });
    expect(syncFromStripe).toHaveBeenCalledWith(
      { id: "sub_test", status: "active" },
      expect.objectContaining({ userId: "user_1", changeType: "TEST" })
    );
  });

  it("returns synced false when payment intent has no subscription id", async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: "pi_test",
      metadata: { source: "portal_upsell" },
    });

    const { syncMemberSubscriptionFromPaymentIntent } = await import(
      "@/lib/billing/sync-payment-subscription"
    );

    const result = await syncMemberSubscriptionFromPaymentIntent({
      userId: "user_1",
      paymentIntentId: "pi_test",
    });

    expect(result).toEqual({ synced: false });
    expect(updateSubscription).not.toHaveBeenCalled();
  });
});
