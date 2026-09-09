import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role === "GP") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      passkeysEnabled: true,
      passkeys: {
        orderBy: { createdAt: "desc" },
        select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    enabled: user.passkeysEnabled,
    passkeys: user.passkeys,
  });
}
