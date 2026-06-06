import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberBillingSummary } from "@/lib/billing/member-billing-summary";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const summary = await getMemberBillingSummary(userId);

    if (!summary) {
      return NextResponse.json({ error: "Billing profile not found" }, { status: 404 });
    }

    if (summary.selectedPlan === "PRECISION") {
      return NextResponse.json(
        { error: "You are already on the Precision plan" },
        { status: 400 }
      );
    }

    const existing = await prisma.careCommunication.findFirst({
      where: {
        userId,
        type: "TIER_UPGRADE_REQUEST",
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRequested: true,
        message: "Your care team already has your upgrade request",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, assignedCarePartnerId: true },
    });

    await prisma.careCommunication.create({
      data: {
        userId,
        type: "TIER_UPGRADE_REQUEST",
        priority: "NORMAL",
        subject: `Precision upgrade request: ${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        notes: `Member requested upgrade from Core to Precision via the billing page.

Current plan: ${summary.planLabel}
Billing: ${summary.recurring.billingLabel || "Monthly"} ${summary.recurring.amountAud != null ? `$${summary.recurring.amountAud}` : ""}
Paid till: ${summary.recurring.paidTill ? new Date(summary.recurring.paidTill).toLocaleDateString("en-AU") : "n/a"}

Clinical review required before applying the tier upgrade. Apply from CRM → Subscription → Upgrade to Precision when appropriate.`,
        status: "PENDING",
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        assignedTo: user?.assignedCarePartnerId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your care team will contact you about upgrading to Precision",
    });
  } catch (error) {
    console.error("[account/billing/request-upgrade]", error);
    return NextResponse.json(
      { error: "Failed to submit upgrade request" },
      { status: 500 }
    );
  }
}
