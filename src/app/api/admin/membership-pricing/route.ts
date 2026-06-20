import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetBillingCatalogCache } from "@/lib/billing/catalog";
import { listAllMembershipPricing } from "@/lib/billing/portal-pricing";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await listAllMembershipPricing();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[admin/membership-pricing]", error);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const prices = body?.prices as Array<{
      id: string;
      amountCents?: number;
      label?: string;
      isActive?: boolean;
      isDefault?: boolean;
    }>;

    if (!Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json({ error: "prices array required" }, { status: 400 });
    }

    for (const row of prices) {
      if (!row.id) continue;
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
    const products = await listAllMembershipPricing();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("[admin/membership-pricing PATCH]", error);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}
