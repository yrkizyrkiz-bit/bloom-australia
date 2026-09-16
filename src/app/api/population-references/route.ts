import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadPopulationDataset } from "@/lib/au-population/load-dataset";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loaded = await loadPopulationDataset();
  return NextResponse.json({
    dataset: loaded.dataset,
    updatedAt: loaded.updatedAt,
    usingOverride: loaded.usingOverride,
  });
}
