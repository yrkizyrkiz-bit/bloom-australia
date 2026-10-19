import type { Metadata } from "next";

export const SITE_URL = "https://sanative.com.au";
export const SITE_NAME = "Sanative";
export const DEFAULT_OG_IMAGE = "/images/tablet-slider/sanative-hero-clean.webp";

/** Portal, auth, admin, and other logged-in / private surfaces. */
export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    nosnippet: true,
  },
};

export const privateSurfaceMetadata = (title = "Sanative"): Metadata => ({
  title,
  robots: NO_INDEX_ROBOTS,
});

export const SITE_DEFAULT_TITLE =
  "Sanative | Doctor-Led Health Check Australia";
export const SITE_DEFAULT_DESCRIPTION =
  "From biomarkers to doctor-led care plans, Sanative helps Australians understand their health and act on it. AHPRA-registered doctors. Available across Australia.";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Default true for marketing pages; set false for checkout/private flows */
  index?: boolean;
  ogImage?: string;
  /**
   * Cap the text Google can quote from this page. Use on legal pages so AI
   * Overviews and side panels prefer the health-check and program pages.
   */
  maxSnippet?: number;
};

export function buildPageMetadata({
  title,
  description,
  path,
  index = true,
  ogImage = DEFAULT_OG_IMAGE,
  maxSnippet,
}: PageMetaInput): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_AU",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: index
      ? {
          index: true,
          follow: true,
          ...(maxSnippet != null
            ? {
                googleBot: {
                  index: true,
                  follow: true,
                  "max-snippet": maxSnippet,
                },
              }
            : {}),
        }
      : { index: false, follow: false },
  };
}
