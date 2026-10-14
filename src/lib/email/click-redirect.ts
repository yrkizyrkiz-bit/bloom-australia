import type { NextRequest } from "next/server";
import { resolveAppBaseUrl } from "@/lib/app-base-url";

const PRODUCTION_HOSTS = new Set(["sanative.com.au", "www.sanative.com.au"]);

/**
 * Extra hosts allowed for email click redirects, comma-separated.
 * Example: EMAIL_CLICK_ALLOWED_HOSTS=cal.com,www.cal.com
 */
function configuredAllowedHosts(): Set<string> {
  const hosts = new Set<string>();
  const raw = process.env.EMAIL_CLICK_ALLOWED_HOSTS || "";
  for (const part of raw.split(",")) {
    const host = part.trim().toLowerCase().replace(/^\.+/, "");
    if (host) hosts.add(host);
  }
  return hosts;
}

function allowedRedirectHosts(request?: NextRequest): Set<string> {
  const hosts = new Set([...PRODUCTION_HOSTS, ...configuredAllowedHosts()]);

  try {
    hosts.add(new URL(resolveAppBaseUrl({ request })).hostname.toLowerCase());
  } catch {
    // ignore
  }

  for (const envKey of ["NEXTAUTH_URL", "NEXT_PUBLIC_BASE_URL"] as const) {
    const value = process.env[envKey];
    if (!value) continue;
    try {
      hosts.add(
        new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase()
      );
    } catch {
      // ignore
    }
  }

  return hosts;
}

function parseCandidateUrl(rawUrl: string, baseUrl: string): URL | null {
  let candidate = rawUrl.trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(candidate)) {
      candidate = decodeURIComponent(candidate);
    }
  } catch {
    return null;
  }

  try {
    return new URL(candidate, baseUrl);
  } catch {
    return null;
  }
}

/**
 * Resolve a click-tracking redirect target.
 * Only http(s) URLs on the app domain (or EMAIL_CLICK_ALLOWED_HOSTS) are allowed.
 */
export function resolveSafeEmailClickRedirect(
  rawUrl: string | null,
  _signature: string | null = null,
  request?: NextRequest
): string | null {
  if (!rawUrl) return null;

  const baseUrl = resolveAppBaseUrl({ request });
  const parsed = parseCandidateUrl(rawUrl, baseUrl);
  if (!parsed) return null;

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!allowedRedirectHosts(request).has(hostname)) {
    return null;
  }

  return parsed.toString();
}

/** Build a tracked click URL (destination must still pass the allowlist on click). */
export function buildEmailClickTrackingUrl(params: {
  baseUrl: string;
  campaignId: string;
  email: string;
  targetUrl: string;
}): string {
  const qs = new URLSearchParams({
    cid: params.campaignId,
    email: params.email,
    url: params.targetUrl,
  });
  return `${params.baseUrl}/api/email/click?${qs.toString()}`;
}
