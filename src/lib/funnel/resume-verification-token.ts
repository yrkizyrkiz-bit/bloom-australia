import { verify } from "jsonwebtoken";
import { getAuthJwtSecret } from "@/lib/security/jwt-secret";

export type ResumeVerificationClaims = {
  contact: string;
  type: string;
  verified: boolean;
  userId: string | null;
  exp?: number;
};

export function verifyResumeVerificationToken(
  token: string,
  email: string
): { valid: true; userId: string | null } | { valid: false } {
  try {
    const payload = verify(token, getAuthJwtSecret()) as ResumeVerificationClaims;
    if (payload.type !== "email" || !payload.verified) {
      return { valid: false };
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (payload.contact?.toLowerCase().trim() !== normalizedEmail) {
      return { valid: false };
    }
    return { valid: true, userId: payload.userId ?? null };
  } catch {
    return { valid: false };
  }
}
