import { NextRequest, NextResponse } from "next/server";
import { getAustralianAddressDetails } from "@/lib/address/lookup";
import type { AddressLookupProvider } from "@/lib/address/types";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

const PROVIDERS = new Set<AddressLookupProvider>(["google", "photon"]);

export async function GET(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "address-details:ip",
      RATE_LIMITS.addressDetailsIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
    const provider = req.nextUrl.searchParams.get("provider")?.trim() as AddressLookupProvider;
    const sessionToken = req.nextUrl.searchParams.get("sessionToken")?.trim() || undefined;

    if (!id || !PROVIDERS.has(provider)) {
      return NextResponse.json({ error: "Invalid address selection" }, { status: 400 });
    }

    const address = await getAustralianAddressDetails(id, provider, sessionToken);
    if (!address) {
      return NextResponse.json({ error: "Could not load that address" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address details failed:", error);
    return NextResponse.json(
      { error: "Address lookup is unavailable. Enter your address manually." },
      { status: 503 }
    );
  }
}
