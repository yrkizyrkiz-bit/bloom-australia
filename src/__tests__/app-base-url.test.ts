import { afterEach, describe, expect, it } from "vitest";
import { resolveAppBaseUrl, sameOriginMagicHref } from "@/lib/app-base-url";
import type { NextRequest } from "next/server";

const ORIGINAL = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  URL: process.env.URL,
  CONTEXT: process.env.CONTEXT,
};

afterEach(() => {
  process.env.NEXTAUTH_URL = ORIGINAL.NEXTAUTH_URL;
  process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL.NEXT_PUBLIC_BASE_URL;
  process.env.URL = ORIGINAL.URL;
  process.env.CONTEXT = ORIGINAL.CONTEXT;
});

function fakeRequest(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? null,
    },
  } as unknown as NextRequest;
}

describe("resolveAppBaseUrl", () => {
  it("rewrites a Netlify default domain to sanative.com.au in production", () => {
    process.env.CONTEXT = "production";
    process.env.NEXTAUTH_URL = "https://sanative.netlify.app";
    delete process.env.NEXT_PUBLIC_BASE_URL;

    expect(
      resolveAppBaseUrl({ clientOrigin: "https://sanative.netlify.app" })
    ).toBe("https://sanative.com.au");
    expect(
      resolveAppBaseUrl({
        request: fakeRequest({
          host: "sanative.netlify.app",
          "x-forwarded-proto": "https",
        }),
      })
    ).toBe("https://sanative.com.au");
  });

  it("keeps the custom domain when the browser is already on sanative.com.au", () => {
    process.env.CONTEXT = "production";
    process.env.NEXTAUTH_URL = "https://sanative.netlify.app";
    expect(
      resolveAppBaseUrl({ clientOrigin: "https://sanative.com.au" })
    ).toBe("https://sanative.com.au");
  });

  it("keeps Netlify preview hosts on deploy previews", () => {
    process.env.CONTEXT = "deploy-preview";
    process.env.NEXTAUTH_URL = "https://deploy-preview-12--sanative.netlify.app";
    expect(
      resolveAppBaseUrl({
        clientOrigin: "https://deploy-preview-12--sanative.netlify.app",
      })
    ).toBe("https://deploy-preview-12--sanative.netlify.app");
  });

  it("keeps localhost for local development", () => {
    delete process.env.CONTEXT;
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    expect(resolveAppBaseUrl({ clientOrigin: "http://localhost:3000" })).toBe(
      "http://localhost:3000"
    );
  });
});

describe("sameOriginMagicHref", () => {
  it("strips a Netlify host so the button stays on the current site", () => {
    expect(
      sameOriginMagicHref(
        "https://sanative.netlify.app/auth/magic?token=abc&redirect=%2Fdashboard"
      )
    ).toBe("/auth/magic?token=abc&redirect=%2Fdashboard");
  });
});
