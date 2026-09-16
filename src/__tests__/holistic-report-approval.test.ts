import { describe, expect, it } from "vitest";
import {
  holisticReportShowsPendingOverlay,
  normalizeHolisticApprovalStatus,
} from "@/lib/holistic-health-report-types";

describe("holistic report approval overlay", () => {
  it("treats missing status as pending overlay", () => {
    expect(normalizeHolisticApprovalStatus(undefined)).toBe("pending_approval");
    expect(holisticReportShowsPendingOverlay({})).toBe(true);
  });

  it("hides overlay after doctor approval", () => {
    expect(holisticReportShowsPendingOverlay({ approvalStatus: "approved" })).toBe(false);
  });

  it("keeps overlay when held", () => {
    expect(holisticReportShowsPendingOverlay({ approvalStatus: "held" })).toBe(true);
  });
});
