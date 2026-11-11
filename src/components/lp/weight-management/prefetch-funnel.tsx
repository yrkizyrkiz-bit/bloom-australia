"use client";

import { useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { FUNNEL_PATH } from "@/lib/lp/weight-management";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (stripeKey) void loadStripe(stripeKey);

function addHeadLink(rel: string, href: string, extra?: Record<string, string>) {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      link.setAttribute(key, value);
    }
  }
  document.head.appendChild(link);
}

export function PrefetchFunnel() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      addHeadLink("preconnect", "https://js.stripe.com");
      addHeadLink("preconnect", "https://api.stripe.com");
      addHeadLink("preload", "https://js.stripe.com/v3/", { as: "script" });
      addHeadLink("prefetch", FUNNEL_PATH);
      void fetch("/api/lp/weight-management/availability", { credentials: "same-origin" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
