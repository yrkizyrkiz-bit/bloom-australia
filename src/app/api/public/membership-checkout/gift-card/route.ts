import { NextRequest, NextResponse } from "next/server";
import { validateGiftCard } from "@/lib/gift-cards";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

/** Peek whether a membership gift card is unused. Does not consume the code. */
export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "membership-checkout-gift-card:ip",
      RATE_LIMITS.giftCardValidateIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    const result = await validateGiftCard(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[public/membership-checkout/gift-card]", error);
    return NextResponse.json({ error: "Failed to check gift card" }, { status: 500 });
  }
}
