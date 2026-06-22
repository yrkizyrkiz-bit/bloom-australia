import type { EntitlementState } from "@/lib/membership/biomarker-readiness";
import type { ScopeEntitlementView } from "@/lib/membership/entitlements";

/**
 * When to show a portal insight state instead of a numeric score on biomarker cards.
 * Returns null when the card should render its normal score UI.
 */
export function resolveInsightDisplayState(
  scope: ScopeEntitlementView | undefined,
  hasScoreData: boolean,
  options?: { noResultsYet?: boolean }
): EntitlementState | null {
  if (!scope) return null;

  if (!scope.hasEntitlement || scope.state === "locked_upgrade") {
    return "locked_upgrade";
  }

  if (scope.state === "inactive") {
    return "inactive";
  }

  if (!hasScoreData) {
    if (scope.state === "pending_results" || options?.noResultsYet) {
      return "pending_results";
    }
    if (scope.state === "partial") {
      return "partial";
    }
  }

  return null;
}
