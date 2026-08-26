import type { BillingInterval } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  billingModelsAvailable,
  ensureBillingCatalog,
  resetBillingCatalogCache,
} from "@/lib/billing/catalog";

function invalidateCatalogCaches() {
  invalidateCatalogCaches();
  revalidateTag("billing-catalog");
}

/**
 * Admin-side catalog management. Products and prices live in the database
 * (Product / BillingPrice) and are fully managed here, the hardcoded catalog
 * in catalog.ts is only a first-run seed.
 */

export const BILLING_INTERVALS: BillingInterval[] = [
  "ONE_TIME",
  "MONTHLY",
  "QUARTERLY",
  "BIANNUAL",
  "YEARLY",
];

/** Program/category options an admin can attach a product to. */
export const PRODUCT_PROGRAM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "WEIGHT_MANAGEMENT", label: "Weight Management" },
  { value: "HAIR_LOSS", label: "Hair Loss" },
  { value: "MENS_HEALTH_VITALITY", label: "Men's Vitality" },
  { value: "MENS_HEALTH_SEXUAL", label: "Men's Sexual Health" },
  { value: "WOMENS_HEALTH_VITALITY", label: "Women's Vitality" },
  { value: "WOMENS_HEALTH_SEXUAL", label: "Women's Sexual Health" },
  { value: "BIOLOGICAL_CLOCK", label: "Biomarker Panels" },
  { value: "ORGAN_CARE", label: "Organ Care / Membership" },
];

export type AdminPriceRow = {
  id: string;
  billingInterval: BillingInterval;
  amountCents: number;
  amountAud: number;
  label: string | null;
  isDefault: boolean;
  isFirstMonth: boolean;
  isActive: boolean;
  stripePriceId: string | null;
};

export type AdminProductRow = {
  productId: string;
  slug: string;
  name: string;
  program: string;
  planTier: string | null;
  sortOrder: number;
  isActive: boolean;
  subscriptionCount: number;
  prices: AdminPriceRow[];
};

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** List ALL products (including inactive) for the admin catalog screen. */
export async function listCatalogForAdmin(): Promise<AdminProductRow[]> {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return [];

  const products = await prisma.product.findMany({
    orderBy: [{ program: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      billingPrices: { orderBy: [{ isFirstMonth: "desc" }, { billingInterval: "asc" }] },
      _count: { select: { memberSubscriptions: true } },
    },
  });

  return products.map((p) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    program: p.program,
    planTier: p.planTier,
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    subscriptionCount: p._count.memberSubscriptions,
    prices: p.billingPrices.map((row) => ({
      id: row.id,
      billingInterval: row.billingInterval,
      amountCents: row.amountCents,
      amountAud: row.amountCents / 100,
      label: row.label,
      isDefault: row.isDefault,
      isFirstMonth: row.isFirstMonth,
      isActive: row.isActive,
      stripePriceId: row.stripePriceId,
    })),
  }));
}

export type NewPriceInput = {
  billingInterval: BillingInterval;
  amountCents: number;
  label?: string | null;
  isFirstMonth?: boolean;
  isDefault?: boolean;
};

export type CreateProductInput = {
  name: string;
  slug?: string | null;
  program: string;
  planTier?: string | null;
  sortOrder?: number;
  prices?: NewPriceInput[];
};

export async function createCatalogProduct(input: CreateProductInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Product name is required");
  if (!input.program?.trim()) throw new Error("Program/category is required");

  const slug = (input.slug?.trim() || slugifyProductName(name)) as string;
  if (!slug) throw new Error("Could not derive a slug from the product name");

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) throw new Error(`A product with slug "${slug}" already exists`);

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      program: input.program.trim(),
      planTier: input.planTier?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  for (const price of input.prices ?? []) {
    if (!Number.isFinite(price.amountCents) || price.amountCents < 0) continue;
    await prisma.billingPrice.create({
      data: {
        productId: product.id,
        billingInterval: price.billingInterval,
        amountCents: Math.round(price.amountCents),
        label: price.label?.trim() || null,
        isFirstMonth: price.isFirstMonth ?? false,
        isDefault: price.isDefault ?? false,
      },
    });
  }

  invalidateCatalogCaches();
  return product;
}

export type UpdateProductInput = {
  name?: string;
  program?: string;
  planTier?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function updateCatalogProduct(productId: string, input: UpdateProductInput) {
  const data: Record<string, unknown> = {};
  if (typeof input.name === "string" && input.name.trim()) data.name = input.name.trim();
  if (typeof input.program === "string" && input.program.trim()) data.program = input.program.trim();
  if (input.planTier !== undefined) data.planTier = input.planTier?.trim() || null;
  if (typeof input.sortOrder === "number") data.sortOrder = Math.round(input.sortOrder);
  if (typeof input.isActive === "boolean") data.isActive = input.isActive;
  if (Object.keys(data).length === 0) return;

  await prisma.product.update({ where: { id: productId }, data });
  invalidateCatalogCaches();
}

/**
 * Delete a product. If members have ever subscribed to it, we deactivate it
 * instead (hard delete would cascade into their subscription records).
 */
export async function deleteCatalogProduct(
  productId: string
): Promise<{ deleted: boolean; deactivated: boolean }> {
  const subscriptionCount = await prisma.memberSubscription.count({
    where: { productId },
  });

  if (subscriptionCount > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    invalidateCatalogCaches();
    return { deleted: false, deactivated: true };
  }

  await prisma.product.delete({ where: { id: productId } });
  invalidateCatalogCaches();
  return { deleted: true, deactivated: false };
}

export async function addCatalogPrice(productId: string, price: NewPriceInput) {
  if (!Number.isFinite(price.amountCents) || price.amountCents < 0) {
    throw new Error("A valid amount is required");
  }

  const duplicate = await prisma.billingPrice.findFirst({
    where: {
      productId,
      billingInterval: price.billingInterval,
      isFirstMonth: price.isFirstMonth ?? false,
    },
  });
  if (duplicate) {
    throw new Error("This product already has a price for that billing interval");
  }

  const created = await prisma.billingPrice.create({
    data: {
      productId,
      billingInterval: price.billingInterval,
      amountCents: Math.round(price.amountCents),
      label: price.label?.trim() || null,
      isFirstMonth: price.isFirstMonth ?? false,
      isDefault: price.isDefault ?? false,
    },
  });

  invalidateCatalogCaches();
  return created;
}

export async function deleteCatalogPrice(priceId: string) {
  // MemberSubscription.billingPriceId is onDelete: SetNull, so this is safe;
  // historical invoices keep their own amount snapshots.
  await prisma.billingPrice.delete({ where: { id: priceId } });
  invalidateCatalogCaches();
}
