import type { ProgramKey } from "@/lib/membership/keys";

/** Stripe / checkout program slugs for public consult-first funnels (excludes WM). */
export type PublicConsultProgramSlug =
  | "hair_loss"
  | "mens_health"
  | "womens_health";

export type UnifiedCheckoutProgramSlug =
  | "weight_management"
  | PublicConsultProgramSlug;

export type PublicConsultProgram = {
  slug: UnifiedCheckoutProgramSlug;
  label: string;
  subscriptionTier: string;
  firstMonthAud: number;
  invoiceDescription: string;
  /** Weight management keeps legacy triage checklist defaults. */
  isWeightManagement: boolean;
};

const PROGRAMS: Record<UnifiedCheckoutProgramSlug, PublicConsultProgram> = {
  weight_management: {
    slug: "weight_management",
    label: "Weight Management",
    subscriptionTier: "weight_management",
    firstMonthAud: 249,
    invoiceDescription: "Weight Management - First Month",
    isWeightManagement: true,
  },
  hair_loss: {
    slug: "hair_loss",
    label: "Hair Loss",
    subscriptionTier: "hair_loss",
    firstMonthAud: 49,
    invoiceDescription: "Hair Loss - First Month (Hair Care Plan)",
    isWeightManagement: false,
  },
  mens_health: {
    slug: "mens_health",
    label: "Men's Health",
    subscriptionTier: "mens_health",
    firstMonthAud: 49,
    invoiceDescription: "Men's Health - Consultation & First Month",
    isWeightManagement: false,
  },
  womens_health: {
    slug: "womens_health",
    label: "Women's Health",
    subscriptionTier: "womens_health",
    firstMonthAud: 49,
    invoiceDescription: "Women's Health - Consultation & First Month",
    isWeightManagement: false,
  },
};

export function getPublicConsultProgram(
  slug: UnifiedCheckoutProgramSlug
): PublicConsultProgram {
  return PROGRAMS[slug];
}

function normalizeBookingNotesForProgramMatch(notes: string): string {
  return notes
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B\u2032`]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"');
}

export function resolvePublicConsultProgramFromContext(ctx: {
  subscriptionTier?: string | null;
  bookingNotes?: string | null;
  paymentMetadata?: Record<string, string> | null;
}): PublicConsultProgram {
  const fromNotes = resolvePublicConsultProgramFromBookingNotes(ctx.bookingNotes);
  if (fromNotes) return fromNotes;

  if (ctx.paymentMetadata) {
    const fromPayment = resolvePublicConsultProgramFromPaymentMetadata(ctx.paymentMetadata);
    if (fromPayment) return fromPayment;
  }

  const tier = (ctx.subscriptionTier || "").toLowerCase();
  if (tier === "hair_loss") return PROGRAMS.hair_loss;
  if (tier === "mens_health") return PROGRAMS.mens_health;
  if (tier === "womens_health") return PROGRAMS.womens_health;

  return PROGRAMS.weight_management;
}

/** Infer program from consultation booking notes (most accurate for a specific booking). */
export function resolvePublicConsultProgramFromBookingNotes(
  bookingNotes?: string | null
): PublicConsultProgram | null {
  const notes = normalizeBookingNotesForProgramMatch(bookingNotes || "");
  if (notes.includes("hair loss") || notes.includes("hair_loss")) {
    return PROGRAMS.hair_loss;
  }
  if (
    notes.includes("men's health") ||
    notes.includes("mens health") ||
    notes.includes("mens_health")
  ) {
    return PROGRAMS.mens_health;
  }
  if (
    notes.includes("women's health") ||
    notes.includes("womens health") ||
    notes.includes("womens_health")
  ) {
    return PROGRAMS.womens_health;
  }
  if (notes.includes("weight management")) {
    return PROGRAMS.weight_management;
  }
  return null;
}

/** Infer program from Stripe PaymentIntent metadata when booking notes are missing. */
export function resolvePublicConsultProgramFromPaymentMetadata(
  metadata: Record<string, string>
): PublicConsultProgram | null {
  const candidates = [
    metadata.intentProgram,
    metadata.source,
    metadata.program,
    metadata.type,
    metadata.selectedPlan,
    metadata.planId,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const raw of candidates) {
    const slug = normalizeCheckoutProgramSlug(raw);
    if (slug in PROGRAMS) {
      return PROGRAMS[slug as UnifiedCheckoutProgramSlug];
    }
    if (slug.includes("hair")) return PROGRAMS.hair_loss;
    if (slug.includes("mens")) return PROGRAMS.mens_health;
    if (slug.includes("womens")) return PROGRAMS.womens_health;
    if (slug.includes("weight")) return PROGRAMS.weight_management;
  }

  return null;
}

export function normalizeCheckoutProgramSlug(value: string): string {
  return value.replace(/_plan$/, "").trim().toLowerCase();
}

/** Map public assessment concern → canonical billing / entitlement key. */
export function resolveMensHealthCanonicalKey(concern: string): ProgramKey {
  const c = concern.toLowerCase();
  if (
    c === "sexual-health" ||
    c === "erectile-dysfunction" ||
    c === "premature-ejaculation"
  ) {
    return "MENS_HEALTH_SEXUAL";
  }
  return "MENS_HEALTH_VITALITY";
}

/**
 * Map women's public assessment category → canonical program key.
 * Category alone determines the SKU; concerns are triage flags, not routers.
 * `unsure` / unknown → null (doctor classifies at care plan).
 */
export function resolveWomensHealthCanonicalKey(
  category: string
): ProgramKey | null {
  switch (category.toLowerCase()) {
    case "sexual":
      return "WOMENS_HEALTH_SEXUAL";
    case "menopause":
    case "hrt":
    case "fertility":
    case "contraception":
      return "WOMENS_HEALTH_VITALITY";
    case "unsure":
      return null;
    default:
      return null;
  }
}

export const MENS_CHECKOUT_PRICING = {
  planName: "Men's Health Program",
  firstMonthList: 79,
  dueToday: 49,
  ongoingPrice: 79,
  discount: 30,
};

export const WOMENS_CHECKOUT_PRICING = {
  planName: "Women's Health Program",
  firstMonthList: 79,
  dueToday: 49,
  ongoingPrice: 79,
  discount: 30,
};
