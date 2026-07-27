import { NextResponse } from "next/server";
import { createPublicBiomarkersPaymentIntent } from "@/lib/portal/public-biomarkers-purchase";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(request: Request) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request as import("next/server").NextRequest,
      "public-biomarkers-checkout:intent",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const publicPanelTier = body?.publicPanelTier as string;
    if (!isValidPublicPanelTier(publicPanelTier)) {
      return NextResponse.json({ error: "Invalid panel tier" }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      postcode,
      address,
      sourceProgram,
      includeRetestAddon,
    } = body ?? {};
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Missing required contact details" }, { status: 400 });
    }

    const result = await createPublicBiomarkersPaymentIntent({
      publicPanelTier,
      includeRetestAddon: Boolean(includeRetestAddon),
      sourceProgram:
        typeof sourceProgram === "string" && sourceProgram.trim()
          ? sourceProgram.trim()
          : undefined,
      details: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        postcode: postcode ? String(postcode).trim() : undefined,
        address: address ? String(address).trim() : undefined,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[public/biomarkers-checkout/intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
