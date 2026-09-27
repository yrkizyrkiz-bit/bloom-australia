import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllEntitlements } from "@/lib/membership/entitlement-service";
import type { EntitlementRecord } from "@/lib/membership/entitlements";
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
} from "@/lib/membership/subscription-access";
import {
  getPrimaryEnrolledProgramKey,
  MEMBER_PROGRAMS_HOME,
  resolveProgramDashboardRoute,
} from "@/lib/portal/member-home";

/**
 * Men's Health entry — route to the member's primary enrolled program.
 * Never default Hair for Sexual Health members.
 */
export default async function MensHealthHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?redirect=/dashboard/mens-health");
  }

  const userId = session.user.id;
  const [entitlements, memberSubscriptions] = await Promise.all([
    getAllEntitlements(userId),
    prisma.memberSubscription.findMany({
      where: { userId },
      select: {
        status: true,
        product: { select: { program: true, slug: true, name: true, planTier: true } },
      },
    }),
  ]);

  const merged = mergeSubscriptionSignalsIntoEntitlements(
    entitlements.map(
      (e): EntitlementRecord => ({ type: e.type, key: e.key, status: e.status })
    ),
    memberSubscriptions
  );
  const membership = deriveAccessMembership(merged, memberSubscriptions);
  const primary = getPrimaryEnrolledProgramKey(membership);
  if (primary === "HAIR_LOSS") {
    redirect("/dashboard/mens-health/hair-loss");
  }
  if (primary === "MENS_HEALTH_SEXUAL") {
    redirect("/dashboard/mens-health/sexual-health");
  }
  if (primary === "MENS_HEALTH_VITALITY") {
    redirect("/dashboard/mens-health/vitality");
  }
  if (primary) {
    redirect(resolveProgramDashboardRoute(primary));
  }

  redirect(MEMBER_PROGRAMS_HOME);
}
