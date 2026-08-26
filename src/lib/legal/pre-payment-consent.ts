/** Plain-text label stored on consent records, must match checkbox copy exactly. */
export const PRE_PAYMENT_CONSENT_CHECKBOX_LABEL =
  "I agree to the Terms, Privacy Policy, Telehealth Consent. I understand treatment decisions are made by an Australian doctor after clinical assessment.";

export const PRE_PAYMENT_CONSENT_METHOD = "explicit_checkbox" as const;

/** Consent must be recorded within this window before payment / booking confirm. */
export const PRE_PAYMENT_CONSENT_MAX_AGE_MS = 60 * 60 * 1000;
