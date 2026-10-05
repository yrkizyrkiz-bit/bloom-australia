import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/notifications/web-push";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
