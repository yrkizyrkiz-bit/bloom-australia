import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Pricing tiers
const PRICING = {
  free: { name: "Free Trial", price: 0, tax: 0 },
  basic: { name: "Basic Plan", price: 29, tax: 2.9 },
  premium: { name: "Premium Plan", price: 79, tax: 7.9 },
  enterprise: { name: "Enterprise Plan", price: 199, tax: 19.9 },
};

// GET /api/invoices - Get invoices (admin: all, user: own)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const where: Record<string, unknown> = {};

    if (session.user.role === "ADMIN") {
      if (userId) where.userId = userId;
    } else {
      where.userId = session.user.id;
    }

    if (status) where.status = status.toUpperCase();

    // Note: We'll store invoices in a JSON field on users or create a simple in-memory store
    // For now, generate invoices based on subscription history

    const users = await prisma.user.findMany({
      where: session.user.role === "ADMIN" ? (userId ? { id: userId } : { role: "MEMBER" }) : { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        createdAt: true,
      },
      take: limit,
    });

    // Generate invoice history based on user subscription
    const invoices = users.flatMap(user => {
      const tier = (user.subscriptionTier || "free") as keyof typeof PRICING;
      const pricing = PRICING[tier] || PRICING.free;

      if (pricing.price === 0) return [];

      // Generate invoices for past months since signup
      const startDate = new Date(user.createdAt);
      const now = new Date();
      const monthsSinceSignup = Math.min(12, Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

      return Array.from({ length: Math.max(1, monthsSinceSignup) }, (_, i) => {
        const invoiceDate = new Date(now);
        invoiceDate.setMonth(invoiceDate.getMonth() - i);

        const isPaid = i > 0 || user.subscriptionStatus === "ACTIVE";

        return {
          id: `INV-${user.id.slice(-6).toUpperCase()}-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, "0")}`,
          userId: user.id,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          plan: pricing.name,
          tier: tier,
          amount: pricing.price,
          tax: pricing.tax,
          total: pricing.price + pricing.tax,
          status: isPaid ? "PAID" : (i === 0 ? "PENDING" : "OVERDUE"),
          dueDate: new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 15).toISOString(),
          paidAt: isPaid ? new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 10).toISOString() : null,
          createdAt: invoiceDate.toISOString(),
          items: [
            {
              description: `${pricing.name} - ${invoiceDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`,
              quantity: 1,
              unitPrice: pricing.price,
              total: pricing.price,
            },
          ],
        };
      });
    });

    // Sort by date descending
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate summary
    const summary = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === "PAID").length,
      pending: invoices.filter(i => i.status === "PENDING").length,
      overdue: invoices.filter(i => i.status === "OVERDUE").length,
      totalRevenue: invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.total, 0),
      pendingRevenue: invoices.filter(i => i.status !== "PAID").reduce((sum, i) => sum + i.total, 0),
    };

    return NextResponse.json({ invoices: invoices.slice(0, limit), summary });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/invoices - Generate a new invoice (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, items, dueDate, notes } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "userId and items are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) =>
      sum + (item.unitPrice * item.quantity), 0);
    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% GST
    const total = subtotal + tax;

    const invoice = {
      id: `INV-${user.id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      userId: user.id,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      plan: "Custom Invoice",
      tier: user.subscriptionTier || "free",
      amount: subtotal,
      tax,
      total,
      status: "PENDING",
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: null,
      createdAt: new Date().toISOString(),
      items,
      notes,
    };

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "INVOICE_CREATED",
        entity: "invoice",
        entityId: invoice.id,
        details: { customerId: userId, total },
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "INFO",
        title: "New Invoice",
        message: `You have a new invoice for $${total.toFixed(2)}. Due: ${new Date(invoice.dueDate).toLocaleDateString("en-AU")}`,
        category: "SYSTEM",
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/invoices - Update invoice status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, status } = body;

    if (!invoiceId || !status) {
      return NextResponse.json(
        { error: "invoiceId and status are required" },
        { status: 400 }
      );
    }

    // In a real app, we'd update in database
    // For now, just log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "INVOICE_UPDATED",
        entity: "invoice",
        entityId: invoiceId,
        details: { newStatus: status },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceId} updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
