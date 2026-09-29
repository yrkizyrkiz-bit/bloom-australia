import {
  isEstablishedMember,
  phoneMatchCandidates,
  PHONE_IN_USE_MESSAGE,
} from "@/lib/auth/member-identity-guard";
import { prisma } from "@/lib/prisma";

/** Reject assigning a phone that already belongs to a different established member. */
export async function assertPhoneAvailableForAccount(
  phone: string | null | undefined,
  forUserId: string | null
): Promise<void> {
  const candidates = phoneMatchCandidates(phone);
  if (candidates.length === 0) return;

  const owner = await prisma.user.findFirst({
    where: {
      OR: candidates.map((value) => ({ phone: value })),
      ...(forUserId ? { id: { not: forUserId } } : {}),
    },
    select: {
      id: true,
      passwordHash: true,
      subscriptionStatus: true,
      journeyStatus: true,
      memberStatus: true,
    },
  });

  if (owner && isEstablishedMember(owner)) {
    throw new Error(PHONE_IN_USE_MESSAGE);
  }
}
