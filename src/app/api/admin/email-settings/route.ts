import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-clinical-staff";
import { getEmailTransportInfo } from "@/lib/email";
import {
  EMAIL_PROCESS_KEYS,
  EMAIL_PROCESS_META,
  isEmailProcessKey,
} from "@/lib/email-process";
import {
  ensureEmailProcessConfigs,
  invalidateEmailIdentityCache,
} from "@/lib/email-identity";

function blankToNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlausibleEmail(value: string | null): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const staff = await requireAdmin();
  if ("error" in staff) return staff.error;

  await ensureEmailProcessConfigs();

  const [settings, processes] = await Promise.all([
    prisma.emailSettings.findUnique({ where: { id: "default" } }),
    prisma.emailProcessConfig.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const byKey = new Map(processes.map((row) => [row.processKey, row]));
  const processRows = EMAIL_PROCESS_KEYS.map((key) => {
    const row = byKey.get(key);
    const meta = EMAIL_PROCESS_META[key];
    return {
      processKey: key,
      label: row?.label || meta.label,
      fromEmail: row?.fromEmail || "",
      fromName: row?.fromName || "",
      replyTo: row?.replyTo || "",
      enabled: row?.enabled ?? true,
      sortOrder: row?.sortOrder ?? meta.sortOrder,
    };
  });

  return NextResponse.json({
    transport: getEmailTransportInfo(),
    settings: {
      defaultFromEmail: settings?.defaultFromEmail || "noreply@sanative.com.au",
      defaultFromName: settings?.defaultFromName || "Sanative Health",
      defaultReplyTo: settings?.defaultReplyTo || "",
    },
    processes: processRows,
  });
}

export async function PUT(req: NextRequest) {
  const staff = await requireAdmin();
  if ("error" in staff) return staff.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const defaultFromEmail = blankToNull(body.defaultFromEmail) || "noreply@sanative.com.au";
  const defaultFromName = blankToNull(body.defaultFromName) || "Sanative Health";
  const defaultReplyTo = blankToNull(body.defaultReplyTo);

  if (!isPlausibleEmail(defaultFromEmail) || !isPlausibleEmail(defaultReplyTo)) {
    return NextResponse.json({ error: "Invalid default email address" }, { status: 400 });
  }

  const incomingProcesses = Array.isArray(body.processes) ? body.processes : [];
  for (const row of incomingProcesses) {
    if (!row || typeof row !== "object") continue;
    const key = typeof row.processKey === "string" ? row.processKey : "";
    if (!isEmailProcessKey(key)) {
      return NextResponse.json({ error: `Unknown process: ${key}` }, { status: 400 });
    }
    const fromEmail = blankToNull(row.fromEmail);
    const replyTo = blankToNull(row.replyTo);
    if (!isPlausibleEmail(fromEmail) || !isPlausibleEmail(replyTo)) {
      return NextResponse.json(
        { error: `Invalid email address for ${key}` },
        { status: 400 }
      );
    }
  }

  await ensureEmailProcessConfigs();

  await prisma.emailSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      defaultFromEmail,
      defaultFromName,
      defaultReplyTo,
    },
    update: {
      defaultFromEmail,
      defaultFromName,
      defaultReplyTo,
    },
  });

  for (const row of incomingProcesses) {
    if (!row || typeof row !== "object") continue;
    const key = row.processKey as string;
    if (!isEmailProcessKey(key)) continue;
    await prisma.emailProcessConfig.update({
      where: { processKey: key },
      data: {
        fromEmail: blankToNull(row.fromEmail),
        fromName: blankToNull(row.fromName),
        replyTo: blankToNull(row.replyTo),
        enabled: row.enabled !== false,
        label: EMAIL_PROCESS_META[key].label,
      },
    });
  }

  invalidateEmailIdentityCache();

  return NextResponse.json({ success: true });
}
