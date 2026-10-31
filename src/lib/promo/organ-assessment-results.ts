export type OrganResultTier = "low" | "moderate" | "high";
export type OrganAssessmentKind = "liver" | "heart" | "kidney";

export type OrganDriver = {
  id: string;
  title: string;
  body: string;
  points: number;
};

export type OrganAssessmentUiCopy = {
  organ: OrganAssessmentKind;
  headlines: Record<OrganResultTier, string>;
  markers: readonly string[];
  disclaimer: string;
  ctaLabel: string;
  checkoutSource: string;
  checkoutButton: string;
  consentOrgan: string;
  apiPath: string;
  leadContentName: string;
};

export function isOrganResultTier(value: unknown): value is OrganResultTier {
  return value === "low" || value === "moderate" || value === "high";
}

export function sanitizeAssessmentFirstName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > 80) return null;
  if (/[<>]/.test(name)) return null;
  return name;
}

export function sanitizeOrganDrivers(value: unknown, allowedTitles: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(allowedTitles);
  return value
    .filter((item): item is string => typeof item === "string" && allowed.has(item))
    .slice(0, 3);
}

export function pickTopDrivers(candidates: OrganDriver[], limit = 3): OrganDriver[] {
  return [...candidates]
    .sort((a, b) => b.points - a.points || a.title.localeCompare(b.title))
    .slice(0, limit);
}
