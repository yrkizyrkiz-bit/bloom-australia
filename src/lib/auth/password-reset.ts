import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resolveStaffPortalHome } from "@/lib/portal/staff-home";

/**
 * Self-service password reset.
 *
 * Tokens live in the existing VerificationCode table under a dedicated type so
 * no schema change is needed: `contact` is the account email, `code` is the
 * SHA-256 of the token that was emailed, `verified` marks a token as spent.
 * Only the hash is stored; the plain token exists in the email and nowhere else.
 */
export const PASSWORD_RESET_TYPE = "password_reset";
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_MIN_LENGTH = 8;

export type ResetAccount =
  | { kind: "user"; id: string; email: string; firstName: string | null; role: string | null }
  | { kind: "clinic"; id: string; email: string; firstName: string | null; role: "GP" };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normaliseResetEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Members and staff live in User; GP clinics sign in with the clinic's lead GP
 * email. Both can reset through the same form.
 */
export async function findResetAccount(email: string): Promise<ResetAccount | null> {
  const normalised = normaliseResetEmail(email);

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalised, mode: "insensitive" } },
    select: { id: true, email: true, firstName: true, role: true },
  });
  if (user) {
    return {
      kind: "user",
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    };
  }

  const clinic = await prisma.clinic.findFirst({
    where: { leadGpEmail: { equals: normalised, mode: "insensitive" }, status: "ACTIVE" },
    select: { id: true, leadGpEmail: true, leadGpName: true },
  });
  if (clinic) {
    return {
      kind: "clinic",
      id: clinic.id,
      email: clinic.leadGpEmail,
      firstName: clinic.leadGpName?.split(" ")[0] || null,
      role: "GP",
    };
  }

  return null;
}

/** Issue a fresh single-use token for the account, replacing any outstanding one. */
export async function createPasswordResetToken(email: string): Promise<string> {
  const contact = normaliseResetEmail(email);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.verificationCode.upsert({
    where: { contact_type: { contact, type: PASSWORD_RESET_TYPE } },
    update: { code: hashToken(token), expiresAt, attempts: 0, verified: false },
    create: { contact, type: PASSWORD_RESET_TYPE, code: hashToken(token), expiresAt },
  });

  return token;
}

type StoredResetToken = { id: string; contact: string };

/** Look up a live, unspent token. Does not consume it. */
export async function peekPasswordResetToken(
  token: string | null | undefined
): Promise<StoredResetToken | null> {
  if (!token || typeof token !== "string" || !/^[0-9a-f]{64}$/i.test(token)) return null;

  const record = await prisma.verificationCode.findFirst({
    where: {
      type: PASSWORD_RESET_TYPE,
      code: hashToken(token),
      verified: false,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, contact: true },
  });

  return record;
}

/**
 * Atomically mark a token as spent. Returns false if another request already
 * consumed it, so two submissions of the same link can't both succeed.
 */
async function consumePasswordResetToken(id: string): Promise<boolean> {
  const result = await prisma.verificationCode.updateMany({
    where: { id, verified: false, expiresAt: { gt: new Date() } },
    data: { verified: true, expiresAt: new Date() },
  });
  return result.count === 1;
}

export type ResetPasswordOutcome =
  | { ok: true; email: string; redirectTo: string }
  | { ok: false; error: string; status: number };

export async function resetPasswordWithToken(
  token: string | null | undefined,
  password: string | null | undefined
): Promise<ResetPasswordOutcome> {
  if (!password || typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      status: 400,
    };
  }

  const stored = await peekPasswordResetToken(token);
  if (!stored) {
    return { ok: false, error: "This reset link is invalid or has expired.", status: 400 };
  }

  const account = await findResetAccount(stored.contact);
  if (!account) {
    await consumePasswordResetToken(stored.id);
    return { ok: false, error: "This reset link is invalid or has expired.", status: 400 };
  }

  if (!(await consumePasswordResetToken(stored.id))) {
    return { ok: false, error: "This reset link has already been used.", status: 400 };
  }

  const passwordHash = await hashPassword(password);

  if (account.kind === "user") {
    await prisma.user.update({
      where: { id: account.id },
      data: { password: passwordHash, passwordHash },
    });
    await prisma.activityLog
      .create({
        data: {
          userId: account.id,
          action: "PASSWORD_RESET_COMPLETED",
          entity: "user",
          entityId: account.id,
          details: { email: account.email, completedAt: new Date().toISOString() },
        },
      })
      .catch((error) => console.error("[password-reset] activity log failed:", error));

    return { ok: true, email: account.email, redirectTo: resolveStaffPortalHome(account.role ?? undefined) };
  }

  await prisma.clinic.update({
    where: { id: account.id },
    data: { passwordHash },
  });
  await prisma.activityLog
    .create({
      data: {
        action: "PASSWORD_RESET_COMPLETED",
        entity: "clinic",
        entityId: account.id,
        details: { email: account.email, completedAt: new Date().toISOString() },
      },
    })
    .catch((error) => console.error("[password-reset] activity log failed:", error));

  return { ok: true, email: account.email, redirectTo: "/gp/dashboard" };
}
