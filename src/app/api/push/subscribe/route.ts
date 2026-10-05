import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey } from "@/lib/notifications/web-push";

const STAFF_ROLES = new Set(["ADMIN", "admin", "CARE_PARTNER", "DOCTOR", "SUPER_ADMIN"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!getVapidPublicKey()) {
      return NextResponse.json({ error: "Web Push is not configured" }, { status: 503 });
    }

    const body = await req.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";
    const userAgent =
      typeof body.userAgent === "string"
        ? body.userAgent.slice(0, 500)
        : req.headers.get("user-agent")?.slice(0, 500) || null;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
        userAgent,
      },
      update: {
        userId: session.user.id,
        p256dh,
        auth,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error) {
    console.error("[push/subscribe]", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/subscribe DELETE]", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
