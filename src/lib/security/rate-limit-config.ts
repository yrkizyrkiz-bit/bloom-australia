export type RateLimitConfig = {
  limit: number;
  windowSec: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

export const RATE_LIMITS = {
  /** NextAuth credentials + magic login */
  authLoginIp: { limit: 10, windowSec: 15 * 60 },
  /** OTP / verification sends per contact */
  sendVerificationContact: { limit: 3, windowSec: 60 * 60 },
  /** OTP / verification sends per IP */
  sendVerificationIp: { limit: 20, windowSec: 60 * 60 },
  /** Code guess attempts per IP */
  verifyCodeIp: { limit: 15, windowSec: 60 },
  /** Password reset per email */
  forgotPasswordEmail: { limit: 3, windowSec: 60 * 60 },
  /** Password reset per IP */
  forgotPasswordIp: { limit: 10, windowSec: 60 * 60 },
  /** Email existence probe */
  checkEmailIp: { limit: 30, windowSec: 60 * 60 },
  /** Checkout / payment intent creation per IP */
  checkoutIp: { limit: 20, windowSec: 60 * 60 },
} as const satisfies Record<string, RateLimitConfig>;

export function rateLimitBucketKey(scope: string, identifier: string): string {
  return `${scope}:${identifier.toLowerCase().trim()}`;
}
