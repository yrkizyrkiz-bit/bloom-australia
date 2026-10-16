/**
 * Addresses we must never send to. `sanative.com` has no mail server —
 * it is a typo of sanative.com.au and Gmail bounce-loops forever.
 */
const UNDELIVERABLE_DOMAINS = new Set(["sanative.com"]);

export function outboundEmailDomain(email: string): string {
  return email.toLowerCase().trim().split("@")[1] || "";
}

export function isUndeliverableOutboundEmail(email: string | null | undefined): boolean {
  const value = (email || "").trim();
  if (!value || !value.includes("@")) return true;
  const domain = outboundEmailDomain(value);
  if (!domain) return true;
  return UNDELIVERABLE_DOMAINS.has(domain);
}
