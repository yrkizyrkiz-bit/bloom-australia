import { prisma } from "@/lib/prisma";
import type { BillingInterval } from "@prisma/client";

export type CatalogProductSeed = {
  slug: string;
  name: string;
  program: string;
  planTier: "CORE" | "PRECISION";
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
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 24900,
        stripePriceId: process.env.STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID,
        isFirstMonth: true,
        label: "First month",
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
        label: "Quarterly",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 189000,
        stripePriceId: process.env.STRIPE_WM_CORE_BIANNUAL_PRICE_ID,
        label: "6-month",
      },
    ],
  },
  {
    slug: "wm_precision",
    name: "Sanative Precision",
    program: "WEIGHT_MANAGEMENT",
    planTier: "PRECISION",
    prices: [
      {
        billingInterval: "ONE_TIME",
        amountCents: 39900,
        stripePriceId: process.env.STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID,
        isFirstMonth: true,
        label: "First month",
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
        label: "Quarterly",
      },
      {
        billingInterval: "BIANNUAL",
        amountCents: 269000,
        stripePriceId: process.env.STRIPE_WM_PRECISION_BIANNUAL_PRICE_ID,
        label: "6-month",
      },
    ],
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

export async function ensureBillingCatalog() {
  if (catalogReady) return;

  if (!billingModelsAvailable()) {
    console.warn(
      "[billing] Prisma client missing Product/BillingPrice models — restart the dev server after prisma generate"
    );
    return;
  }

  for (const item of WM_CATALOG) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        program: item.program,
        planTier: item.planTier,
        stripeProductId: item.stripeProductId,
      },
      update: {
        name: item.name,
        program: item.program,
        planTier: item.planTier,
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
            amountCents: price.amountCents,
            stripePriceId: price.stripePriceId || existing.stripePriceId,
            isDefault: price.isDefault ?? false,
            label: price.label,
            isActive: true,
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

export async function findProductByPlanTier(
  planTier: "CORE" | "PRECISION"
) {
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
    QUARTERLY: "Quarterly",
    BIANNUAL: "6-month",
    YEARLY: "Yearly",
    ONE_TIME: "One-time",
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
