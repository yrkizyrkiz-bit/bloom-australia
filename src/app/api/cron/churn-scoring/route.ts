import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET /api/cron/churn-scoring
// Protected by: Authorization: Bearer {CRON_SECRET}
// Schedule: Every Sunday at 10am UTC (8pm AEST)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results: Array<{ userId: string; score: number; status: string }> = [];

    // Fetch all active weight management users
    const activeUsers = await prisma.user.findMany({
      where: {
        journeyStatus: "ACTIVE",
        subscriptionTier: "weight_management",
      },
      include: {
        weightLogs: {
          orderBy: { measuredAt: "desc" },
          take: 4,
        },
        weeklyCheckIns: {
          orderBy: { checkedInAt: "desc" },
          take: 1,
        },
      },
    });

    for (const user of activeUsers) {
      let score = 0;

      // Factor 1: Check-in recency
      const lastCheckIn = user.weeklyCheckIns[0]?.checkedInAt;
      if (lastCheckIn) {
        const daysSinceCheckIn = Math.floor(
          (now.getTime() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCheckIn > 7) score += 20;
        if (daysSinceCheckIn > 14) score += 15;
        if (daysSinceCheckIn > 21) score += 10;
      } else {
        // No check-ins at all
        score += 30;
      }

      // Factor 2: Weight plateau (no change in last 3 logs)
      const weights = user.weightLogs.map((l) => l.weight);
      if (weights.length >= 3) {
        const isPlateauing = Math.abs(weights[0] - weights[2]) < 0.3;
        if (isPlateauing) score += 20;
      }

      // Factor 3: No weight logging
      const lastWeightLog = user.weightLogs[0]?.measuredAt;
      if (lastWeightLog) {
        const daysSinceWeightLog = Math.floor(
          (now.getTime() - new Date(lastWeightLog).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceWeightLog > 14) score += 15;
      } else {
        score += 20;
      }

      // Factor 4: Renewal proximity (higher risk closer to renewal)
      if (user.renewalDate) {
        const daysToRenewal = Math.floor(
          (new Date(user.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysToRenewal > 0 && daysToRenewal < 30) score += 10;
        if (daysToRenewal > 0 && daysToRenewal < 14) score += 5;
      }

      // Cap score at 100
      score = Math.min(score, 100);

      // Determine new status
      const wasAtRisk = user.journeyStatus === "PAUSED";
      const isNowAtRisk = score >= 60;

      // Update user with churn score
      await prisma.user.update({
        where: { id: user.id },
        data: {
          churnRiskScore: score,
          engagementScore: Math.max(0, 100 - score), // Inverse of churn risk
          journeyStatus: isNowAtRisk ? "PAUSED" : user.journeyStatus === "PAUSED" ? "ACTIVE" : user.journeyStatus,
        },
      });

      results.push({
        userId: user.id,
        score,
        status: isNowAtRisk ? "PAUSED" : "OK",
      });

      // Trigger re-engagement if newly at risk
      if (isNowAtRisk && !wasAtRisk) {
        // Send re-engagement email
        await sendEmail({
          to: user.email,
          subject: "We miss you! Let's get back on track together",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>We've noticed it's been a little while since your last check-in with Sanative.</p>
            <p>Life gets busy, and that's completely okay! What matters is that you're still committed to your health journey, and we're here to support you every step of the way.</p>
            <p>Here are a few ways to get back on track:</p>
            <ul>
              <li><strong>Quick check-in:</strong> Just 2 minutes to log your progress</li>
              <li><strong>Chat with your care partner:</strong> They're here to help</li>
              <li><strong>Review your goals:</strong> Sometimes adjusting expectations helps</li>
            </ul>
            <div style="margin: 24px 0;">
              <a href="${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/dashboard/weight-management/check-in"
                 style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                Log a Quick Check-in
              </a>
            </div>
            <p>Remember: progress isn't always linear, but consistency is key. We believe in you!</p>
            <p style="color:#666;margin-top:24px;">Your Sanative Care Team</p>
          `,
        });

        // Create care partner follow-up task
        await prisma.careCommunication.create({
          data: {
            userId: user.id,
            type: "FOLLOW_UP",
            priority: "HIGH",
            subject: "Churn risk detected - follow up needed",
            notes: `User churn risk score: ${score}/100. No check-in in ${user.weeklyCheckIns[0] ? Math.floor((now.getTime() - new Date(user.weeklyCheckIns[0].checkedInAt).getTime()) / (1000 * 60 * 60 * 24)) : "?"} days.`,
            dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
            status: "PENDING",
          },
        });

        // Queue SMS notification
        if (user.phone) {
          await prisma.sMSNotification.create({
            data: {
              recipientId: user.id,
              recipientPhone: user.phone,
              message: `Hi ${user.firstName}, we've missed you at Sanative! Your care partner will reach out soon. In the meantime, log a quick check-in: sanative.com.au/check-in`,
              status: "PENDING",
              provider: process.env.SMS_PROVIDER || "mock",
            },
          });
        }

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId: user.id,
            automationType: "churn_risk_alert",
            triggerEvent: "weekly_scoring",
            channel: "cron",
            status: "completed",
            metadata: { churnScore: score },
          },
        });
      }
    }

    // Summary stats
    const atRiskCount = results.filter((r) => r.status === "PAUSED").length;
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    console.log(`[Churn Scoring] Processed ${results.length} users. At-risk: ${atRiskCount}. Avg score: ${avgScore}`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      atRisk: atRiskCount,
      avgScore,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Churn scoring error:", error);
    return NextResponse.json(
      { error: "Churn scoring failed" },
      { status: 500 }
    );
  }
}
