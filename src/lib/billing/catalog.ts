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

const WM_CATALOG: CatalogProductSeed[] = [
  {
    slug: "wm_core",
    name: "Sanative Core",
    program: "WEIGHT_MANAGEMENT",
    planTier: "CORE",
    sortOrder: 0,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 24900,
        stripePriceId: process.env.STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 34900,
        stripePriceId: process.env.STRIPE_WM_CORE_MONTHLY_PRICE_ID,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 99000,
        stripePriceId: process.env.STRIPE_WM_CORE_QUARTERLY_PRICE_ID,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 189000,
        stripePriceId: process.env.STRIPE_WM_CORE_BIANNUAL_PRICE_ID,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 349000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "wm_precision",
    name: "Sanative Precision",
    program: "WEIGHT_MANAGEMENT",
    planTier: "PRECISION",
    sortOrder: 1,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 39900,
        stripePriceId: process.env.STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 49900,
        stripePriceId: process.env.STRIPE_WM_PRECISION_MONTHLY_PRICE_ID,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 141000,
        stripePriceId: process.env.STRIPE_WM_PRECISION_QUARTERLY_PRICE_ID,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 269000,
        stripePriceId: process.env.STRIPE_WM_PRECISION_BIANNUAL_PRICE_ID,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 499000,
        label: "Annual",
      },
    ],
  },
];

/** Portal program products — amounts are defaults only; admin edits persist in DB. */
const PORTAL_PROGRAM_CATALOG: CatalogProductSeed[] = [
  {
    slug: "hair_loss",
    name: "Hair Loss Program",
    program: "HAIR_LOSS",
    planTier: null,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 5900,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 7900,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 21900,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 41900,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 79000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "mens_health_vitality",
    name: "Men's Vitality",
    program: "MENS_HEALTH_VITALITY",
    planTier: null,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 5900,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 8900,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 24900,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 47900,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 89000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "mens_health_sexual",
    name: "Men's Sexual Health",
    program: "MENS_HEALTH_SEXUAL",
    planTier: null,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 5900,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 8900,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 24900,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 47900,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 89000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "womens_health_vitality",
    name: "Women's Vitality",
    program: "WOMENS_HEALTH_VITALITY",
    planTier: null,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 5900,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 8900,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 24900,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 47900,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 89000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "womens_health_sexual",
    name: "Women's Sexual Health",
    program: "WOMENS_HEALTH_SEXUAL",
    planTier: null,
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 5900,
        isFirstMonth: true,
        label: "First month (includes consultation)",
      },
      {
        billingInterval: "MONTHLY",
        amountCents: 8900,
        isDefault: true,
        label: "Monthly",
      },
      {
        billingInterval: "QUARTERLY",
        amountCents: 24900,
        label: "Every 3 months",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 47900,
        label: "Every 6 months",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 89000,
        label: "Annual",
      },
    ],
  },
  {
    slug: "biomarkers_essential",
    name: "Essential Biomarkers Panel",
    program: "BIOLOGICAL_CLOCK",
    planTier: "essential",
    sortOrder: 10,
    prices: [
      {
        billingInterval: "YEARLY",
        amountCents: 19900,
        isDefault: true,
        label: "Annual",
      },
    ],
  },
  {
    slug: "biomarkers_extended",
    name: "Advanced Biomarkers Panel",
    program: "BIOLOGICAL_CLOCK",
    planTier: "extended",
    sortOrder: 11,
    prices: [
      {
        billingInterval: "YEARLY",
        amountCents: 34900,
        isDefault: true,
        label: "Annual",
      },
    ],
  },
  {
    slug: "biomarkers_comprehensive",
    name: "Complete Biomarkers Panel",
    program: "BIOLOGICAL_CLOCK",
    planTier: "comprehensive",
    sortOrder: 12,
    prices: [
      {
        billingInterval: "YEARLY",
        amountCents: 49900,
        isDefault: true,
        label: "Annual",
      },
    ],
  },
  {
    slug: "organ_care",
    name: "Organ & Metabolic Care",
    program: "ORGAN_CARE",
    planTier: null,
    sortOrder: 20,
    prices: [
      {
        billingInterval: "MONTHLY",
        amountCents: 4900,
        isDefault: false,
        label: "Monthly",
      },
      {
        billingInterval: "YEARLY",
        amountCents: 49900,
        isDefault: true,
        label: "Annual",
      },
    ],
  },
];

const ALL_CATALOG = [...WM_CATALOG, ...PORTAL_PROGRAM_CATALOG];

let catalogReady = false;

export function billingModelsAvailable(): boolean {
  const p = prisma as unknown as Record<string, { findFirst?: unknown } | undefined>;
  return (
    typeof p.product?.findFirst === "function" &&
    typeof p.billingPrice?.findFirst === "function"
  );
}

/** Seed missing products/prices only — never overwrite admin-edited amounts. */
export async function ensureBillingCatalog() {
  if (catalogReady) return;

  if (!billingModelsAvailable()) {
    console.warn(
      "[billing] Prisma client missing Product/BillingPrice models — restart the dev server after prisma generate"
    );
    return;
  }

  for (const item of ALL_CATALOG) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        program: item.program,
        planTier: item.planTier ?? null,
        sortOrder: item.sortOrder ?? 0,
        stripeProductId: item.stripeProductId,
      },
      update: {
        name: item.name,
        program: item.program,
        planTier: item.planTier ?? null,
        sortOrder: item.sortOrder ?? 0,
      },
    });

    for (const price of item.prices) {
      const existing = await prisma.billingPrice.findFirst({
        where: {
          productId: product.id,
          billingInterval: price.billingInterval,
          isFirstMonth: price.isFirstMonth ?? false,
        },
      });

      if (existing) {
        await prisma.billingPrice.update({
          where: { id: existing.id },
          data: {
            stripePriceId: price.stripePriceId || existing.stripePriceId,
            label: existing.label || price.label,
            isDefault: existing.isDefault || (price.isDefault ?? false),
          },
        });
      } else {
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
  return prisma.product.findFirst({
    where: { planTier, program: "WEIGHT_MANAGEMENT", isActive: true },
    include: {
      billingPrices: {
        where: { isActive: true, isFirstMonth: false },
        orderBy: { amountCents: "asc" },
      },
    },
  });
}

/** Resolve catalog product for a clinical program (hair, vitality, organ care, etc.). */
export async function findProductByProgram(program: string, planTier?: string | null) {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;
  return prisma.product.findFirst({
    where: {
      program,
      isActive: true,
      ...(planTier != null && planTier !== ""
        ? { planTier }
        : { OR: [{ planTier: null }, { planTier: "" }] }),
    },
    include: {
      billingPrices: {
        where: { isActive: true },
        orderBy: [{ isFirstMonth: "desc" }, { amountCents: "asc" }],
      },
    },
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
  if (!product) return null;

  return prisma.billingPrice.findFirst({
    where: {
      productId: product.id,
      billingInterval: interval,
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
