/** Legal document metadata, bump version when material changes require re-consent. */
export const LEGAL_VERSION = "2026-08-16";

export const SANATIVE_LEGAL = {
  entityName: "Sanative",
  tradingName: "Sanative",
  address: "Level 25, 100 Mount Street, North Sydney NSW 2060, Australia",
  supportEmail: "info@sanative.com.au",
  privacyEmail: "info@sanative.com.au",
  website: "https://sanative.com.au",
  abn: "30 609 735 533",
  governingLaw: "New South Wales, Australia",
  effectiveDate: "16 August 2026",
} as const;

/** Subprocessors referenced in the application codebase. */
export const LEGAL_SUBPROCESSORS = [
  {
    name: "Payment processing",
    purpose: "Payment processing and subscription billing",
    location: "Australia and overseas (including the United States)",
  },
  {
    name: "AI-assisted clinical support",
    purpose: "Optional AI-assisted clinical support and program insights",
    location: "Overseas (including the United States)",
  },
] as const;

export const LEGAL_LINKS = {
  privacy: "/privacy",
  terms: "/terms",
  medicalDisclaimer: "/terms#medical-disclaimer",
  telehealthConsent: "/terms#telehealth-consent",
  refundPolicy: "/refund-policy",
  subscriptionTerms: "/terms#subscription-terms",
  contact: "/contact",
} as const;
