import { prisma } from "@/lib/prisma";

type InboxOptions = {
  threadId?: string | null;
  /** Opens the live-chat panel on the Care Team page. */
  openChat?: boolean;
};

function withInboxQuery(base: string, options?: InboxOptions): string {
  const params = new URLSearchParams();
  if (options?.threadId) params.set("thread", options.threadId);
  if (options?.openChat) params.set("chat", "1");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Map membership signals → Care Team inbox path.
 * Weight is checked before gender so female weight members are not sent to
 * women's care (which redirects them to /dashboard/programs).
 */
export function memberCareSupportInboxUrl(
  user: {
    gender?: string | null;
    subscriptionTier?: string | null;
    /** Active PROGRAM entitlement keys, e.g. WEIGHT_MANAGEMENT, HAIR_LOSS */
    programKeys?: string[] | null;
  },
  options?: InboxOptions
): string {
  const tier = (user.subscriptionTier || "").toLowerCase();
  const gender = (user.gender || "").toLowerCase();
  const keys = (user.programKeys || []).map((k) => k.toUpperCase());

  const has = (key: string) => keys.includes(key);
  const hasAny = (...list: string[]) => list.some((k) => has(k));

  let base = "/dashboard/mens-health/support";

  if (has("WEIGHT_MANAGEMENT") || tier.includes("weight")) {
    base = "/dashboard/weight-management/support";
  } else if (
    hasAny("WOMENS_HEALTH_SEXUAL", "WOMENS_HEALTH_VITALITY") ||
    tier.includes("women")
  ) {
    base = "/dashboard/womens-health/care";
  } else if (
    hasAny("MENS_HEALTH_SEXUAL", "HAIR_LOSS", "MENS_HEALTH_VITALITY") ||
    tier.includes("mens") ||
    tier.includes("hair") ||
    gender === "male"
  ) {
    base = "/dashboard/mens-health/support";
  } else if (gender === "female") {
    base = "/dashboard/womens-health/care";
  }

  return withInboxQuery(base, options);
}

/** Resolve inbox URL from DB entitlements (preferred for notifications / push). */
export async function resolveMemberCareSupportInboxUrl(
  userId: string,
  options?: InboxOptions
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
