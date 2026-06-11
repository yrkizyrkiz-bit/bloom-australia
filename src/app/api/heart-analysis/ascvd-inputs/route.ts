import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gatherAscvdInputsForUser } from "@/lib/ascvd-inputs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await gatherAscvdInputsForUser(session.user.id);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("ASCVD inputs error:", error);
    return NextResponse.json(
      { error: "Failed to load ASCVD calculator inputs" },
      { status: 500 }
    );
  }
}
