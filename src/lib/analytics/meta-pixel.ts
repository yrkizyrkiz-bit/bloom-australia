/**
 * Meta Pixel standard events (Events Manager classification).
 * @see https://www.facebook.com/business/help/402791146561655
 */

import { mirrorMetaEventToGa } from "@/lib/analytics/ga";

/** Single source of truth — base code and standard events use this ID. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "28517477271253490";

export type MetaStandardEvent =
  | "AddPaymentInfo"
  | "AddToCart"
  | "AddToWishlist"
  | "CompleteRegistration"
  | "Contact"
  | "CustomizeProduct"
  | "Donate"
  | "FindLocation"
  | "InitiateCheckout"
  | "Lead"
  | "Purchase"
  | "Schedule"
  | "Search"
  | "StartTrial"
  | "SubmitApplication"
  | "Subscribe"
  | "ViewContent";

/**
 * Custom parameters attached to every event so Events Manager / Custom Conversions
 * can break down sales vs. traffic by the page that originated the visit.
 */
export type MetaAttributionParams = {
  /** First path of the session (where the visitor arrived). */
  landing_page?: string;
  /** Last marketing/program page viewed before entering a funnel (assessment/checkout). */
  origin_page?: string;
  /** Program bucket derived from origin_page (e.g. hair_health, menopause, organ_care). */
  origin_program?: string;
  /** Funnel hand-off tag (checkout `source`/`intent` or assessment `source`). */
  funnel_source?: string;
  /** Step label for CheckoutStep custom events. */
  checkout_step?: string;
};

export type MetaEventParams = MetaAttributionParams & {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: { id: string; quantity: number }[];
  num_items?: number;
  status?: boolean | string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: MetaEventParams
): void {
  if (typeof window === "undefined") return;
  const merged = withMetaAttribution(params);
  // trackSingle binds the event to the configured pixel ID (avoids old/multi-pixel drift).
  if (typeof window.fbq === "function") {
    if (Object.keys(merged).length > 0) {
      window.fbq("trackSingle", META_PIXEL_ID, event, merged);
    } else {
      window.fbq("trackSingle", META_PIXEL_ID, event);
    }
  }
  // Same funnel event into GA4 (mapped to GA4 recommended event names) — independent of fbq.
  mirrorMetaEventToGa(event, merged, { transactionId: currentTransactionId });
}

/** Set by trackMetaPurchaseOnce so the mirrored GA4 purchase carries transaction_id. */
let currentTransactionId: string | null = null;

/** Custom (non-standard) event, e.g. CheckoutStep — also carries attribution params. */
export function trackMetaCustomEvent(
  event: string,
  params?: MetaEventParams
): void {
  if (typeof window === "undefined") return;
  const merged = withMetaAttribution(params);
  if (typeof window.fbq === "function") {
    window.fbq("trackSingleCustom", META_PIXEL_ID, event, merged);
  }
  mirrorMetaEventToGa(event, merged);
}

/** Checkout funnel step (single custom event; break down by `checkout_step` in Events Manager). */
export function trackMetaCheckoutStep(
  step:
    | "verify_code_sent"
    | "contact_verified"
    | "existing_account"
    | "payment_shown"
    | "payment_succeeded"
    | "onboarding_completed"
    | "booking_completed"
    | "quiz_completed"
    | "checkout_completed",
  params?: Omit<MetaEventParams, "checkout_step">
): void {
  trackMetaCustomEvent("CheckoutStep", { ...params, checkout_step: step });
}

// ─── Attribution (which page originated the visit / sale) ─────────────────

const ATTR_LANDING_KEY = "meta_attr_landing_page";
const ATTR_ORIGIN_KEY = "meta_attr_origin_page";
const ATTR_FUNNEL_SOURCE_KEY = "meta_attr_funnel_source";

/** Paths that are funnel steps (not content pages) — never recorded as origin_page. */
const FUNNEL_PATH_PATTERNS: RegExp[] = [
  /\/assessment(\/|$)/,
  /^\/hair-assessment(\/|$)/,
  /^\/biomarker-intake(\/|$)/,
  /\/checkout(\/|$)/,
  /^\/join(\/|$)/,
  /^\/payment(\/|$)/,
  /^\/select-plan(\/|$)/,
  /\/book(\/|$)/,
  /^\/(login|forgot-password|reset-password|dashboard|portal|admin|doctor|gp|api|invoices)(\/|$)/,
];

function normalisePath(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/";
}

function safeSessionGet(key: string): string | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / quota) — attribution is best-effort */
  }
}

export function isMetaFunnelPath(pathname: string): boolean {
  const path = normalisePath(pathname);
  return FUNNEL_PATH_PATTERNS.some((re) => re.test(path));
}

