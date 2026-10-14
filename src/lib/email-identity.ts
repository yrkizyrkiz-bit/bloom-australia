import { prisma } from "@/lib/prisma";
import {
  EMAIL_PROCESS_KEYS,
  EMAIL_PROCESS_META,
  type EmailProcessKey,
} from "@/lib/email-process";

export type EmailIdentity = {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  enabled: boolean;
};

const CACHE_MS = 60_000;
let cache:
  | {
      at: number;
      defaults: { fromEmail: string; fromName: string; replyTo?: string };
      byProcess: Record<string, EmailIdentity>;
    }
  | null = null;

function envDefaults() {
  const fromEmail = process.env.EMAIL_FROM || "noreply@sanative.com.au";
  const fromName = process.env.EMAIL_FROM_NAME || "Sanative";
  return { fromEmail, fromName };
}

export function invalidateEmailIdentityCache() {
  cache = null;
}

export async function ensureEmailProcessConfigs(): Promise<void> {
  const existing = await prisma.emailProcessConfig.findMany({
    select: { processKey: true },
  });
  const have = new Set(existing.map((row) => row.processKey));
  for (const key of EMAIL_PROCESS_KEYS) {
    if (have.has(key)) continue;
    const meta = EMAIL_PROCESS_META[key];
    await prisma.emailProcessConfig.create({
      data: {
        processKey: key,
        label: meta.label,
        enabled: true,
        sortOrder: meta.sortOrder,
      },
    });
  }
  await prisma.emailSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

async function loadIdentityCache() {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache;

  await ensureEmailProcessConfigs().catch(() => undefined);

  const env = envDefaults();
  const settings = await prisma.emailSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  const processes = await prisma.emailProcessConfig.findMany().catch(() => []);

  const defaults = {
    fromEmail: settings?.defaultFromEmail || env.fromEmail,
    fromName: settings?.defaultFromName || env.fromName,
    replyTo: settings?.defaultReplyTo || undefined,
  };

  const byProcess: Record<string, EmailIdentity> = {};
  for (const row of processes) {
    byProcess[row.processKey] = {
      fromEmail: row.fromEmail || defaults.fromEmail,
      fromName: row.fromName || defaults.fromName,
      replyTo: row.replyTo || defaults.replyTo,
      enabled: row.enabled,
    };
  }

  cache = { at: now, defaults, byProcess };
  return cache;
}

export async function resolveEmailIdentity(
  process?: EmailProcessKey
): Promise<EmailIdentity> {
  try {
    const loaded = await loadIdentityCache();
    if (process && loaded.byProcess[process]) {
      return loaded.byProcess[process];
    }
    return { ...loaded.defaults, enabled: true };
  } catch (error) {
    console.warn("[Email] Identity lookup failed; using env defaults", error);
    const env = envDefaults();
    return { fromEmail: env.fromEmail, fromName: env.fromName, enabled: true };
  }
}

export function formatFromHeader(fromName: string, fromEmail: string): string {
  const safeName = fromName.replace(/[\r\n<>]/g, "").trim() || "Sanative";
  return `${safeName} <${fromEmail}>`;
}

function emailFromHeader(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match?.[1] || fromHeader).trim().toLowerCase();
}

/**
 * Google SMTP (smtp.gmail.com) only authenticates the mailbox in GOOGLE_SMTP_USER.
 * A different From address is rewritten to that mailbox so the header matches the login.
 */
export function alignFromWithGoogleSmtpUser(
  fromHeader: string,
  smtpUser: string | undefined
): string {
  const user = (smtpUser || "").trim().toLowerCase();
  if (!user.includes("@")) return fromHeader;
  if (emailFromHeader(fromHeader) === user) return fromHeader;
  const nameMatch = fromHeader.match(/^\s*([^<]+?)\s*</);
  const name = nameMatch?.[1]?.replace(/["']/g, "").trim() || "Sanative";
  return formatFromHeader(name, user);
}
