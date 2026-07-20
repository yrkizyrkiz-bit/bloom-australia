import { prisma } from "@/lib/prisma";
import type { RateLimitConfig, RateLimitResult } from "@/lib/security/rate-limit-config";

export type { RateLimitResult };

export async function consumeRateLimit(
  bucketKey: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSec * 1000);

  const existing = await prisma.rateLimitBucket.findUnique({
    where: { bucketKey },
    select: { hits: true, resetAt: true },
  });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { bucketKey },
      create: { bucketKey, hits: 1, resetAt },
      update: { hits: 1, resetAt },
    });
    return { allowed: true };
  }

  if (existing.hits >= config.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
      ),
    };
  }

  await prisma.rateLimitBucket.update({
    where: { bucketKey },
    data: { hits: { increment: 1 } },
  });

  return { allowed: true };
}
