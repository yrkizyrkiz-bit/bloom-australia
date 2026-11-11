import { NextRequest, NextResponse } from "next/server";
import { getUnifiedAvailability } from "@/lib/bookings/unified-availability";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await getUnifiedAvailability({
      appointmentType: searchParams.get("appointmentType") || "PHONE_CONSULT",
      daysAhead: parseInt(searchParams.get("days") || "14", 10),
      dayOffset: Math.max(0, parseInt(searchParams.get("dayOffset") || "0", 10)),
      windowDays: Math.min(7, Math.max(1, parseInt(searchParams.get("windowDays") || "2", 10))),
      staffMode: searchParams.get("staffMode") === "true",
      requestUserId: searchParams.get("userId")?.trim() || null,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting available slots:", error);
    return NextResponse.json({ error: "Failed to get available slots" }, { status: 500 });
  }
}
