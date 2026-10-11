import { prisma } from "@/lib/prisma";
import {
  memberCareSupportInboxUrl,
  type CareInboxOptions,
} from "@/lib/care-support/member-inbox-path";

export { memberCareSupportInboxUrl, type CareInboxOptions };

/** Resolve inbox URL from DB entitlements (preferred for notifications / push). */
export async function resolveMemberCareSupportInboxUrl(
  userId: string,
  options?: CareInboxOptions
): Promise<string> {
  const [user, entitlements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, subscriptionTier: true },
    }),
    prisma.entitlement.findMany({
      where: {
        userId,
        type: "PROGRAM",
        status: { in: ["ACTIVE", "PENDING"] },
      },
      select: { key: true },
      take: 20,
    }),
  ]);

  return memberCareSupportInboxUrl(
    {
      gender: user?.gender,
      subscriptionTier: user?.subscriptionTier,
      programKeys: entitlements.map((e) => e.key),
    },
    options
  );
}
