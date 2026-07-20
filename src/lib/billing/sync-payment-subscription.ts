import { getStripe } from "@/lib/stripe";
import { syncMemberSubscriptionFromStripe } from "@/lib/billing/sync-subscription";

export type SyncPaymentSubscriptionResult = {
  synced: boolean;
  subscriptionId?: string;
};

/**
 * Attach a Stripe subscription (created via incomplete checkout) to a member and
 * upsert the matching MemberSubscription row.
 */
export async function syncMemberSubscriptionFromPaymentIntent(input: {
  userId: string;
  paymentIntentId: string;
  changeType?: string;
  extraMetadata?: Record<string, string>;
}): Promise<SyncPaymentSubscriptionResult> {
  const stripe = getStripe();
  if (!stripe) return { synced: false };

  const pi = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  const subscriptionId = pi.metadata?.subscriptionId;
  if (!subscriptionId) return { synced: false };

  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...pi.metadata,
      userId: input.userId,
      ...(input.extraMetadata ?? {}),
    },
  });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncMemberSubscriptionFromStripe(subscription, {
    userId: input.userId,
    changeType: input.changeType ?? "payment_intent_sync",
  });

  return { synced: true, subscriptionId };
}
