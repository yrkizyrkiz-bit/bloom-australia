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

export function resolvePublicConsultProgramFromContext(ctx: {
  subscriptionTier?: string | null;
  bookingNotes?: string | null;
}): PublicConsultProgram {
  const tier = (ctx.subscriptionTier || "").toLowerCase();
  if (tier === "hair_loss") return PROGRAMS.hair_loss;
  if (tier === "mens_health") return PROGRAMS.mens_health;
  if (tier === "womens_health") return PROGRAMS.womens_health;

  const notes = (ctx.bookingNotes || "").toLowerCase();
  if (notes.includes("hair loss") || notes.includes("hair_loss")) {
    return PROGRAMS.hair_loss;
  }
  if (notes.includes("men's health") || notes.includes("mens health")) {
    return PROGRAMS.mens_health;
  }
  if (notes.includes("women's health") || notes.includes("womens health")) {
    return PROGRAMS.womens_health;
  }

  return PROGRAMS.weight_management;
}

/** Map public assessment concern → canonical billing / entitlement key. */
export function resolveMensHealthCanonicalKey(concern: string): ProgramKey {
  const c = concern.toLowerCase();
  if (c === "erectile-dysfunction" || c === "premature-ejaculation") {
    return "MENS_HEALTH_SEXUAL";
  }
  return "MENS_HEALTH_VITALITY";
}

/** Map women's category / concerns → canonical program key. */
export function resolveWomensHealthCanonicalKey(
  category: string,
  primaryConcerns: string[] = []
): ProgramKey {
  const cat = category.toLowerCase();
  const concerns = primaryConcerns.join(" ").toLowerCase();
  const sexualHints = ["sexual", "libido", "pain with sex", "vaginal dryness"];
  if (
    cat === "general" &&
    sexualHints.some((hint) => concerns.includes(hint))
  ) {
    return "WOMENS_HEALTH_SEXUAL";
  }
  if (cat === "general" && concerns.includes("sexual health")) {
    return "WOMENS_HEALTH_SEXUAL";
  }
  return "WOMENS_HEALTH_VITALITY";
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
