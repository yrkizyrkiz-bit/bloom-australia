import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CHARGE_LEAD_DAYS,
  DEFAULT_INCLUDED_CARE_DAYS,
} from "@/lib/billing/included-care-dates";
import { saveIncludedCarePolicy } from "@/lib/billing/included-care";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.billingSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    enabled: row?.includedCareEnabled ?? true,
    includedDays: row?.includedCareDays ?? DEFAULT_INCLUDED_CARE_DAYS,
    chargeLeadDays: row?.chargeLeadDays ?? DEFAULT_CHARGE_LEAD_DAYS,
  });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const enabled = body?.enabled === true;
  const includedDays = Number(body?.includedDays);
  if (!Number.isFinite(includedDays) || includedDays < 0 || includedDays > 365) {
    return NextResponse.json({ error: "Included days must be between 0 and 365" }, { status: 400 });
  }

  await saveIncludedCarePolicy({ enabled, includedDays });
  const row = await prisma.billingSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    enabled: row?.includedCareEnabled ?? enabled,
    includedDays: row?.includedCareDays ?? includedDays,
    chargeLeadDays: row?.chargeLeadDays ?? DEFAULT_CHARGE_LEAD_DAYS,
  });
}
