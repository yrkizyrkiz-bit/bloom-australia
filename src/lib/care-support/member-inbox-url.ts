/** Deep-link for member care-support inbox notifications. */
export function memberCareSupportInboxUrl(user: {
  gender?: string | null;
  subscriptionTier?: string | null;
}): string {
  const tier = (user.subscriptionTier || "").toLowerCase();
  const gender = (user.gender || "").toLowerCase();

  if (tier.includes("women") || gender === "female") {
    return "/dashboard/womens-health/care";
  }
  if (tier.includes("weight")) {
    return "/dashboard/weight-management/support";
  }
  return "/dashboard/mens-health/support";
}
