import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/notifications/web-push";

const STAFF_ROLES = new Set(["ADMIN", "admin", "CARE_PARTNER", "DOCTOR", "SUPER_ADMIN"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !STAFF_ROLES.has(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Web Push is not configured", configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey, configured: true });
}
