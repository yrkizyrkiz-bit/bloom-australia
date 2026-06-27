import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestIpAddress } from "@/lib/legal/request-metadata";
import {
  RATE_LIMITS,
  rateLimitBucketKey,
  type RateLimitConfig,
} from "@/lib/security/rate-limit-config";
import { consumeRateLimit, type RateLimitResult } from "@/lib/security/rate-limit-db";

export function getClientIp(request: NextRequest | Request): string {
  return getRequestIpAddress(request) ?? "unknown";
}

export async function enforceDbRateLimit(
  bucketKey: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return consumeRateLimit(bucketKey, config);
}

export async function enforceDbRateLimits(
  checks: Array<{ bucketKey: string; config: RateLimitConfig }>
): Promise<RateLimitResult> {
  for (const check of checks) {
    const result = await enforceDbRateLimit(check.bucketKey, check.config);
    if (!result.allowed) return result;
  }
  return { allowed: true };
}

export function rateLimitExceededResponse(retryAfterSec?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterSec) {
    headers["Retry-After"] = String(retryAfterSec);
  }

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers }
  );
}

export async function enforceIpRateLimit(
  request: NextRequest | Request,
  scope: string,
  config: RateLimitConfig = RATE_LIMITS.authLoginIp
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return enforceDbRateLimit(rateLimitBucketKey(scope, ip), config);
}
