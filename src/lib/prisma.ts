import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function modelDelegateReady(client: PrismaClient, model: string): boolean {
  const delegate = (client as unknown as Record<string, unknown>)[model];
  return (
    typeof delegate === "object" &&
    delegate !== null &&
    typeof (delegate as { findFirst?: unknown }).findFirst === "function"
  );
}

const REQUIRED_PRISMA_MODELS = [
  "product",
  "billingPrice",
  "memberSubscription",
  "entitlement",
] as const;

function hasCurrentPrismaSchema(client: PrismaClient): boolean {
  return REQUIRED_PRISMA_MODELS.every((model) => modelDelegateReady(client, model));
}

// Recreate client in dev when schema changes (hot reload keeps stale global singleton)
let client = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production" && !hasCurrentPrismaSchema(client)) {
  void client.$disconnect().catch(() => {});
  client = createPrismaClient();
  if (!hasCurrentPrismaSchema(client)) {
    console.warn(
      "[prisma] Client missing billing/entitlement models, run `bun run db:generate` and restart the dev server"
    );
  }
}

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
