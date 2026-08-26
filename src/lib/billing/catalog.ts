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

const QUARTERLY = (
  amountCents: number
): CatalogProductSeed["prices"] => [
  {
    billingInterval: "QUARTERLY",
    amountCents,
    isDefault: true,
    label: "Every 3 months",
  },
];

/**
 * Current catalog: membership is annual; eligible care programs bill quarterly
 * after the included first 30 days. Organ Care and the Essential 85+ panel are
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
    prices: QUARTERLY(36000),
  },
  {
    slug: "hair_loss",
    name: "Hair Health",
    program: "HAIR_LOSS",
    planTier: null,
    sortOrder: 2,
    prices: QUARTERLY(9000),
  },
  {
    slug: "mens_health_vitality",
    name: "Men's Vitality",
    program: "MENS_HEALTH_VITALITY",
    planTier: null,
    sortOrder: 3,
    prices: QUARTERLY(24000),
  },
  {
    slug: "mens_health_sexual",
    name: "Men's Sexual Health",
    program: "MENS_HEALTH_SEXUAL",
    planTier: null,
    sortOrder: 4,
    prices: QUARTERLY(24000),
  },
  {
    slug: "womens_health_vitality",
    name: "Women's Vitality",
    program: "WOMENS_HEALTH_VITALITY",
    planTier: null,
    sortOrder: 5,
    prices: QUARTERLY(24000),
  },
  {
    slug: "womens_health_sexual",
    name: "Women's Sexual Health",
    program: "WOMENS_HEALTH_SEXUAL",
    planTier: null,
    sortOrder: 6,
    prices: QUARTERLY(24000),
  },
];

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

  catalogReady = true;
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
  interval: BillingInterval = "MONTHLY"
) {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;
  const product = await prisma.product.findFirst({
    where: { planTier, program: "WEIGHT_MANAGEMENT" },
  });
  const wmProduct =
    product ??
    (await prisma.product.findFirst({
      where: { program: "WEIGHT_MANAGEMENT", isActive: true },
    }));
  if (!wmProduct) return null;

  const matchInterval = await prisma.billingPrice.findFirst({
    where: {
      productId: wmProduct.id,
      billingInterval: interval,
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