/**
 * Record the visitor's landing page (once per session) and the last content page
 * seen before a funnel. Call on every App Router navigation (MetaPixel does this).
 */
export function rememberMetaOrigin(pathname: string): void {
  const path = normalisePath(pathname);
  if (!safeSessionGet(ATTR_LANDING_KEY)) safeSessionSet(ATTR_LANDING_KEY, path);
  if (!isMetaFunnelPath(path)) safeSessionSet(ATTR_ORIGIN_KEY, path);
}

/** Record the funnel hand-off tag (checkout `source`/`intent`, assessment `source`). */
export function rememberMetaFunnelSource(source?: string | null): void {
  const value = source?.trim();
  if (value) safeSessionSet(ATTR_FUNNEL_SOURCE_KEY, value);
}

/** Program bucket for a path — used for origin_program and funnel content_category. */
export function metaProgramForPath(pathname: string): string {
  const path = normalisePath(pathname);
  if (path === "/" || path === "/home") return "home";
  if (path.startsWith("/hair-")) return "hair_health";
  if (path.startsWith("/weight-management")) return "weight_management";
  if (path.startsWith("/mens-health/erectile-dysfunction")) return "erectile_dysfunction";
  if (path.startsWith("/mens-health/sexual-health")) return "mens_sexual_health";
  if (path.startsWith("/mens-health")) return "mens_health";
  if (path.startsWith("/womens-health/menopause")) return "menopause";
  if (path.startsWith("/womens-health")) return "womens_health";
  if (path.startsWith("/organ-care")) return "organ_care";
  if (path.startsWith("/metabolic-care/fatty-liver")) return "fatty_liver";
  if (path.startsWith("/metabolic-care/heart-health")) return "heart_health";
  if (path.startsWith("/metabolic-care/kidney-health")) return "kidney_health";
  if (path.startsWith("/metabolic-care/pcos")) return "pcos";
  if (path.startsWith("/metabolic-care")) return "metabolic_care";
  if (path.startsWith("/labs") || path.startsWith("/biomarker")) return "labs";
  if (path.startsWith("/guides")) return "guides";
  if (path.startsWith("/pricing") || path.startsWith("/membership")) return "membership";
  if (path.startsWith("/for-doctors")) return "for_doctors";
  return "other";
}

/** Current attribution snapshot (origin falls back to landing when the visit started in a funnel). */
export function getMetaAttribution(): MetaAttributionParams {
  const landing = safeSessionGet(ATTR_LANDING_KEY) ?? undefined;
  const origin = safeSessionGet(ATTR_ORIGIN_KEY) ?? landing;
  const funnelSource = safeSessionGet(ATTR_FUNNEL_SOURCE_KEY) ?? undefined;
  const out: MetaAttributionParams = {};
  if (landing) out.landing_page = landing;
  if (origin) {
    out.origin_page = origin;
    out.origin_program = metaProgramForPath(origin);
  }
  if (funnelSource) out.funnel_source = funnelSource;
  return out;
}

function withMetaAttribution(params?: MetaEventParams): MetaEventParams {
  // Explicit params win over stored attribution.
  return { ...getMetaAttribution(), ...(params ?? {}) };
}

/** PageView for App Router navigations — same pixel as base init. */
export function trackMetaPageView(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackSingle", META_PIXEL_ID, "PageView");
}

/** Fire Purchase once per payment intent (avoids double-count on remount). */
export function trackMetaPurchaseOnce(input: {
  paymentIntentId?: string | null;
  value: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  /** Program the sale belongs to; defaults to origin_program from attribution. */
  content_category?: string;
}): void {
  const id = input.paymentIntentId?.trim();
  if (id) {
    const key = `meta_pixel_purchase_${id}`;
    if (safeSessionGet(key)) return;
    safeSessionSet(key, "1");
  }

  const attribution = getMetaAttribution();
  currentTransactionId = id ?? null;
  trackMetaEvent("Purchase", {
    value: input.value,
    currency: input.currency || "AUD",
    content_name: input.content_name || "Sanative Membership",
    content_ids: input.content_ids || ["sanative_membership"],
    content_type: "product",
    content_category: input.content_category || attribution.origin_program || "membership",
    num_items: 1,
  });
  currentTransactionId = null;
  trackMetaCheckoutStep("payment_succeeded", { value: input.value, currency: input.currency || "AUD" });
}

/** Key marketing / program URLs that should emit ViewContent (not every PageView). */
const VIEW_CONTENT_PATHS: Record<
  string,
  { content_name: string; content_category: string; content_ids: string[] }
