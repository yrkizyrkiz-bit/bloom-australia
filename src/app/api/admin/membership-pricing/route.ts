import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { BillingInterval } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetBillingCatalogCache } from "@/lib/billing/catalog";
import {
  BILLING_INTERVALS,
  PRODUCT_PROGRAM_OPTIONS,
  addCatalogPrice,
  createCatalogProduct,
  deleteCatalogPrice,
  deleteCatalogProduct,
  listCatalogForAdmin,
  updateCatalogProduct,
  type NewPriceInput,
} from "@/lib/billing/catalog-admin";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return null;
  }
  return session;
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return (
    typeof value === "string" &&
    (BILLING_INTERVALS as string[]).includes(value)
  );
}

function parseNewPrice(raw: unknown): NewPriceInput | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (!isBillingInterval(p.billingInterval)) return null;
  if (typeof p.amountCents !== "number" || p.amountCents < 0) return null;
  return {
    billingInterval: p.billingInterval,
    amountCents: p.amountCents,
    label: typeof p.label === "string" ? p.label : null,
    isFirstMonth: p.isFirstMonth === true,
    isDefault: p.isDefault === true,
  };
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await listCatalogForAdmin();
    return NextResponse.json({
      products,
      programOptions: PRODUCT_PROGRAM_OPTIONS,
      billingIntervals: BILLING_INTERVALS,
    });
  } catch (error) {
    console.error("[admin/membership-pricing]", error);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}

/** Create a new product (optionally with initial prices). */
export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Add a single price row to an existing product.
    if (body?.action === "add-price") {
      const price = parseNewPrice(body.price);
      if (typeof body.productId !== "string" || !price) {
        return NextResponse.json(
          { error: "productId and a valid price are required" },
          { status: 400 }
        );
      }
      await addCatalogPrice(body.productId, price);
      return NextResponse.json({ success: true, products: await listCatalogForAdmin() });
    }

    // Default action: create a product.
    if (typeof body?.name !== "string" || typeof body?.program !== "string") {
      return NextResponse.json({ error: "name and program are required" }, { status: 400 });
    }

    const prices = Array.isArray(body.prices)
      ? (body.prices.map(parseNewPrice).filter(Boolean) as NewPriceInput[])
      : [];

    await createCatalogProduct({
      name: body.name,
      slug: typeof body.slug === "string" ? body.slug : null,
      program: body.program,
      planTier: typeof body.planTier === "string" ? body.planTier : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      prices,
    });

    return NextResponse.json({ success: true, products: await listCatalogForAdmin() });
  } catch (error) {
    console.error("[admin/membership-pricing POST]", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Bulk update: product metadata and price rows. */
export async function PATCH(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const products = body?.products as Array<{
      id: string;
      name?: string;
      program?: string;
      planTier?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }>;
    const prices = body?.prices as Array<{
      id: string;
      amountCents?: number;
      label?: string;
      isActive?: boolean;
      isDefault?: boolean;
    }>;

    if (
      (!Array.isArray(products) || products.length === 0) &&
      (!Array.isArray(prices) || prices.length === 0)
    ) {
      return NextResponse.json(
        { error: "products or prices array required" },
        { status: 400 }
      );
    }

    for (const row of products ?? []) {
      if (!row?.id) continue;
      await updateCatalogProduct(row.id, {
        name: row.name,
        program: row.program,
        planTier: row.planTier,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      });
    }

    for (const row of prices ?? []) {
      if (!row?.id) continue;
      const data: Record<string, unknown> = {};
      if (typeof row.amountCents === "number" && row.amountCents >= 0) {
        data.amountCents = Math.round(row.amountCents);
      }
      if (typeof row.label === "string") data.label = row.label;
      if (typeof row.isActive === "boolean") data.isActive = row.isActive;
      if (typeof row.isDefault === "boolean") data.isDefault = row.isDefault;
      if (Object.keys(data).length === 0) continue;

      await prisma.billingPrice.update({ where: { id: row.id }, data });
    }

    resetBillingCatalogCache();
    return NextResponse.json({ success: true, products: await listCatalogForAdmin() });
  } catch (error) {
    console.error("[admin/membership-pricing PATCH]", error);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}

/** Delete a product (?productId=) or a price row (?priceId=). */
export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const priceId = url.searchParams.get("priceId");

    if (productId) {
      const result = await deleteCatalogProduct(productId);
      return NextResponse.json({
        success: true,
        ...result,
        products: await listCatalogForAdmin(),
      });
    }

    if (priceId) {
      await deleteCatalogPrice(priceId);
      return NextResponse.json({ success: true, products: await listCatalogForAdmin() });
    }

    return NextResponse.json({ error: "productId or priceId required" }, { status: 400 });
  } catch (error) {
    console.error("[admin/membership-pricing DELETE]", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
