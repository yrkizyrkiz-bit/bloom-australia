import { NextRequest, NextResponse } from "next/server";
import { suggestAustralianAddresses } from "@/lib/address/lookup";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function GET(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "address-suggest:ip",
      RATE_LIMITS.addressSuggestIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const sessionToken = req.nextUrl.searchParams.get("sessionToken")?.trim() || undefined;

    if (query.length < 3 || query.length > 80) {
      return NextResponse.json({ suggestions: [], source: null });
    }

    const result = await suggestAustralianAddresses(query, sessionToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Address suggest failed:", error);
    return NextResponse.json(
      { error: "Address lookup is unavailable. Enter your address manually." },
      { status: 503 }
    );
  }
}
