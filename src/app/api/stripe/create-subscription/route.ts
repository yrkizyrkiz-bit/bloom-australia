import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorOrAdmin } from "@/lib/auth/require-clinical-staff";
import { createWeightManagementCareSubscription } from "@/lib/billing/care-subscription";

/**
 * Create ongoing Weight Management Care subscription after doctor approval.
 * Pricing comes from Product / BillingPrice (typically $360 every 3 months).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireDoctorOrAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = await req.json();
    const { userId, startDate, firstPaymentIntentId } = body as {
      userId?: string;
      selectedPlan?: "CORE" | "PRECISION";
      startDate?: string;
      firstPaymentIntentId?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        {
          error: "Patient must be approved by doctor before creating subscription",
          approvalStatus: user.approvalStatus,
        },
        { status: 400 }
      );
    }

    const billingAnchorUnix = startDate
      ? Math.floor(new Date(startDate).getTime() / 1000)
      : undefined;

    const result = await createWeightManagementCareSubscription({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      firstPaymentIntentId,
      billingAnchorUnix,
      createdBy: "doctor_approval_api",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      amountLabel: result.amountLabel,
      billingStartDate: billingAnchorUnix
        ? new Date(billingAnchorUnix * 1000).toISOString()
        : undefined,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireDoctorOrAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberSubs = await prisma.memberSubscription.findMany({
      where: { userId, status: "ACTIVE" },
      include: { product: true, billingPrice: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionTier: user.subscriptionTier,
        approvalStatus: user.approvalStatus,
      },
      subscriptions: memberSubs.map((s) => ({
        id: s.id,
        product: s.product.name,
        slug: s.product.slug,
        amountCents: s.billingPrice?.amountCents ?? null,
        interval: s.billingPrice?.billingInterval ?? null,
        stripeSubscriptionId: s.stripeSubscriptionId,
        status: s.status,
      })),
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}
