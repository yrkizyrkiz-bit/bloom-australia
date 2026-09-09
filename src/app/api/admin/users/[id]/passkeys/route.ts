import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER", "SUPER_ADMIN"];

function serializePasskey(passkey: {
  id: string;
  deviceName: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}) {
  return {
    id: passkey.id,
    deviceName: passkey.deviceName,
    createdAt: passkey.createdAt,
    lastUsedAt: passkey.lastUsedAt,
  };
}

async function writePasskeyNote(
  userId: string,
  session: { user: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } },
  title: string,
  content: string
) {
  const authorName =
    `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin";
  await prisma.internalNote.create({
    data: {
      userId,
      memberId: userId,
      category: "GENERAL",
      title,
      content,
      createdBy: session.user.id,
      authorId: session.user.id,
      authorName,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId,
      action: "ADMIN_FACE_ID_UPDATE",
      entity: "passkey",
      entityId: userId,
      details: {
        title,
        updatedBy: session.user.id,
        updatedByEmail: session.user.email,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      passkeysEnabled: true,
      passkeys: {
        orderBy: { createdAt: "desc" },
        select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "MEMBER") {
    return NextResponse.json(
      { error: "Staff Face ID is managed from the account page" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    enabled: user.passkeysEnabled,
    passkeys: user.passkeys.map(serializePasskey),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, passkeysEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "MEMBER") {
    return NextResponse.json(
      { error: "Staff Face ID is managed from the account page" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const revokePasskeyId = typeof body.revokePasskeyId === "string" ? body.revokePasskeyId : "";
  const revokeAll = body.revokeAll === true;
  const disableFaceId = body.passkeysEnabled === false;

  if (revokePasskeyId) {
    const passkey = await prisma.passkey.findUnique({ where: { id: revokePasskeyId } });
    if (!passkey || passkey.userId !== user.id) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    await prisma.passkey.delete({ where: { id: passkey.id } });
    await writePasskeyNote(
      user.id,
      session,
      "Face ID device revoked",
      `${passkey.deviceName || "A device"} was revoked by ${session.user.firstName || ""} ${session.user.lastName || ""} (${session.user.email}).`
    );
  } else if (revokeAll) {
    const result = await prisma.passkey.deleteMany({ where: { userId: user.id } });
    await writePasskeyNote(
      user.id,
      session,
      "Face ID devices revoked",
      `All Face ID devices (${result.count}) were revoked by ${session.user.firstName || ""} ${session.user.lastName || ""} (${session.user.email}).`
    );
  } else if (disableFaceId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passkeysEnabled: false },
    });
    await writePasskeyNote(
      user.id,
      session,
      "Face ID disabled",
      `Face ID was disabled by ${session.user.firstName || ""} ${session.user.lastName || ""} (${session.user.email}). Existing devices stay until revoked.`
    );
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      passkeysEnabled: true,
      passkeys: {
        orderBy: { createdAt: "desc" },
        select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
      },
    },
  });

  return NextResponse.json({
    enabled: updated?.passkeysEnabled ?? false,
    passkeys: (updated?.passkeys || []).map(serializePasskey),
  });
}
