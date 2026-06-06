import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upgradeMemberTier } from "@/lib/billing/change-plan";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, notes } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const result = await upgradeMemberTier({
      memberId,
      targetPlanTier: "PRECISION",
      effective: "next_period",
      changedBy: session.user.id,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[billing/upgrade-tier]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upgrade tier" },
      { status: 500 }
    );
  }
}
