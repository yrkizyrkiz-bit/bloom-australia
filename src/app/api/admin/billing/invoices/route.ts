import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSydneyYmd, sydneyLocalToUtc } from "@/lib/sydney-time";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER", "DOCTOR"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(status && status !== "all" ? { status: status.toUpperCase() } : {}),
      },
      orderBy: { issuedAt: "desc" },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            subscriptionTier: true,
          },
        },
      },
    });

    const items = invoices.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      customerName: `${inv.user.firstName} ${inv.user.lastName}`.trim(),
      customerEmail: inv.user.email,
      plan: inv.user.subscriptionTier || "—",
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      description: inv.description,
      stripeId: inv.stripeId,
      issuedAt: inv.issuedAt.toISOString(),
      paidAt: inv.paidAt?.toISOString() || null,
      dueAt: inv.dueAt?.toISOString() || null,
    }));

    const invoiceWhere = userId ? { userId } : {};
    const sydney = getSydneyYmd(new Date());
    const monthStart = sydneyLocalToUtc(sydney.year, sydney.month, 1, 0, 0);

    const [grouped, paidThisMonth, activeMembers, totalMembers] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where: invoiceWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: {
          ...invoiceWhere,
          status: { in: ["PAID", "paid"] },
          OR: [
            { paidAt: { gte: monthStart } },
            { paidAt: null, issuedAt: { gte: monthStart } },
          ],
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.user.count({ where: { role: "MEMBER", subscriptionStatus: "ACTIVE" } }),
      prisma.user.count({ where: { role: "MEMBER" } }),
    ]);

    const byStatus = new Map<string, { count: number; amount: number }>();
    for (const row of grouped) {
      const key = row.status.toUpperCase();
      const current = byStatus.get(key) ?? { count: 0, amount: 0 };
      current.count += row._count.id;
      current.amount += row._sum.amount ?? 0;
      byStatus.set(key, current);
    }
    const statusTotal = (status: string) => byStatus.get(status) ?? { count: 0, amount: 0 };
    const paid = statusTotal("PAID");
    const pending = statusTotal("PENDING");
    const failed = statusTotal("FAILED");
    const refunded = statusTotal("REFUNDED");

    const summary = {
      total: grouped.reduce((sum, row) => sum + row._count.id, 0),
      paid: paid.count,
      pending: pending.count,
      failed: failed.count,
      refunded: refunded.count,
      totalRevenue: paid.amount,
      pendingRevenue: pending.amount,
      refundedAmount: Math.abs(refunded.amount),
      paidThisMonth: paidThisMonth._sum.amount ?? 0,
      paidThisMonthCount: paidThisMonth._count.id,
      activeMembers,
      totalMembers,
    };

    const PLAN_ORDER = [
      { slug: "sanative_membership", label: "Membership" },
      { slug: "weight_management", label: "WM" },
      { slug: "hair_loss", label: "HL" },
      { slug: "mens_health_sexual", label: "ER" },
      { slug: "womens_health_sexual", label: "Women's" },
    ] as const;

    const catalog = await prisma.product.findMany({
      where: { slug: { in: PLAN_ORDER.map((plan) => plan.slug) }, isActive: true },
      include: {
        billingPrices: {
          where: { isActive: true },
          orderBy: [{ isDefault: "desc" }, { amountCents: "asc" }],
        },
        _count: {
          select: {
            memberSubscriptions: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    const plans = PLAN_ORDER.flatMap((plan) => {
      const product = catalog.find((row) => row.slug === plan.slug);
      if (!product) return [];
      return [
        {
          slug: product.slug,
          label: plan.label,
          name: product.name,
          activeSubscribers: product._count.memberSubscriptions,
          prices: product.billingPrices.map((price) => ({
            amountAud: price.amountCents / 100,
            interval: price.billingInterval,
            label: price.label,
          })),
        },
      ];
    });

    return NextResponse.json({ invoices: items, summary, plans });
  } catch (error) {
    console.error("[billing/invoices]", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
