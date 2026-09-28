import { describe, it, expect } from "vitest";
import { resolveInsightDisplayState } from "@/lib/membership/insight-display";
import type { ScopeEntitlementView } from "@/lib/membership/entitlements";

function scope(
  overrides: Partial<ScopeEntitlementView> & Pick<ScopeEntitlementView, "state">
): ScopeEntitlementView {
  return {
    key: "HEALTH_SCORE",
    label: "Health Score",
    hasEntitlement: true,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("resolveInsightDisplayState", () => {
  it("shows pending test results when entitled but labs are not uploaded yet", () => {
    expect(
      resolveInsightDisplayState(scope({ state: "partial" }), false, {
        noResultsYet: true,
      })
    ).toBe("pending_results");
    expect(
      resolveInsightDisplayState(scope({ state: "pending_results" }), false)
    ).toBe("pending_results");
  });

  it("keeps locked upgrade when the member is not entitled", () => {
    expect(
      resolveInsightDisplayState(
        scope({ state: "locked_upgrade", hasEntitlement: false }),
        false,
        { noResultsYet: true }
      )
    ).toBe("locked_upgrade");
  });

  it("returns null when score data is ready to display", () => {
    expect(resolveInsightDisplayState(scope({ state: "ready" }), true)).toBeNull();
  });
});
