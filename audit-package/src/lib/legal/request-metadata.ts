import type { NextRequest } from "next/server";

export function getRequestIpAddress(request: NextRequest | Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip") ?? null;
}

export function getRequestUserAgent(request: NextRequest | Request): string | null {
  return request.headers.get("user-agent") ?? null;
}
