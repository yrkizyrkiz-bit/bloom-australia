import prisma from "@/lib/prisma";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function storeWebAuthnChallenge(input: {
  type: "register" | "login";
  challenge: string;
  userId?: string | null;
  email?: string | null;
}) {
  await prisma.webAuthnChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return prisma.webAuthnChallenge.create({
    data: {
      type: input.type,
      challenge: input.challenge,
      userId: input.userId || null,
      email: input.email?.toLowerCase() || null,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });
}

export async function consumeWebAuthnChallengeById(id: string, type: "register" | "login") {
  const row = await prisma.webAuthnChallenge.findFirst({
    where: { id, type, expiresAt: { gt: new Date() } },
  });
  if (!row) return null;
  await prisma.webAuthnChallenge.delete({ where: { id: row.id } });
  return row;
}

export const WEBAUTHN_CHALLENGE_COOKIE = "sanative_webauthn_challenge";
