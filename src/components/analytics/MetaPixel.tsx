"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  META_PIXEL_ID,
  trackMetaPageView,
  viewContentForPath,
} from "@/lib/analytics/meta-pixel";

export { META_PIXEL_ID };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta Pixel base code + PageView on App Router navigations.
 * Also fires ViewContent on key marketing/program pages (Meta standard events).
 * Pixel ID and standard events share META_PIXEL_ID from @/lib/analytics/meta-pixel.
 * @see https://developers.facebook.com/docs/meta-pixel/get-started
 * @see https://www.facebook.com/business/help/402791146561655
 */
export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      // Base snippet already sent PageView; still send ViewContent for key pages.
      viewContentForPath(pathname);
      return;
    }
    trackMetaPageView();
    viewContentForPath(pathname);
  }, [pathname, searchParams]);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
