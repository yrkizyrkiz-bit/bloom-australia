/**
 * Australian patient timezone resolution and display helpers.
 * Clinic roster / doctor availability remains on Australia/Sydney (see sydney-time.ts).
 */

export const CLINIC_TIMEZONE = "Australia/Sydney";

const STATE_TIMEZONE: Record<string, string> = {
  NSW: CLINIC_TIMEZONE,
  ACT: CLINIC_TIMEZONE,
  VIC: CLINIC_TIMEZONE,
  TAS: CLINIC_TIMEZONE,
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  NT: "Australia/Darwin",
  WA: "Australia/Perth",
};

const STATE_ALIASES: Record<string, string> = {
  "NEW SOUTH WALES": "NSW",
  "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  VICTORIA: "VIC",
  TASMANIA: "TAS",
  QUEENSLAND: "QLD",
  "SOUTH AUSTRALIA": "SA",
  "NORTHERN TERRITORY": "NT",
  "WESTERN AUSTRALIA": "WA",
};

/** Normalise state input to abbreviation (NSW, QLD, …) */
export function normalizeAustralianState(state?: string | null): string | null {
  if (!state?.trim()) return null;
  const upper = state.trim().toUpperCase();
  if (STATE_TIMEZONE[upper]) return upper;
  return STATE_ALIASES[upper] ?? null;
}

/**
 * Resolve IANA timezone from Australian state + postcode.
 * Broken Hill (NSW 288x) uses Adelaide time — handled via postcode override.
 */
export function resolveAustralianTimezone(
  state?: string | null,
  postcode?: string | null
): string {
  const normalized = normalizeAustralianState(state);
  const pc = postcode?.trim() ?? "";

  if (normalized === "NSW" && /^288[0-9]/.test(pc)) {
    return "Australia/Adelaide";
  }

  if (normalized && STATE_TIMEZONE[normalized]) {
    return STATE_TIMEZONE[normalized];
  }

  return CLINIC_TIMEZONE;
}

export function getDateKeyInTimezone(date: Date | string, timeZone: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA", { timeZone });
}

export function getHourInTimezone(isoString: string, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
  return parseInt(hour, 10) % 24;
}

export function formatInTimezone(
  date: Date | string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", { timeZone, ...options });
}

export function formatTimeInTimezone(
  date: Date | string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
    ...options,
  });
}

export function formatDateInTimezone(
  date: Date | string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", { timeZone, ...options });
}

/** Human label e.g. "Australian Eastern Daylight Time" */
export function getTimezoneDisplayName(timeZone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/** Short label e.g. "AEDT" */
export function getTimezoneAbbreviation(timeZone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** City-style label for UI, e.g. "Brisbane" from Australia/Brisbane */
export function getTimezoneCityLabel(timeZone: string): string {
  const city = timeZone.split("/")[1]?.replace(/_/g, " ");
  if (!city) return "local";
  if (city === "Sydney") return "Sydney (clinic)";
  return city;
}

export function isSameTimezone(a: string, b: string): boolean {
  return a === b;
}
