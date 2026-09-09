export function webauthnRelyingParty(requestUrl?: string) {
  const raw = process.env.NEXTAUTH_URL || requestUrl || "http://localhost:3000";
  const url = new URL(raw);
  return {
    rpName: "Sanative",
    rpID: url.hostname,
    origin: url.origin,
  };
}
