export const AU_STATE_ABBREVIATIONS: Record<string, string> = {
  "New South Wales": "NSW",
  NSW: "NSW",
  Victoria: "VIC",
  VIC: "VIC",
  Queensland: "QLD",
  QLD: "QLD",
  "Western Australia": "WA",
  WA: "WA",
  "South Australia": "SA",
  SA: "SA",
  Tasmania: "TAS",
  TAS: "TAS",
  "Australian Capital Territory": "ACT",
  ACT: "ACT",
  "Northern Territory": "NT",
  NT: "NT",
};

const VALID_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

export function toAuStateAbbreviation(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (VALID_STATES.has(trimmed.toUpperCase())) return trimmed.toUpperCase();
  return AU_STATE_ABBREVIATIONS[trimmed] || "";
}
