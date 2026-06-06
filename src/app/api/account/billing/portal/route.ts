import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/billing/change-plan";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returnUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/billing`;
    const url = await createBillingPortalSession(session.user.id, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[account/billing/portal]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