> = {
  "/": {
    content_name: "Sanative Home",
    content_category: "marketing",
    content_ids: ["home"],
  },
  "/pricing": {
    content_name: "Membership Pricing",
    content_category: "membership",
    content_ids: ["pricing"],
  },
  "/labs": {
    content_name: "Biomarker Labs",
    content_category: "labs",
    content_ids: ["labs"],
  },
  "/labs/biomarkers": {
    content_name: "Biomarker Panels",
    content_category: "labs",
    content_ids: ["labs_biomarkers"],
  },
  "/weight-management": {
    content_name: "Weight Management",
    content_category: "program",
    content_ids: ["weight_management"],
  },
  "/mens-health": {
    content_name: "Men's Health",
    content_category: "program",
    content_ids: ["mens_health"],
  },
  "/mens-health/sexual-health": {
    content_name: "Men's Sexual Health",
    content_category: "program",
    content_ids: ["mens_sexual_health"],
  },
  "/mens-health/erectile-dysfunction": {
    content_name: "Erectile Dysfunction Care",
    content_category: "program",
    content_ids: ["erectile_dysfunction"],
  },
  "/womens-health": {
    content_name: "Women's Health",
    content_category: "program",
    content_ids: ["womens_health"],
  },
  "/womens-health/menopause": {
    content_name: "Menopause Care",
    content_category: "program",
    content_ids: ["menopause"],
  },
  "/hair-health": {
    content_name: "Hair Health",
    content_category: "program",
    content_ids: ["hair_health"],
  },
  "/organ-care": {
    content_name: "Organ Care",
    content_category: "program",
    content_ids: ["organ_care"],
  },
  "/metabolic-care": {
    content_name: "Metabolic Care",
    content_category: "program",
    content_ids: ["metabolic_care"],
  },
  "/metabolic-care/fatty-liver": {
    content_name: "Fatty Liver Care",
    content_category: "program",
    content_ids: ["fatty_liver"],
  },
  "/metabolic-care/heart-health": {
    content_name: "Heart Health",
    content_category: "program",
    content_ids: ["heart_health"],
  },
  "/metabolic-care/kidney-health": {
    content_name: "Kidney Health",
    content_category: "program",
    content_ids: ["kidney_health"],
  },
  "/metabolic-care/pcos": {
    content_name: "PCOS Care",
    content_category: "program",
    content_ids: ["pcos"],
  },
  "/weight-management/dietitian-support": {
    content_name: "Dietitian Support",
    content_category: "program",
    content_ids: ["dietitian_support"],
  },
  "/labs/action-plan": {
    content_name: "Labs Action Plan",
    content_category: "labs",
    content_ids: ["labs_action_plan"],
  },
  "/programs": {
    content_name: "All Programs",
    content_category: "marketing",
    content_ids: ["programs"],
  },
  "/services": {
    content_name: "Services",
    content_category: "marketing",
    content_ids: ["services"],
  },
  "/about": {
    content_name: "About Sanative",
    content_category: "marketing",
    content_ids: ["about"],
  },
  "/faqs": {
    content_name: "FAQs",
    content_category: "marketing",
    content_ids: ["faqs"],
  },
  "/contact": {
    content_name: "Contact",
    content_category: "marketing",
    content_ids: ["contact"],
  },
  "/for-doctors": {
    content_name: "For Doctors",
    content_category: "marketing",
    content_ids: ["for_doctors"],
  },
  // Funnel entry pages (assessments) — counted so drop-off between page → assessment is visible.
  "/weight-management/assessment": {
    content_name: "Weight Management Assessment",
    content_category: "assessment",
    content_ids: ["weight_management_assessment"],
  },
  "/hair-assessment": {
    content_name: "Hair Assessment",
    content_category: "assessment",
    content_ids: ["hair_assessment"],
  },
  "/mens-health/assessment": {
    content_name: "Men's Health Assessment",
    content_category: "assessment",
    content_ids: ["mens_health_assessment"],
  },
  "/womens-health/assessment": {
    content_name: "Women's Health Assessment",
    content_category: "assessment",
    content_ids: ["womens_health_assessment"],
  },
  "/metabolic-care/fatty-liver/assessment": {
    content_name: "Fatty Liver Assessment",
    content_category: "assessment",
    content_ids: ["fatty_liver_assessment"],
  },
  "/join": {
    content_name: "Join Sanative",
    content_category: "checkout",
    content_ids: ["join"],
  },
  "/membership/checkout": {
    content_name: "Membership Checkout",
    content_category: "checkout",
    content_ids: ["membership_checkout"],
  },
};

export function viewContentForPath(pathname: string): void {
  const path = pathname.replace(/\/$/, "") || "/";
  const match = VIEW_CONTENT_PATHS[path];
  if (!match) return;
  trackMetaEvent("ViewContent", {
    content_name: match.content_name,
    content_category: match.content_category,
    content_ids: match.content_ids,
    content_type: "product",
  });
}
