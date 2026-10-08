export const EMAIL_PROCESS_KEYS = [
  "auth",
  "membership",
  "stripe",
  "bookings",
  "clinical",
  "marketing",
  "crm",
] as const;

export type EmailProcessKey = (typeof EMAIL_PROCESS_KEYS)[number];

export const EMAIL_PROCESS_META: Record<
  EmailProcessKey,
  { label: string; sortOrder: number }
> = {
  auth: { label: "Auth (verification, password reset)", sortOrder: 1 },
  membership: {
    label: "Membership (welcome, renewal, cancel, expired)",
    sortOrder: 2,
  },
  stripe: {
    label: "Stripe (order confirm, payment failed, magic link)",
    sortOrder: 3,
  },
  bookings: {
    label: "Bookings (confirm, reschedule, cancel)",
    sortOrder: 4,
  },
  clinical: {
    label: "Clinical (triage, doctor, pathology, declines)",
    sortOrder: 5,
  },
  marketing: { label: "Marketing (abandoned cart, churn)", sortOrder: 6 },
  crm: { label: "CRM (care-comms, mass send)", sortOrder: 7 },
};

export function isEmailProcessKey(value: string): value is EmailProcessKey {
  return (EMAIL_PROCESS_KEYS as readonly string[]).includes(value);
}
