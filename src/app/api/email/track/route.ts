import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Transparent 1x1 pixel GIF
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// GET /api/email/track?cid={campaignId}&email={email} - Track email open
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("cid");
    const email = searchParams.get("email");

    if (campaignId && email) {
      // Find if this is the first open
      const existingOpen = await prisma.emailEvent.findFirst({
        where: {
          campaignId,
          recipientEmail: email,
          eventType: "OPENED",
        },
      });

      // Record the open event
      await prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: "OPENED",
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          userAgent: request.headers.get("user-agent"),
          metadata: {
            firstOpen: !existingOpen,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update campaign open count (only for first open)
      if (!existingOpen) {
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { openedCount: { increment: 1 } },
        });
      }
    }

    // Return tracking pixel
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error tracking email open:", error);
    // Still return pixel even on error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
}
