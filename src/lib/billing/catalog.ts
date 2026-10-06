import { prisma } from "@/lib/prisma";
import type { BillingInterval } from "@prisma/client";

export type CatalogProductSeed = {
  slug: string;
  name: string;
  program: string;
  planTier?: string | null;
  sortOrder?: number;
  stripeProductId?: string;
  prices: Array<{
    billingInterval: BillingInterval;
    amountCents: number;
    stripePriceId?: string;
    isDefault?: boolean;
    isFirstMonth?: boolean;
    label: string;
  }>;
};

/** 10% off committing to 12 months vs four quarterly payments. */
export function annualCareAmountFromQuarterlyCents(quarterlyCents: number): number {
  return Math.round(quarterlyCents * 4 * 0.9);
}

const CARE_CADENCES = (
  quarterlyCents: number
): CatalogProductSeed["prices"] => [
  {
    billingInterval: "QUARTERLY",
    amountCents: quarterlyCents,
    isDefault: true,
    label: "Every 3 months",
  },
  {
    billingInterval: "YEARLY",
    amountCents: annualCareAmountFromQuarterlyCents(quarterlyCents),
    isDefault: false,
    label: "Annual (save 10%)",
  },
];

/**
 * Current catalog: membership is annual; eligible care programs bill quarterly
 * (default) or yearly at 10% off. Organ Care and the Essential 85+ panel are
 * included with membership, not sold as separate products.
 */
const ALL_CATALOG: CatalogProductSeed[] = [
  {
    slug: "sanative_membership",
    name: "Sanative Membership",
    program: "MEMBERSHIP",
    planTier: null,
    sortOrder: 0,
    prices: [
      {
        billingInterval: "YEARLY",
        amountCents: 36500,
        isDefault: true,
        label: "Annual",
      },
    ],
  },
  {
    slug: "weight_management",
    name: "Weight Management",
    program: "WEIGHT_MANAGEMENT",
    planTier: null,
    sortOrder: 1,
    prices: CARE_CADENCES(36000),
  },
  {
    slug: "hair_loss",
    name: "Hair Health",
    program: "HAIR_LOSS",
    planTier: null,
    sortOrder: 2,
    prices: CARE_CADENCES(9000),
  },
  {
    slug: "mens_health_vitality",
    name: "Men's Vitality",
    program: "MENS_HEALTH_VITALITY",
    planTier: null,
    sortOrder: 3,
    prices: CARE_CADENCES(24000),
  },
  {
    slug: "mens_health_sexual",
    name: "Men's Sexual Health",
    program: "MENS_HEALTH_SEXUAL",
    planTier: null,
    sortOrder: 4,
    prices: CARE_CADENCES(24000),
  },
  {
    slug: "womens_health_vitality",
    name: "Menopause Care",
    program: "WOMENS_HEALTH_VITALITY",
    planTier: null,
    sortOrder: 5,
    prices: CARE_CADENCES(24000),
  },
  {
    slug: "womens_health_sexual",
    name: "Women's Wellness",
    program: "WOMENS_HEALTH_SEXUAL",
    planTier: null,
    sortOrder: 6,
    prices: CARE_CADENCES(24000),
  },
];

const CARE_PROGRAM_SLUGS = [
  "weight_management",
  "hair_loss",
  "mens_health_vitality",
  "mens_health_sexual",
  "womens_health_vitality",
  "womens_health_sexual",
] as const;

/** Retired SKUs — kept for history but never used for new billing. */
const RETIRED_PRODUCT_SLUGS = ["wm_core", "wm_precision", "wm_care"] as const;

let catalogReady = false;

export function billingModelsAvailable(): boolean {
  const p = prisma as unknown as Record<string, { findFirst?: unknown } | undefined>;
  return (
    typeof p.product?.findFirst === "function" &&
    typeof p.billingPrice?.findFirst === "function"
  );
}

/**
 * Seed missing products/prices only, the database is the source of truth.
 *
 * This bootstraps an empty database with the default catalog. Once a product
 * or price row exists it is NEVER touched again here: admins own the catalog
 * via /admin/membership-pricing (create, edit, deactivate, delete).
 */
export async function ensureBillingCatalog() {
  if (catalogReady) return;

  if (!billingModelsAvailable()) {
    console.warn(
      "[billing] Prisma client missing Product/BillingPrice models, restart the dev server after prisma generate"
    );
    return;
  }

  for (const item of ALL_CATALOG) {
    let product = await prisma.product.findUnique({ where: { slug: item.slug } });

    if (!product) {
      product = await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          program: item.program,
          planTier: item.planTier ?? null,
          sortOrder: item.sortOrder ?? 0,
          stripeProductId: item.stripeProductId,
        },
      });

      for (const price of item.prices) {
        await prisma.billingPrice.create({
          data: {
            productId: product.id,
            billingInterval: price.billingInterval,
            amountCents: price.amountCents,
            stripePriceId: price.stripePriceId,
            isDefault: price.isDefault ?? false,
            isFirstMonth: price.isFirstMonth ?? false,
            label: price.label,
          },
        });
      }
    }
  }

  // Existing DBs may already have care products with only QUARTERLY — add YEARLY if missing.
  await ensureAnnualCarePricesForExistingProducts();
  await deactivateRetiredProducts();

  catalogReady = true;
}

/** Keep legacy Core/Precision and duplicate wm_care inactive. */
export async function deactivateRetiredProducts() {
  if (!billingModelsAvailable()) return;
  await prisma.product.updateMany({
    where: { slug: { in: [...RETIRED_PRODUCT_SLUGS] }, isActive: true },
    data: { isActive: false },
  });
}

/**
 * Ensure each care product with a quarterly price also has a yearly price at 10% off.
 * Does not overwrite admin-edited yearly rows.
 */
