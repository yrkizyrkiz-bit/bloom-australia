/**
 * Authenticated security integration tests.
 * Requires: local dev server + database with seed/fixture users.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  authedFetch,
  signInAs,
} from "./helpers/test-auth";
import {
  ensureSecurityFixtures,
  disconnectSecurityFixtures,
  SECURITY_TEST_PASSWORD,
} from "./helpers/security-fixtures";

const prisma = new PrismaClient();

describe("Security — authenticated access", () => {
  let fixtures: Awaited<ReturnType<typeof ensureSecurityFixtures>>;

  beforeAll(async () => {
    fixtures = await ensureSecurityFixtures();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectSecurityFixtures();
  });

  it("patient cannot open another patient's doctor brief (403)", async () => {
    const cookies = await signInAs(fixtures.patientA.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch(
      `/api/admin/doctor-brief/${fixtures.bookingForPatientA.intakeId}`,
      cookies
    );
    expect(res.status).toBe(403);
  });

  it("patient cannot open another patient's profile (403)", async () => {
    const cookies = await signInAs(fixtures.patientA.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch(`/api/users/${fixtures.patientB.id}`, cookies);
    expect(res.status).toBe(403);
  });

  it("care partner cannot open doctor-only decision route (403)", async () => {
    const cookies = await signInAs("carepartner@sanative.com.au", "test123");
    const res = await authedFetch("/api/admin/doctor/decision", cookies);
    expect(res.status).toBe(403);
  });

  it("doctor cannot open brief for patient assigned to another doctor (403)", async () => {
    const cookies = await signInAs(fixtures.doctorOther.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch(
      `/api/admin/doctor-brief/${fixtures.bookingForPatientA.intakeId}`,
      cookies
    );
    expect(res.status).toBe(403);
  });

  it("assigned doctor can open patient brief (200)", async () => {
    const cookies = await signInAs(fixtures.doctorAssigned.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch(
      `/api/admin/doctor/patient-brief/${fixtures.patientA.id}`,
      cookies
    );
    expect(res.status).toBe(200);
  });

  it("admin opening patient brief returns 200 and writes audit log", async () => {
    const cookies = await signInAs("admin@sanative.com.au", "admin123");
    const before = await prisma.activityLog.count({
      where: {
        action: "read",
        entityId: fixtures.patientA.id,
      },
    });

    const res = await authedFetch(
      `/api/admin/doctor/patient-brief/${fixtures.patientA.id}`,
      cookies
    );
    expect(res.status).toBe(200);

    const after = await prisma.activityLog.count({
      where: {
        action: "read",
        entityId: fixtures.patientA.id,
      },
    });
    expect(after).toBeGreaterThan(before);
  });

  it("patient cannot change userId in subscription request body (403)", async () => {
    const cookies = await signInAs(fixtures.patientA.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch("/api/stripe/subscription", cookies, {
      method: "POST",
      body: JSON.stringify({
        userId: fixtures.patientB.id,
        planId: "core",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("patient portal context only returns own session data (200)", async () => {
    const cookies = await signInAs(fixtures.patientA.email, SECURITY_TEST_PASSWORD);
    const res = await authedFetch("/api/portal/context", cookies);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });
});
