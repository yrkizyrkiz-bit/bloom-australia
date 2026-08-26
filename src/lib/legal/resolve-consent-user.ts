import { prisma } from "@/lib/prisma";

/** Resolve a safe userId for consent, never pass a stale/invalid client id to the DB. */
export async function resolveConsentUserId(input: {
  userId?: string;
  email?: string;
}): Promise<string | undefined> {
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const userByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (userByEmail) {
      return userByEmail.id;
    }
  }

  const clientUserId = input.userId?.trim();
  if (!clientUserId || clientUserId === "undefined" || clientUserId === "null") {
    return undefined;
  }

  const user = await prisma.user.findUnique({
    where: { id: clientUserId },
    select: { id: true },
  });

  return user?.id;
}
