/**
 * Order Summary marquee: product screens interleaved with organ-care art
 * (kidney / liver / heart) for a clearer “whole-body insights” story.
 * Assets are 720×405 WebP (~10–15KB) for fast LCP on checkout.
 */
export type OrderSummaryMarqueeItem = {
  src: string;
  alt: string;
  /** White-studio organ art uses contain so it blends into the white card. */
  fit?: "cover" | "contain";
};

export const ORDER_SUMMARY_MARQUEE: readonly OrderSummaryMarqueeItem[] = [
  {
    src: "/images/membership/mens-marquee/biomarker-vial.webp",
    alt: "Sanative biomarker blood test vial with metabolic markers",
    fit: "cover",
  },
  {
    src: "/images/membership/organ-slider/kidney.webp",
    alt: "Doctor reviewing kidney health insights",
    fit: "contain",
  },
  {
    src: "/images/membership/mens-marquee/organ-dashboard.webp",
    alt: "Sanative organ and metabolic health dashboard",
    fit: "cover",
  },
  {
    src: "/images/membership/organ-slider/liver.webp",
    alt: "Clinicians examining liver health markers",
    fit: "contain",
  },
  {
    src: "/images/membership/mens-marquee/app-insights.webp",
    alt: "Sanative app showing health score and biomarker insights",
    fit: "cover",
  },
  {
    src: "/images/membership/organ-slider/heart.webp",
    alt: "Doctor reviewing heart health insights",
    fit: "contain",
  },
] as const;
