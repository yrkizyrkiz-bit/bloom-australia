import type { NextRequest } from "next/server";

/**
 * Resolve the public app origin for links in emails and API responses.
 * Prefers the active browser/request origin in dev, then env, then production default.
 */
export function resolveAppBaseUrl(options?: {
  clientOrigin?: string | null;
  request?: NextRequest;
}): string {
  const { clientOrigin, request } = options ?? {};

  if (clientOrigin) {
    try {
      const url = new URL(clientOrigin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // ignore invalid client origin
    }
  }

  if (request) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        return new URL(origin).origin;
      } catch {
        // fall through
      }
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host && !host.includes(",")) {
      const proto =
        request.headers.get("x-forwarded-proto") ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      return envUrl.replace(/\/$/, "");
    }
  }

  return "https://sanative.com.au";
}
