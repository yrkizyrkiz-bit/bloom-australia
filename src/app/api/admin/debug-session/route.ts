import { NextRequest, NextResponse } from "next/server";
import { blockDevOnlyRouteInProduction } from "@/lib/security/environment";

// GET /api/admin/debug-session - Debug session and user info (dev only)
export async function GET(request: NextRequest) {
  const blocked = blockDevOnlyRouteInProduction();
  if (blocked) {
    return blocked;
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
