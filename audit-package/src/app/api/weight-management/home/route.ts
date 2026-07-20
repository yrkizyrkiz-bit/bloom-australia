import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadWeightManagementHome } from "@/lib/weight-management/load-home-data";

export const dynamic = "force-dynamic";

/** Single round-trip payload for the Weight Management home screen. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await loadWeightManagementHome(session.user.id);
    if (!payload) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[weight-management/home]", error);
    return NextResponse.json({ error: "Failed to load weight management home" }, { status: 500 });
  }
}
