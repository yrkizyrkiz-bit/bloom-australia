import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public check used by the login page: show Face ID only when this account
 * already has a passkey. Always returns { available: boolean }.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ available: false });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      passkeysEnabled: true,
      _count: { select: { passkeys: true } },
    },
  });

  const available = Boolean(
    user?.passkeysEnabled && (user._count.passkeys ?? 0) > 0
  );

  return NextResponse.json({ available });
}
