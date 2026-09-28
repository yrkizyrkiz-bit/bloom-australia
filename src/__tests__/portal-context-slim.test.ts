/**
 * Slim /api/portal/context must not touch BiomarkerResult or LabReport.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueUser,
  findManyEntitlement,
  findManyMemberSubscription,
  biomarkerGroupBy,
  labReportCount,
  getServerSession,
} = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
  findManyEntitlement: vi.fn(),
  findManyMemberSubscription: vi.fn(),
  biomarkerGroupBy: vi.fn(),
  labReportCount: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueUser },
    entitlement: { findMany: findManyEntitlement },
    memberSubscription: { findMany: findManyMemberSubscription },
    biomarkerResult: { groupBy: biomarkerGroupBy },
    labReport: { count: labReportCount },
  },
}));

vi.mock("@/lib/biomarkers/latest-results", () => ({
  getDistinctBiomarkerIdsForUser: vi.fn(async () => {
    throw new Error("slim context must not load biomarker IDs");
  }),
}));

describe("GET /api/portal/context (slim)", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    findManyEntitlement.mockReset();
    findManyMemberSubscription.mockReset();
    biomarkerGroupBy.mockReset();
    labReportCount.mockReset();
    getServerSession.mockReset();

    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueUser.mockResolvedValue({
      journeyStatus: "ACTIVE",
      approvalStatus: "APPROVED",
      passwordHash: "x",
      subscriptionTier: "hair_loss",
      memberStatus: "ACTIVE",
      gender: "male",
    });
    findManyEntitlement.mockResolvedValue([
      {
        type: "PROGRAM",
        key: "HAIR_LOSS",
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
      },
    ]);
    findManyMemberSubscription.mockResolvedValue([
      {
        status: "ACTIVE",
        product: {
          program: "HAIR_LOSS",
          slug: "hair-loss",
          name: "Hair",
          planTier: null,
        },
      },
    ]);
  });

  it("returns membership access without querying BiomarkerResult or LabReport", async () => {
    const { GET } = await import("@/app/api/portal/context/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.gender).toBe("male");
    expect(body.membership.programs.HAIR_LOSS.hasEntitlement).toBe(true);
    expect(body.membership.programs.HAIR_LOSS.state).toBe("ready");
    expect(findManyEntitlement).toHaveBeenCalled();
    expect(findManyMemberSubscription).toHaveBeenCalled();
    expect(biomarkerGroupBy).not.toHaveBeenCalled();
    expect(labReportCount).not.toHaveBeenCalled();
  });
});
