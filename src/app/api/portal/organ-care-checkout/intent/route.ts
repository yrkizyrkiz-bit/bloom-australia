import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Organ Care is no longer sold as a standalone subscription.
 * Members unlock it via biomarkers or Sanative Membership.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error:
        "Organ Care is included with biomarkers and is no longer available as a separate subscription.",
      redirectTo: "/dashboard/biomarkers/quiz",
    },
    { status: 410 }
  );
}
