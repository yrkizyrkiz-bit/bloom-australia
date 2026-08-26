import type Stripe from "stripe";

function unixToDate(value: unknown): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

/**
 * Stripe API 2025+ (Basil) moved current_period_* from Subscription onto
 * SubscriptionItem. Read both, then fall back from the price interval.
 */
export function getStripeSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  const subData = subscription as unknown as Record<string, unknown>;
  const item = subscription.items?.data?.[0];
  const itemData = (item ?? {}) as unknown as Record<string, unknown>;
  const recurring = item?.price?.recurring;

  const start =
    unixToDate(subData.current_period_start) ??
    unixToDate(itemData.current_period_start) ??
    new Date();

  const endFromStripe =
    unixToDate(subData.current_period_end) ?? unixToDate(itemData.current_period_end);
  if (endFromStripe) {
    return { start, end: endFromStripe };
  }

  const end = new Date(start);
  const count =
    recurring?.interval_count && recurring.interval_count > 0
      ? recurring.interval_count
      : 1;
  switch (recurring?.interval) {
    case "year":
      end.setFullYear(end.getFullYear() + count);
      break;
    case "week":
      end.setDate(end.getDate() + 7 * count);
      break;
    case "day":
      end.setDate(end.getDate() + count);
      break;
    case "month":
      end.setMonth(end.getMonth() + count);
      break;
    default:
      end.setFullYear(end.getFullYear() + 1);
      break;
  }

  return { start, end };
}
