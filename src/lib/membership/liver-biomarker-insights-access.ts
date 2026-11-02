import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";

/** Product-specific entitlement — not ORGAN_CARE (that is also granted to $365 members). */
export const LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY = "LIVER_BIOMARKER_INSIGHTS";

export type LiverBiomarkerInsightsAccessInput = {
  subscriptionTier?: string | null;
  entitlements?: Array<{
    type?: string | null;
    key?: string | null;
    status?: string | null;
    expiresAt?: Date | string | null;
  }>;
  memberSubscriptions?: Array<{
    status?: string | null;
    currentPeriodEnd?: Date | string | null;
    product?: {
      slug?: string | null;
      program?: string | null;
    } | null;
  }>;
};

function isActiveStatus(status?: string | null): boolean {
  const s = (status || "").toUpperCase();
  return s === "ACTIVE" || s === "PAST_DUE" || s === "TRIAL";
}

function isUnexpired(expiresAt?: Date | string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  const end = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return true;
  return end.getTime() > now.getTime();
}

function isLiverProductRow(product?: { slug?: string | null; program?: string | null } | null): boolean {
  const slug = (product?.slug || "").toLowerCase();
  const program = (product?.program || "").toUpperCase();
  return (
    slug === LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG ||
    program === LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY
  );
}

/**
 * True only when the member bought Liver Biomarker Insights ($79 / 2 months).
 * $365 Sanative Membership (ORGAN_CARE / MEMBERSHIP) does not qualify.
 */
export function hasLiverBiomarkerInsightsAccess(
  input: LiverBiomarkerInsightsAccessInput,
  now: Date = new Date()
): boolean {
  const hasDedicatedEntitlement = (input.entitlements || []).some(
    (row) =>
      (row.type || "SCOPE") === "SCOPE" &&
      row.key === LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY &&
      isActiveStatus(row.status) &&
      isUnexpired(row.expiresAt, now)
  );
  if (hasDedicatedEntitlement) return true;

  const liverSubs = (input.memberSubscriptions || []).filter((sub) =>
    isLiverProductRow(sub.product)
  );
  if (liverSubs.some((sub) => isActiveStatus(sub.status) && isUnexpired(sub.currentPeriodEnd, now))) {
    return true;
  }
  // Catalog-less activation still stamps the product tier; ignore it once a
  // liver subscription row exists and has lapsed.
  if (liverSubs.length > 0) return false;

  return (input.subscriptionTier || "").toLowerCase() === LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG;
}
