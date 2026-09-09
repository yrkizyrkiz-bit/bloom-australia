import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * On Netlify/Lambda, prefer a single connection per isolate so cold starts
 * don't exhaust the remote Postgres connection limit. Operators should still
 * point DATABASE_URL at a pooled endpoint (Neon/Supabase pooler) when available.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  const onServerless =
    process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!onServerless) return url;
  if (/[?&]connection_limit=/.test(url)) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=1`;
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
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
  "weightManagementPlan",
  "passkey",
] as const;

function hasCurrentPrismaSchema(client: PrismaClient): boolean {
  return REQUIRED_PRISMA_MODELS.every((model) => modelDelegateReady(client, model));
}

// Reuse one client across warm serverless invokes (and Next hot reload).
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
globalForPrisma.prisma = prisma;

export default prisma;
