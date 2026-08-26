/** Legal document metadata, bump version when material changes require re-consent. */
export const LEGAL_VERSION = "2026-08-16";

export const SANATIVE_LEGAL = {
  entityName: "Sanative Health Pty Ltd",
  tradingName: "Sanative",
  address: "Level 25, 100 Mount Street, North Sydney NSW 2060, Australia",
  supportEmail: "support@sanative.com.au",
  privacyEmail: "support@sanative.com.au",
  website: "https://sanative.com.au",
  governingLaw: "New South Wales, Australia",
  effectiveDate: "16 August 2026",
} as const;

/** Subprocessors referenced in the application codebase. */
export const LEGAL_SUBPROCESSORS = [
  {
    name: "Stripe",
    purpose: "Payment processing and subscription billing",
    location: "Australia and overseas (including the United States)",
  },
  {
    name: "Resend",
    purpose: "Transactional and service email delivery",
    location: "Overseas (including the United States)",
  },
  {
    name: "SMS provider (e.g. Twilio when configured)",
    purpose: "Service-related SMS notifications",
    location: "Overseas depending on provider configuration",
  },
  {
    name: "Anthropic / Google (Gemini) when enabled",
    purpose: "Optional AI-assisted clinical support and program insights",
    location: "Overseas (including the United States)",
  },
  {
    name: "Cal.com when enabled",
    purpose: "Appointment scheduling integrations",
    location: "Overseas depending on provider configuration",
  },
] as const;

export const LEGAL_LINKS = {
  privacy: "/privacy",
  terms: "/terms",
  medicalDisclaimer: "/medical-disclaimer",
  telehealthConsent: "/telehealth-consent",
  refundPolicy: "/refund-policy",
  subscriptionTerms: "/subscription-terms",
  contact: "/contact",
  faqs: "/faqs",
} as const;