export async function ensureAnnualCarePricesForExistingProducts() {
  if (!billingModelsAvailable()) return;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: [...CARE_PROGRAM_SLUGS] } },
        {
          program: {
            in: [
              "WEIGHT_MANAGEMENT",
              "HAIR_LOSS",
              "MENS_HEALTH_VITALITY",
              "MENS_HEALTH_SEXUAL",
              "WOMENS_HEALTH_VITALITY",
              "WOMENS_HEALTH_SEXUAL",
            ],
          },
          OR: [{ planTier: null }, { planTier: "" }],
          NOT: { slug: { in: ["wm_core", "wm_precision"] } },
        },
      ],
    },
    include: {
      billingPrices: {
        where: { isActive: true, isFirstMonth: false },
      },
    },
  });

  for (const product of products) {
    const quarterly = product.billingPrices.find((p) => p.billingInterval === "QUARTERLY");
    if (!quarterly) continue;
    const hasYearly = product.billingPrices.some((p) => p.billingInterval === "YEARLY");
    if (hasYearly) continue;

    await prisma.billingPrice.create({
      data: {
        productId: product.id,
        billingInterval: "YEARLY",
        amountCents: annualCareAmountFromQuarterlyCents(quarterly.amountCents),
        currency: quarterly.currency || "AUD",
        isDefault: false,
        isFirstMonth: false,
        isActive: true,
        label: "Annual (save 10%)",
      },
    });
  }
}

export async function findProductByPlanTier(planTier: "CORE" | "PRECISION") {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;
  const include = {
    billingPrices: {
      where: { isActive: true, isFirstMonth: false },
      orderBy: { amountCents: "asc" as const },
    },
  };
  const exact = await prisma.product.findFirst({
    where: { planTier, program: "WEIGHT_MANAGEMENT", isActive: true },
    include,
  });
  if (exact) return exact;
  return prisma.product.findFirst({
    where: { program: "WEIGHT_MANAGEMENT", isActive: true },
    include,
  });
}

/** Resolve catalog product for a clinical program (hair, vitality, organ care, etc.). */
export async function findProductByProgram(program: string, planTier?: string | null) {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;
  const include = {
    billingPrices: {
      where: { isActive: true },
      orderBy: [{ isFirstMonth: "desc" as const }, { amountCents: "asc" as const }],
    },
  };
  const exact = await prisma.product.findFirst({
    where: {
      program,
      isActive: true,
      ...(planTier != null && planTier !== ""
        ? { planTier }
        : { OR: [{ planTier: null }, { planTier: "" }] }),
    },
    include,
  });
  if (exact) return exact;
  return prisma.product.findFirst({
    where: { program, isActive: true },
    include,
  });
}

export async function findBillingPriceByStripeId(stripePriceId: string) {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;
  return prisma.billingPrice.findUnique({
    where: { stripePriceId },
    include: { product: true },
  });
}

export async function findDefaultRecurringPrice(
  planTier: "CORE" | "PRECISION",
  interval: BillingInterval = "QUARTERLY"
) {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;

  // Prefer canonical membership-era care product ($360 / 3 months), never legacy Core/Precision.
  for (const slug of ["weight_management", "wm_care"] as const) {
    const care = await prisma.product.findFirst({
      where: { slug, program: "WEIGHT_MANAGEMENT", isActive: true },
    });
    if (!care) continue;
    const carePrice = await prisma.billingPrice.findFirst({
      where: {
        productId: care.id,
        billingInterval: interval === "MONTHLY" ? "QUARTERLY" : interval,
        isFirstMonth: false,
        isActive: true,
      },
      include: { product: true },
    });
    if (carePrice) return carePrice;
  }

  const product = await prisma.product.findFirst({
    where: {
      program: "WEIGHT_MANAGEMENT",
      isActive: true,
      OR: [{ planTier: null }, { planTier: "" }],
      NOT: { slug: { in: ["wm_core", "wm_precision"] } },
    },
    orderBy: { sortOrder: "asc" },
  });
  const wmProduct =
    product ??
    (await prisma.product.findFirst({
      where: {
        program: "WEIGHT_MANAGEMENT",
        isActive: true,
        planTier,
      },
    }));
  if (!wmProduct) return null;

  const preferredInterval = interval === "MONTHLY" ? "QUARTERLY" : interval;
  const matchInterval = await prisma.billingPrice.findFirst({
    where: {
      productId: wmProduct.id,
      billingInterval: preferredInterval,
      isFirstMonth: false,
      isActive: true,
    },
    include: { product: true },
  });
  if (matchInterval) return matchInterval;

  return prisma.billingPrice.findFirst({
    where: {
      productId: wmProduct.id,
      isFirstMonth: false,
      isActive: true,
    },
    include: { product: true },
  });
}

export function billingIntervalLabel(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Every 3 months",
    BIANNUAL: "Every 6 months",
    YEARLY: "Annual",
    ONE_TIME: "First month",
  };
  return labels[interval] || interval;
}

export function billingIntervalShort(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    BIANNUAL: "6mo",
    YEARLY: "yr",
    ONE_TIME: "once",
  };
  return labels[interval] || interval.toLowerCase();
}

export function resolvePlanTierFromStrings(input: {
  selectedPlan?: string | null;
  subscriptionTier?: string | null;
}): "CORE" | "PRECISION" | null {
  const raw = (input.selectedPlan || input.subscriptionTier || "").toUpperCase();
  if (raw.includes("PRECISION")) return "PRECISION";
  if (raw.includes("CORE")) return "CORE";
  return null;
}

/** Force re-read catalog after admin pricing updates (dev hot reload). */
export function resetBillingCatalogCache() {
  catalogReady = false;
}
