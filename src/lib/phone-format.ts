/**
 * Format phone number for Australian numbers.
 * Converts 0412345678 to 61412345678.
 */
export function formatAustralianPhone(phone: string): string {
  let formatted = phone.replace(/\D/g, "");

  if (formatted.startsWith("0")) {
    formatted = "61" + formatted.substring(1);
  } else if (formatted.startsWith("4") && formatted.length === 9) {
    formatted = "61" + formatted;
  } else if (!formatted.startsWith("61") && formatted.length === 9) {
    formatted = "61" + formatted;
  }

  return formatted;
}

/** Format a phone number as E.164, for example +61412345678. */
export function formatE164(phone: string): string {
  const formatted = formatAustralianPhone(phone);
  return formatted.startsWith("+") ? formatted : `+${formatted}`;
}
