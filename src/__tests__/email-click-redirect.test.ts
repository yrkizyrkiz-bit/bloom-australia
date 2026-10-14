import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEmailClickTrackingUrl,
  resolveSafeEmailClickRedirect,
} from "@/lib/email/click-redirect";

describe("email click redirect safety", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_URL", "https://sanative.com.au");
    vi.stubEnv("EMAIL_CLICK_ALLOWED_HOSTS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows same-origin redirects", () => {
    const safe = resolveSafeEmailClickRedirect(
      "https://sanative.com.au/dashboard",
      null
    );
    expect(safe).toBe("https://sanative.com.au/dashboard");
  });

  it("blocks external redirects not on the allowlist", () => {
    expect(
      resolveSafeEmailClickRedirect("https://evil.example/phish", null)
    ).toBeNull();
    expect(
      resolveSafeEmailClickRedirect("https://cal.com/sanative/consult", null)
    ).toBeNull();
  });

  it("allows hosts listed in EMAIL_CLICK_ALLOWED_HOSTS", () => {
    vi.stubEnv("EMAIL_CLICK_ALLOWED_HOSTS", "cal.com,www.cal.com");
    expect(
      resolveSafeEmailClickRedirect("https://cal.com/sanative/consult", null)
    ).toBe("https://cal.com/sanative/consult");
  });

  it("rejects javascript: and credentialed URLs", () => {
    expect(resolveSafeEmailClickRedirect("javascript:alert(1)", null)).toBeNull();
    expect(
      resolveSafeEmailClickRedirect("https://user:pass@sanative.com.au/x", null)
    ).toBeNull();
  });

  it("builds tracked click URLs that still pass the allowlist", () => {
    const tracked = buildEmailClickTrackingUrl({
      baseUrl: "https://sanative.com.au",
      campaignId: "camp_1",
      email: "a@b.co",
      targetUrl: "https://sanative.com.au/join",
    });
    const parsed = new URL(tracked);
    expect(parsed.pathname).toBe("/api/email/click");
    expect(
      resolveSafeEmailClickRedirect(parsed.searchParams.get("url"), null)
    ).toBe("https://sanative.com.au/join");
  });
});
