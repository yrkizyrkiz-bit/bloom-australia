import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/email/analytics - Get email campaign analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (campaignId) {
      // Get specific campaign stats
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          events: {
            orderBy: { createdAt: "desc" },
            take: 100,
          },
        },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      // Calculate rates
      const deliveryRate = campaign.sentCount > 0
        ? (campaign.deliveredCount / campaign.sentCount) * 100
        : 0;
      const openRate = campaign.deliveredCount > 0
        ? (campaign.openedCount / campaign.deliveredCount) * 100
        : 0;
      const clickRate = campaign.openedCount > 0
        ? (campaign.clickedCount / campaign.openedCount) * 100
        : 0;
      const bounceRate = campaign.sentCount > 0
        ? (campaign.bouncedCount / campaign.sentCount) * 100
        : 0;

      return NextResponse.json({
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          status: campaign.status,
          sentAt: campaign.sentAt,
          recipientCount: campaign.recipientCount,
          sentCount: campaign.sentCount,
          deliveredCount: campaign.deliveredCount,
          openedCount: campaign.openedCount,
          clickedCount: campaign.clickedCount,
          bouncedCount: campaign.bouncedCount,
          rates: {
            delivery: Math.round(deliveryRate * 10) / 10,
            open: Math.round(openRate * 10) / 10,
            click: Math.round(clickRate * 10) / 10,
            bounce: Math.round(bounceRate * 10) / 10,
          },
        },
        events: campaign.events.map(e => ({
          id: e.id,
          type: e.eventType,
          email: e.recipientEmail,
          metadata: e.metadata,
          createdAt: e.createdAt,
        })),
      });
    }

    // Get overall analytics
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        sentAt: { gte: startDate },
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    // Aggregate stats
    const totals = campaigns.reduce(
      (acc, c) => ({
        sent: acc.sent + c.sentCount,
        delivered: acc.delivered + c.deliveredCount,
        opened: acc.opened + c.openedCount,
        clicked: acc.clicked + c.clickedCount,
        bounced: acc.bounced + c.bouncedCount,
      }),
      { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 }
    );

    // Get daily stats for chart
    const dailyEvents = await prisma.emailEvent.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get recent events
    const recentEvents = await prisma.emailEvent.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        campaign: {
          select: { subject: true },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalCampaigns: campaigns.length,
        totalSent: totals.sent,
        totalDelivered: totals.delivered,
        totalOpened: totals.opened,
        totalClicked: totals.clicked,
        totalBounced: totals.bounced,
        rates: {
          delivery: totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 1000) / 10 : 0,
          open: totals.delivered > 0 ? Math.round((totals.opened / totals.delivered) * 1000) / 10 : 0,
          click: totals.opened > 0 ? Math.round((totals.clicked / totals.opened) * 1000) / 10 : 0,
          bounce: totals.sent > 0 ? Math.round((totals.bounced / totals.sent) * 1000) / 10 : 0,
        },
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        sentAt: c.sentAt,
        recipientCount: c.recipientCount,
        openedCount: c.openedCount,
        clickedCount: c.clickedCount,
        openRate: c.deliveredCount > 0 ? Math.round((c.openedCount / c.deliveredCount) * 1000) / 10 : 0,
      })),
      eventsByType: dailyEvents.map(e => ({
        type: e.eventType,
        count: e._count,
      })),
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        type: e.eventType,
        email: e.recipientEmail,
        campaignSubject: e.campaign?.subject,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching email analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
