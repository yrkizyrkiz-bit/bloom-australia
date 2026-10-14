/**
 * Meta Pixel standard events (Events Manager classification).
 * @see https://www.facebook.com/business/help/402791146561655
 */

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

export type MetaEventParams = {
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
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params && Object.keys(params).length > 0) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
}

/** Fire Purchase once per payment intent (avoids double-count on remount). */
export function trackMetaPurchaseOnce(input: {
  paymentIntentId?: string | null;
  value: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
}): void {
  const id = input.paymentIntentId?.trim();
  if (id && typeof sessionStorage !== "undefined") {
    const key = `meta_pixel_purchase_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }

  trackMetaEvent("Purchase", {
    value: input.value,
    currency: input.currency || "AUD",
    content_name: input.content_name || "Sanative Membership",
    content_ids: input.content_ids || ["sanative_membership"],
    content_type: "product",
    num_items: 1,
  });
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
