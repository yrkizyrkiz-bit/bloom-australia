import { NextResponse } from "next/server";

/**
 * @deprecated Use POST /api/portal/checkout/intent then /api/portal/checkout/confirm.
 * This route granted PENDING entitlements without Stripe and is disabled for launch.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "This checkout endpoint is deprecated.",
      useInstead: ["/api/portal/checkout/intent", "/api/portal/checkout/confirm"],
    },
    { status: 410 }
  );
}
