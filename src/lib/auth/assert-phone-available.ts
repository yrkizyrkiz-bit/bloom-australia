import {
  isEstablishedMember,
  phoneMatchCandidates,
  PHONE_IN_USE_MESSAGE,
} from "@/lib/auth/member-identity-guard";
import { prisma } from "@/lib/prisma";

export type EstablishedPhoneOwner = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

/** Find another established member already using this mobile (if any). */
export async function findEstablishedPhoneOwner(
  phone: string | null | undefined,
  forUserId: string | null
): Promise<EstablishedPhoneOwner | null> {
  const candidates = phoneMatchCandidates(phone);
  if (candidates.length === 0) return null;

  const owner = await prisma.user.findFirst({
    where: {
      OR: candidates.map((value) => ({ phone: value })),
      ...(forUserId ? { id: { not: forUserId } } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      subscriptionStatus: true,
      journeyStatus: true,
      memberStatus: true,
    },
  });

  if (!owner || !isEstablishedMember(owner)) return null;

  return {
    id: owner.id,
    email: owner.email,
    firstName: owner.firstName,
    lastName: owner.lastName,
  };
}

/**
 * Reject assigning a phone that already belongs to a different established member.
 * Prefer not using this on paid checkout paths — accept the number and flag triage instead.
 */
export async function assertPhoneAvailableForAccount(
  phone: string | null | undefined,
  forUserId: string | null
): Promise<void> {
  const owner = await findEstablishedPhoneOwner(phone, forUserId);
  if (owner) {
    throw new Error(PHONE_IN_USE_MESSAGE);
  }
}
