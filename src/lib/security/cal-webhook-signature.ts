import { createHmac, timingSafeEqual } from "crypto";

/**
 * Cal.com signs the raw body with HMAC-SHA256 using the webhook secret and
 * sends the hex digest in `x-cal-signature-256` (with or without a `sha256=`
 * prefix). Unsigned requests are rejected; without a configured secret every
 * request is rejected, so the endpoint fails closed rather than open.
 */
export function isValidCalSignature(
  body: string,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signatureHeader) return false;
  const provided = signatureHeader.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(provided)) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
}
