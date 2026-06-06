import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const summary = {
      total: items.length,
      paid: items.filter((i) => i.status === "PAID").length,
      pending: items.filter((i) => i.status === "PENDING").length,
      failed: items.filter((i) => i.status === "FAILED").length,
      totalRevenue: items
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.amount, 0),
      pendingRevenue: items
        .filter((i) => i.status === "PENDING")
        .reduce((sum, i) => sum + i.amount, 0),
    };

    return NextResponse.json({ invoices: items, summary });
  } catch (error) {
    console.error("[billing/invoices]", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
