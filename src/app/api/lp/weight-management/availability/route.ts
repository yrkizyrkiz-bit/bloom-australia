import { NextResponse } from "next/server";
import { getLpWmAvailability } from "@/lib/lp/availability";

export const revalidate = 30;

export async function GET() {
  try {
    const slots = await getLpWmAvailability();
    return NextResponse.json(
      { slots },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[lp/weight-management/availability]", error);
    return NextResponse.json({ error: "Failed to load available times" }, { status: 500 });
  }
}
