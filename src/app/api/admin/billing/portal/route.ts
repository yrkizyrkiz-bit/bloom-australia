import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/billing/change-plan";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const returnUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/crm/customers/${memberId}`;
    const url = await createBillingPortalSession(memberId, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[billing/portal]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open portal" },
      { status: 500 }
    );
  }
}
