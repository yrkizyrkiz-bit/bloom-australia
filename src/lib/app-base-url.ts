import type { NextRequest } from "next/server";

const PRODUCTION_ORIGIN = "https://sanative.com.au";

function originFromValue(value: string): string | null {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function hostnameOf(origin: string): string {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isNetlifyDeployOrigin(origin: string): boolean {
  return hostnameOf(origin).endsWith(".netlify.app");
}

function isLocalOrigin(origin: string): boolean {
  const host = hostnameOf(origin);
  return host === "localhost" || host === "127.0.0.1";
}

function netlifyDeployContext(): string {
  return (process.env.CONTEXT || "").toLowerCase();
}

/** Preview / branch deploys may keep their *.netlify.app origin. Production must not. */
function allowNetlifyDeployOrigin(): boolean {
  const context = netlifyDeployContext();
  return context === "deploy-preview" || context === "branch-deploy";
}

function configuredPublicOrigin(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  const fromEnv = envUrl ? originFromValue(envUrl) : null;
  if (fromEnv && !isNetlifyDeployOrigin(fromEnv) && !isLocalOrigin(fromEnv)) {
    return fromEnv;
  }
  const siteUrl = process.env.URL ? originFromValue(process.env.URL) : null;
  if (siteUrl && !isNetlifyDeployOrigin(siteUrl) && !isLocalOrigin(siteUrl)) {
    return siteUrl;
  }
  return null;
}

function canonicalPublicOrigin(): string {
  return configuredPublicOrigin() || PRODUCTION_ORIGIN;
}

function acceptOrigin(origin: string): string | null {
  if (isLocalOrigin(origin)) return origin;
  if (isNetlifyDeployOrigin(origin)) {
    if (allowNetlifyDeployOrigin()) return origin;
    return canonicalPublicOrigin();
  }
  return origin;
}

/**
 * Resolve the public app origin for links in emails and API responses.
 * Prefers the active browser/request origin in dev, then env, then production default.
 * Production never emits a *.netlify.app host, even if NEXTAUTH_URL still points there.
 */
export function resolveAppBaseUrl(options?: {
  clientOrigin?: string | null;
  request?: NextRequest;
}): string {
  const { clientOrigin, request } = options ?? {};

  if (clientOrigin) {
    const origin = originFromValue(clientOrigin);
    if (origin) return acceptOrigin(origin);
  }

  if (request) {
    const headerOrigin = request.headers.get("origin");
    if (headerOrigin) {
      const origin = originFromValue(headerOrigin);
      if (origin) return acceptOrigin(origin);
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host && !host.includes(",")) {
      const proto =
        request.headers.get("x-forwarded-proto") ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      const origin = originFromValue(`${proto}://${host}`);
      if (origin) return acceptOrigin(origin);
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (envUrl) {
    const origin = originFromValue(envUrl) || envUrl.replace(/\/$/, "");
    if (origin.startsWith("http")) return acceptOrigin(origin);
    return origin;
  }

  return canonicalPublicOrigin();
}

/** Keep portal activation on the current host when the API returned an absolute magic URL. */
export function sameOriginMagicHref(magicLink: string): string {
  try {
    const url = new URL(magicLink, PRODUCTION_ORIGIN);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return magicLink;
  }
}
