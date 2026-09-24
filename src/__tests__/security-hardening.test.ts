import { createHmac } from "crypto";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidCalSignature } from "@/lib/security/cal-webhook-signature";
import { getAuthJwtSecret } from "@/lib/security/jwt-secret";

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listRouteFiles(full);
    return entry === "route.ts" ? [full] : [];
  });
}

describe("admin API routes enforce a staff role", () => {
  const adminApiDir = join(process.cwd(), "src/app/api/admin");
  const roleGuard =
    /requireClinicalStaff|requireDoctorOrAdmin|hasClinicalStaffRole|hasDoctorAdminRole|isStaffRole|ALLOWED_ROLES|allowedRoles|\.role\b|requireAdminAuth|requireCronAuth|blockDevOnlyRouteInProduction/;

  it("every /api/admin route checks a role, not just that a session exists", () => {
    const unguarded = listRouteFiles(adminApiDir)
      .filter((file) => !roleGuard.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(adminApiDir, ""));
    expect(unguarded).toEqual([]);
  });

  it("internal notes and biomarker campaigns use the shared staff guard", () => {
    for (const route of ["notes", "biomarker-campaigns"]) {
      const source = readFileSync(join(adminApiDir, route, "route.ts"), "utf8");
      expect(source).toContain("requireClinicalStaff");
      expect(source).not.toMatch(/if \(!session\?\.user(\?\.id)?\) \{/);
    }
  });
});

describe("auth JWT secret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured secret", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "configured-secret");
    expect(getAuthJwtSecret()).toBe("configured-secret");
  });

  it("falls back to a dev-only value outside production", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "test");
    expect(getAuthJwtSecret()).toBe("dev-nextauth-secret-not-for-production");
  });

  it("fails closed in production when no secret is configured", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getAuthJwtSecret()).toThrow(/NEXTAUTH_SECRET/);
  });
});

describe("Cal.com webhook signature", () => {
  const secret = "cal-secret";
  const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: { uid: "abc" } });
  const digest = createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a correct signature with or without the sha256= prefix", () => {
    expect(isValidCalSignature(body, digest, secret)).toBe(true);
    expect(isValidCalSignature(body, `sha256=${digest}`, secret)).toBe(true);
  });

  it("rejects unsigned requests", () => {
    expect(isValidCalSignature(body, null, secret)).toBe(false);
    expect(isValidCalSignature(body, "", secret)).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(isValidCalSignature(body, digest, undefined)).toBe(false);
    expect(isValidCalSignature(body, digest, "")).toBe(false);
  });

  it("rejects tampered bodies and malformed signatures", () => {
    expect(isValidCalSignature(body + " ", digest, secret)).toBe(false);
    expect(isValidCalSignature(body, "not-hex", secret)).toBe(false);
    expect(isValidCalSignature(body, digest.slice(0, 40), secret)).toBe(false);
  });
});
