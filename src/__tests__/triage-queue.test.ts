import { describe, expect, it } from "vitest";
import {
  CLINICAL_PROGRAM_TIERS,
  triageQueueWhere,
  triageStatsWhere,
} from "@/lib/admin/triage-queue";

describe("triageQueueWhere", () => {
  it("keeps In Triage limited to clinical program tiers", () => {
    expect(triageQueueWhere("PRE_TRIAGE_PENDING")).toEqual({
      subscriptionTier: { in: CLINICAL_PROGRAM_TIERS },
      journeyStatus: { in: ["PRE_TRIAGE_PENDING"] },
    });
  });

  it("shows membership Pre-Triage handoffs on Awaiting Doctor", () => {
    const where = triageQueueWhere("AWAITING_DOCTOR_DECISION");
    expect(where).toEqual({
      journeyStatus: { in: ["AWAITING_DOCTOR_DECISION", "PRE_TRIAGE_COMPLETE"] },
    });
    expect(where).not.toHaveProperty("subscriptionTier");
  });
});

describe("triageStatsWhere", () => {
  it("counts awaiting doctor without requiring a clinical subscription tier", () => {
    const where = triageStatsWhere() as {
      OR: Array<{ journeyStatus?: { in: string[] }; subscriptionTier?: unknown }>;
    };
    expect(where.OR.some((clause) => !clause.subscriptionTier)).toBe(true);
    expect(
      where.OR.some(
        (clause) =>
          clause.journeyStatus?.in.includes("AWAITING_DOCTOR_DECISION") &&
          !clause.subscriptionTier
      )
    ).toBe(true);
  });
});
