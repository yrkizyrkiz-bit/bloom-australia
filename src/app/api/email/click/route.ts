import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveSafeEmailClickRedirect } from "@/lib/email/click-redirect";

// GET /api/email/click?cid={campaignId}&email={email}&url={url}
// Track link click and redirect (app domain / approved hosts only)
export async function GET(request: NextRequest) {
  const home = new URL("/", request.url);
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("cid");
  const email = searchParams.get("email");
  const redirectUrl = resolveSafeEmailClickRedirect(
    searchParams.get("url"),
    null,
    request
  );

  if (!redirectUrl) {
    return NextResponse.redirect(home);
  }

  try {
    if (campaignId && email) {
      // Find if this is the first click from this user
      const existingClick = await prisma.emailEvent.findFirst({
        where: {
          campaignId,
          recipientEmail: email,
          eventType: "CLICKED",
        },
      });

      // Record the click event
      await prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: "CLICKED",
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          userAgent: request.headers.get("user-agent"),
          metadata: {
            url: redirectUrl,
            firstClick: !existingClick,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update campaign click count (only for first click)
      if (!existingClick) {
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { clickedCount: { increment: 1 } },
        });
      }
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error tracking click:", error);
    // Still only redirect to the already-validated URL
    return NextResponse.redirect(redirectUrl);
  }
}
