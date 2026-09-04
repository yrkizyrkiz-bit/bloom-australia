import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadRingWeek } from "@/lib/weight-management/load-home-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ringWeek = await loadRingWeek(session.user.id);
    return NextResponse.json({ ringWeek });
  } catch (error) {
    console.error("[weight-management/rings]", error);
    return NextResponse.json({ error: "Failed to load rings" }, { status: 500 });
  }
}
