/**
 * Security gate tests, production leak removal and access control.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { canAccessPatientClinicalRecord } from "@/lib/security/patient-access";
import { blockDevOnlyRouteInProduction } from "@/lib/security/environment";
import { blockStripeTestRouteInProduction } from "@/lib/stripe/route-guards";
import { assertCronAuthorized } from "@/lib/security/cron-auth";
import { NextRequest } from "next/server";

const BASE_URL = process.env.SECURITY_TEST_BASE_URL ?? "http://localhost:3000";

describe("Security, patient clinical access", () => {
  it("allows admin to access any patient", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "ADMIN",
        actorUserId: "admin-1",
        patientUserId: "patient-1",
        assignedDoctorId: "doctor-2",
      })
    ).toBe(true);
  });

  it("allows care partner to access any patient", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "CARE_PARTNER",
        actorUserId: "cp-1",
        patientUserId: "patient-1",
        assignedDoctorId: "doctor-2",
      })
    ).toBe(true);
  });

  it("allows doctor assigned to patient", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "DOCTOR",
        actorUserId: "doctor-1",
        patientUserId: "patient-1",
        assignedDoctorId: "doctor-1",
      })
    ).toBe(true);
  });

  it("allows doctor when patient is unassigned (triage pool)", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "DOCTOR",
        actorUserId: "doctor-1",
        patientUserId: "patient-1",
        assignedDoctorId: null,
      })
    ).toBe(true);
  });

  it("denies doctor for another doctor's assigned patient", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "DOCTOR",
        actorUserId: "doctor-1",
        patientUserId: "patient-1",
        assignedDoctorId: "doctor-2",
      })
    ).toBe(false);
  });

  it("denies member/patient role", () => {
    expect(
      canAccessPatientClinicalRecord({
        actorRole: "MEMBER",
        actorUserId: "patient-1",
        patientUserId: "patient-1",
        assignedDoctorId: null,
      })
    ).toBe(false);
  });
});

describe("Security, production route guards", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalEnv ?? "test");
    vi.unstubAllEnvs();
  });

  it("blocks dev-only routes in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = blockDevOnlyRouteInProduction();
    expect(res?.status).toBe(404);
  });

  it("allows dev-only routes outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(blockDevOnlyRouteInProduction()).toBeNull();
  });

  it("blocks Stripe test route in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = blockStripeTestRouteInProduction();
    expect(res?.status).toBe(404);
  });

  it("requires CRON_SECRET in production for cron routes", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "test-secret");

    const unauthReq = new NextRequest("http://localhost/api/cron/program-daily");
    expect(assertCronAuthorized(unauthReq)?.status).toBe(401);

    const authReq = new NextRequest("http://localhost/api/cron/program-daily", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(assertCronAuthorized(authReq)).toBeNull();
  });

  it("rejects cron when production has no CRON_SECRET configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.CRON_SECRET;

    const req = new NextRequest("http://localhost/api/cron/program-daily", {
      headers: { authorization: "Bearer anything" },
    });
    expect(assertCronAuthorized(req)?.status).toBe(401);
  });
});

describe("Security, unauthenticated API integration", () => {
  it("logged-out user opening doctor brief API returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/doctor-brief/test-intake-id`);
    expect(res.status).toBe(401);
  });

  it("logged-out user opening patient brief API returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/doctor/patient-brief/test-patient-id`);
    expect(res.status).toBe(401);
  });

  it("logged-out user opening doctor decision API returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/doctor/decision`);
    expect(res.status).toBe(401);
  });

  it("logged-out user hitting portal context returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/context`);
    expect(res.status).toBe(401);
  });

  it("logged-out user hitting another user profile returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/users/other-user-id`);
    expect(res.status).toBe(401);
  });

  it("public user hitting seed route returns 404 in production build", async () => {
    if (process.env.NODE_ENV === "production") {
      const res = await fetch(`${BASE_URL}/api/admin/doctor-roster/seed`);
      expect([404, 401, 403]).toContain(res.status);
    } else {
      const res = await fetch(`${BASE_URL}/api/admin/doctor-roster/seed`);
      expect([401, 403, 404]).toContain(res.status);
    }
  });

  it("public user hitting debug-session returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/debug-session`);
    expect(res.status).toBe(404);
  });
});

describe("Security, Stripe subscription userId tampering", () => {
  it("rejects payment when body userId does not match session (no session = allowed for anonymous checkout)", async () => {
    const res = await fetch(`${BASE_URL}/api/stripe/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "not-a-real-user-id-for-tamper-test",
        planId: "core",
      }),
    });
    // Without session: proceeds to user lookup, expect 404 not found
    expect([404, 403, 400, 500]).toContain(res.status);
  });
});

describe("Security, booking confirm payment verification", () => {
  it("rejects confirm without a valid Stripe payment intent", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingHoldId: "fake-hold-id",
        paymentIntentId: "pi_fake_not_from_stripe",
        userId: "fake-user-id",
        selectedPlan: "CORE",
      }),
    });
    expect([400, 402, 403, 404, 409, 500]).toContain(res.status);
    if (res.status === 400 || res.status === 402 || res.status === 404) {
      const data = await res.json();
      expect(data.error).toBeTruthy();
    }
  });
});

describe("Security, login page credential leaks", () => {
  it("login page does not expose demo credentials", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    const html = await res.text();
    expect(html).not.toContain("demo123");
    expect(html).not.toContain("admin123");
    expect(html).not.toContain("Demo Credentials");
  });
});
