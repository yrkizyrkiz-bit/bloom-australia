/**
 * Public marketing compliance — AHPRA / TGA-aligned copy constants.
 * Use on all public vertical pages (not only weight management).
 */

export const CLINICAL_INDIVIDUALITY_COPY =
  "People enter Sanative with different health profiles, goals and medical histories. Your doctor will review your assessment and discuss what is clinically appropriate for you.";

export const DOCTOR_LED_DISCLAIMER =
  "Individual results vary and are not guaranteed. Treatment options are discussed privately with your doctor and supplied only where clinically appropriate.";

export const NO_TESTIMONIALS_DISCLAIMER =
  "Sanative does not use patient testimonials in advertising of regulated health services.";

export const PHARMACY_DISPENSING_COPY =
  "Where clinically appropriate, items may be dispensed by Australian-registered pharmacies. Delivery and packaging options are discussed in consultation.";

export const REFUND_POLICY_PUBLIC_COPY =
  "If your Sanative doctor determines after assessment that a program is not clinically appropriate for you, your first-month payment will be refunded in accordance with our Refund Policy.";

/** Terms that must not appear on public marketing pages */
export const BANNED_PUBLIC_MEDICATION_TERMS = [
  "semaglutide",
  "tirzepatide",
  "ozempic",
  "wegovy",
  "mounjaro",
  "saxenda",
  "sildenafil",
  "tadalafil",
  "finasteride",
  "minoxidil",
  "spironolactone",
  "glp-1",
] as const;

export const BANNED_PUBLIC_MARKETING_PHRASES = [
  "medication included",
  "secure medication delivery",
  "premium medications",
  "treatment delivered to your door",
  "prescription treatment",
  "prescription medication (if appropriate)",
  "clinically proven treatments",
  "clinically-proven",
  "no questions asked",
  "money-back guarantee",
  "real people, real results",
  "discreet delivery to your door",
  "your treatment is delivered",
] as const;

export const BANNED_TESTIMONIAL_OUTCOME_CLAIMS = [
  "lost 14.2kg",
  "lost 12kg",
  "lost 11kg in 6 months",
  "lost 16kg in 8 months",
  "lost 12.4kg",
  "liver resolved",
  "biological age reversed",
  "pcos symptoms significantly reduced",
  "blood pressure normalised",
  "sarah, 41",
  "michelle, 47",
  "given me my hair back",
  "83% see visible improvement",
  "94% rate sanative",
  "50,000+ australians",
  "30,000+ women",
] as const;

export const PUBLIC_VERTICAL_PATHS = [
  "/",
  "/services",
  "/hair-health",
  "/mens-health",
  "/mens-health/sexual-health",
  "/womens-health",
  "/labs",
  "/weight-management",
  "/weight-management/assessment",
] as const;
