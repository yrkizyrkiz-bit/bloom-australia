import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { issuedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        description: inv.description,
        paymentMethod: inv.paymentMethod,
        issuedAt: inv.issuedAt.toISOString(),
        paidAt: inv.paidAt?.toISOString() || null,
        dueAt: inv.dueAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("[account/billing/invoices]", error);
    return NextResponse.json(
      { error: "Failed to load invoices" },
      { status: 500 }
    );
  }
}
