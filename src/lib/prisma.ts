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

function hasCurrentBillingModels(client: PrismaClient): boolean {
  return (
    modelDelegateReady(client, "product") &&
    modelDelegateReady(client, "memberSubscription") &&
    modelDelegateReady(client, "billingPrice")
  );
}

// Recreate client in dev when schema changes (hot reload keeps stale global singleton)
let client = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production" && !hasCurrentBillingModels(client)) {
  void client.$disconnect().catch(() => {});
  client = createPrismaClient();
}

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
