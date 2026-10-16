"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, trackGaPageView } from "@/lib/analytics/ga";

/**
 * Google tag (gtag.js) for GA4. Loads once; sends page_view on every App Router
 * navigation (automatic send_page_view is disabled so SPA navigations aren't missed
 * and the first load isn't double-counted).
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams?.toString();
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    // gtag may not be loaded yet on first paint; the queue in dataLayer handles it.
    trackGaPageView(url);
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga-gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="ga-gtag-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
// 'js' + 'config' must precede queued events; unshift so early page_view/view_item still attribute correctly.
window.dataLayer.unshift(
  (function(){ return arguments; })('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, anonymize_ip: true })
);
window.dataLayer.unshift((function(){ return arguments; })('js', new Date()));
        `}
      </Script>
    </>
  );
}
