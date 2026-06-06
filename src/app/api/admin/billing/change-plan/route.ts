import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { changeMemberPlan } from "@/lib/billing/change-plan";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, targetBillingPriceId, effective, notes } = body;

    if (!memberId || !targetBillingPriceId) {
      return NextResponse.json(
        { error: "memberId and targetBillingPriceId are required" },
        { status: 400 }
      );
    }

    const result = await changeMemberPlan({
      memberId,
      targetBillingPriceId,
      effective: effective === "immediate" ? "immediate" : "next_period",
      changedBy: session.user.id,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[billing/change-plan]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to change plan" },
      { status: 500 }
    );
  }
}
