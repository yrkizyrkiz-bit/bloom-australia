import { describe, expect, it } from "vitest";
import { isWeightManagementApproved } from "@/lib/weight-management/ring-approval";

describe("isWeightManagementApproved", () => {
  it("keeps new accounts locked until a doctor approves", () => {
    expect(isWeightManagementApproved("LEAD")).toBe(false);
    expect(isWeightManagementApproved("IN_TRIAGE")).toBe(false);
    expect(isWeightManagementApproved("CONSULT_SCHEDULED")).toBe(false);
    expect(isWeightManagementApproved(null, null)).toBe(false);
  });

  it("unlocks after approval or an approved journey stage", () => {
    expect(isWeightManagementApproved("APPROVED")).toBe(true);
    expect(isWeightManagementApproved("ACTIVE")).toBe(true);
    expect(isWeightManagementApproved("IN_TRIAGE", "APPROVED")).toBe(true);
    expect(isWeightManagementApproved("LEAD", "APPROVED_WITH_TESTS")).toBe(true);
  });
});
