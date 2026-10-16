/**
 * Google Analytics 4 (gtag.js). Single source of truth for the measurement ID
 * and a thin event helper. Page views are sent by <GoogleAnalytics /> on navigation.
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ZR67MK8809";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type GaEventParams = Record<string, string | number | boolean | undefined | unknown[]>;

/**
 * Returns gtag, installing the standard dataLayer queue shim if gtag.js hasn't
 * executed yet (events fired before the script loads are queued, not lost).
 */
function ensureGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return null;
  if (typeof window.gtag === "function") return window.gtag;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js only processes Arguments objects, not plain arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  return window.gtag;
}

export function trackGaEvent(event: string, params?: GaEventParams): void {
  const gtag = ensureGtag();
  if (!gtag) return;
  const clean: GaEventParams = {};
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) clean[k] = v;
  gtag("event", event, clean);
}

/** Manual page_view for App Router navigations (send_page_view is disabled in config). */
export function trackGaPageView(url: string, title?: string): void {
  const gtag = ensureGtag();
  if (!gtag) return;
  gtag("event", "page_view", {
    page_location: url,
    page_path: new URL(url, window.location.origin).pathname,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Map Meta standard events (already fired across the checkout funnels) onto GA4
 * recommended events so both tools see the same funnel.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
const META_TO_GA4: Record<string, string> = {
  ViewContent: "view_item",
  Lead: "generate_lead",
  Contact: "contact",
  InitiateCheckout: "begin_checkout",
  AddPaymentInfo: "add_payment_info",
  Purchase: "purchase",
  CompleteRegistration: "sign_up",
  Schedule: "schedule_consultation",
  Subscribe: "subscribe",
  StartTrial: "start_trial",
  Search: "search",
  AddToCart: "add_to_cart",
};

export function mirrorMetaEventToGa(
  metaEvent: string,
  params?: Record<string, unknown>,
  options?: { transactionId?: string | null }
): void {
  const gaEvent = META_TO_GA4[metaEvent] ?? metaEvent.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  const p = (params ?? {}) as Record<string, unknown>;

  const value = typeof p.value === "number" ? p.value : undefined;
  const currency = typeof p.currency === "string" ? p.currency : value !== undefined ? "AUD" : undefined;
  const ids = Array.isArray(p.content_ids) ? (p.content_ids as string[]) : undefined;
  const items =
    ids || typeof p.content_name === "string"
      ? [
          {
            item_id: ids?.[0] ?? String(p.content_name),
            item_name: typeof p.content_name === "string" ? p.content_name : ids?.[0],
            item_category: typeof p.content_category === "string" ? p.content_category : undefined,
            price: value,
            quantity: typeof p.num_items === "number" ? p.num_items : 1,
          },
        ]
      : undefined;

  trackGaEvent(gaEvent, {
    value,
    currency,
    transaction_id: options?.transactionId ?? undefined,
    items,
    // Attribution params shared with Meta (custom dimensions in GA4 if you register them).
    origin_page: p.origin_page as string | undefined,
    origin_program: p.origin_program as string | undefined,
    landing_page: p.landing_page as string | undefined,
    funnel_source: p.funnel_source as string | undefined,
    checkout_step: p.checkout_step as string | undefined,
    content_category: p.content_category as string | undefined,
  });
}
