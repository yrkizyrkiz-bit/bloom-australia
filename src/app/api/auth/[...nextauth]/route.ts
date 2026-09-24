import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { RATE_LIMITS, rateLimitBucketKey } from "@/lib/security/rate-limit-config";
import { consumeRateLimit, peekRateLimit } from "@/lib/security/rate-limit-db";
import { getClientIp } from "@/lib/security/rate-limit-http";

const handler = NextAuth(authOptions);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

const TOO_MANY_ATTEMPTS =
  "Too many sign-in attempts. Please wait a few minutes and try again.";

function loginBucketKey(req: NextRequest): string {
  return rateLimitBucketKey("auth-login:ip", getClientIp(req));
}

/**
 * NextAuth reports a rejected credentials sign-in as a 401 (JSON mode) or as a
 * redirect back to the error page (form mode). Successful sign-ins are 200 or
 * a redirect to the callback URL.
 */
function isFailedSignIn(res: Response): boolean {
  if (res.status === 401) return true;
  const location = res.headers.get("location") ?? "";
  return location.includes("error=");
}

/**
 * Shaped like a NextAuth redirect result so `signIn("credentials", { redirect: false })`
 * surfaces `error` to the login page and a form post lands on the usual error page.
 */
function tooManyAttemptsResponse(req: NextRequest, retryAfterSec?: number): Response {
  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const url = `${origin}/?error=${encodeURIComponent(TOO_MANY_ATTEMPTS)}`;
  const headers: Record<string, string> = {};
  if (retryAfterSec) headers["Retry-After"] = String(retryAfterSec);
  return Response.json({ url, error: TOO_MANY_ATTEMPTS }, { status: 429, headers });
}

async function handleAuth(req: NextRequest, context: RouteContext) {
  const segments = (await context.params).nextauth ?? [];
  const action = segments[0];
  const isCredentialsSignIn =
    req.method === "POST" && action === "callback" && segments[1] === "credentials";

  let bucketKey: string | null = null;
  if (isCredentialsSignIn) {
    bucketKey = loginBucketKey(req);
    try {
      const peek = await peekRateLimit(bucketKey, RATE_LIMITS.authLoginIp);
      if (!peek.allowed) {
        return tooManyAttemptsResponse(req, peek.retryAfterSec);
      }
    } catch (error) {
      // A rate-limit store outage must not lock every member out.
      console.error("[next-auth] Rate limit check failed:", error);
    }
  }

  try {
    const res = await handler(req, context);
    if (bucketKey && isFailedSignIn(res)) {
      // Only failed attempts count towards the limit.
      await consumeRateLimit(bucketKey, RATE_LIMITS.authLoginIp).catch((error) =>
        console.error("[next-auth] Rate limit record failed:", error)
      );
    }
    return res;
  } catch (error) {
    console.error("[next-auth] Handler error:", action, error);

    // Session polling must always return JSON, plain-text 500s cause CLIENT_FETCH_ERROR.
    if (req.method === "GET" && action === "session") {
      return Response.json({});
    }

    return Response.json(
      { error: "AuthenticationError", message: "Authentication request failed" },
      { status: 500 },
    );
  }
}

export { handleAuth as GET, handleAuth as POST };
