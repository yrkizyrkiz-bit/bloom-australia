import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

// POST /api/admin/declined-actions - Handle declined patient actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action, emailContent, callNotes, reviewDate } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        assignedCarePartnerId: true,
        internalNotes: {
          where: { title: { contains: "Declined" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const carePartnerName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner";

    switch (action) {
      case "email": {
        // Extract decline reason from internal notes if available
        const declineNote = user.internalNotes[0]?.content || "";
        const reasonMatch = declineNote.match(/\*\*Reason:\*\* (.+)/);
        const declineReason = reasonMatch ? reasonMatch[1] : "medical assessment";

        // Send compassionate decline email
        await sendEmail({
          to: user.email,
          subject: "Update on your Sanative Weight Management application",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>Thank you for your interest in the Sanative Weight Management Program.</p>
            <p>After careful review of your health assessment, our medical team has determined that this particular program may not be the best fit for you at this time.</p>
            <p>This decision was made with your health and safety as our priority.</p>

            ${emailContent ? `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;"><p style="margin:0;">${emailContent}</p></div>` : ""}

            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px 0;color:#92400e;">What are my options?</h3>
              <p style="margin:0;color:#92400e;">We're still here to support your health journey:</p>
              <ul style="margin:8px 0 0 0;padding-left:20px;color:#92400e;">
                <li>We recommend consulting with your regular GP to discuss alternative approaches</li>
                <li>Our team can provide referrals to nutritionists or lifestyle coaches</li>
                <li>You may be eligible for other Sanative wellness programs</li>
                <li>If your health circumstances change, you're welcome to reapply in the future</li>
              </ul>
            </div>

            <p>Your payment will be refunded in full to your original payment method. Please allow 5-10 business days for the refund to appear.</p>

            <p>If you have any questions or would like to discuss this further, please don't hesitate to reply to this email or call us.</p>

            <p style="color:#666;margin-top:24px;">Warm regards,<br>The Sanative Health Team</p>
          `,
        });

        // Log the action
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: carePartnerName,
            createdBy: session.user.id,
            category: "COMMUNICATION",
            title: "Decline Email Sent",
            content: `Compassionate decline email sent to patient by ${carePartnerName}.${emailContent ? `\n\nCustom message included:\n${emailContent}` : ""}`,
            isPinned: false,
          },
        });

        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "decline_email_sent",
            triggerEvent: "care_partner_action",
            channel: "email",
            status: "completed",
            metadata: { sentBy: session.user.id, hasCustomContent: !!emailContent },
          },
        });

        return NextResponse.json({ success: true, action: "email_sent" });
      }

      case "call": {
        // Create a care communication task for the call
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "PHONE_CALL",
            priority: "HIGH",
            subject: `Call Declined Patient: ${user.firstName} ${user.lastName}`,
            notes: callNotes || "Discuss decline decision and alternative options with patient.",
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
            assignedTo: session.user.id,
          },
        });

        // Log the scheduled call
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: carePartnerName,
            createdBy: session.user.id,
            category: "COMMUNICATION",
            title: "Patient Call Scheduled",
            content: `Call scheduled with patient to discuss decline decision.\n\nNotes: ${callNotes || "N/A"}`,
            isPinned: false,
          },
        });

        return NextResponse.json({ success: true, action: "call_scheduled" });
      }

      case "refund": {
        // Find the consultation payment to refund
        const invoice = await prisma.invoice.findFirst({
          where: { userId, status: "PAID" },
          orderBy: { createdAt: "desc" },
        });

        let refundInitiated = false;
        let refundError = null;

        if (invoice?.stripeId) {
          try {
            await stripe.refunds.create({
              payment_intent: invoice.stripeId,
              reason: "requested_by_customer",
            });

            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: "REFUNDED" },
            });
            refundInitiated = true;
          } catch (error) {
            console.error("Refund failed:", error);
            refundError = error instanceof Error ? error.message : "Unknown error";
          }
        }

        // Log the refund action
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: carePartnerName,
            createdBy: session.user.id,
            category: "BILLING",
            title: refundInitiated ? "Refund Initiated" : "Refund Failed",
            content: refundInitiated
              ? `Program payment refund initiated by ${carePartnerName}. Patient will receive funds within 5-10 business days.`
              : `Refund attempt failed. Error: ${refundError || "No payment found"}. Manual intervention required.`,
            isPinned: !refundInitiated,
          },
        });

        // Send refund confirmation email if successful
        if (refundInitiated) {
          await sendEmail({
            to: user.email,
            subject: "Your Sanative refund has been processed",
            body: `
              <h2>Hi ${user.firstName},</h2>
              <p>We've processed a refund for your Sanative Weight Management program payment.</p>
              <p>The refund has been issued to your original payment method and should appear within 5-10 business days.</p>
              <p>If you have any questions or don't see the refund after this period, please contact our support team.</p>
              <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
            `,
          });
        }

        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "refund_processed",
            triggerEvent: "care_partner_action",
            channel: "stripe",
            status: refundInitiated ? "completed" : "failed",
            metadata: {
              processedBy: session.user.id,
              refundInitiated,
              invoiceId: invoice?.id,
              error: refundError,
            },
          },
        });

        return NextResponse.json({
          success: refundInitiated,
          action: "refund",
          refundInitiated,
          error: refundError,
        });
      }

      case "review": {
        if (!reviewDate) {
          return NextResponse.json({ error: "Review date is required" }, { status: 400 });
        }

        const reviewDateTime = new Date(reviewDate);

        // Update user status to allow re-review
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "DEFERRED",
            journeyStatus: "AWAITING_DOCTOR_DECISION",
          },
        });

        // Create follow-up appointment
        await prisma.appointment.create({
          data: {
            userId,
            type: "FOLLOW_UP",
            title: "Weight Management Re-review",
            description: callNotes || "Patient scheduled for re-review after previous decline",
            scheduledAt: reviewDateTime,
            duration: 15,
            status: "SCHEDULED",
            followUpRequired: true,
            followUpDate: reviewDateTime,
          },
        });

        // Create care task
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "FOLLOW_UP",
            priority: "NORMAL",
            subject: `Re-review Scheduled: ${user.firstName} ${user.lastName}`,
            notes: `Patient moved from DECLINED to re-review status.\n\nScheduled for: ${reviewDateTime.toLocaleDateString("en-AU", { dateStyle: "long" })}\n\n${callNotes || ""}`,
            status: "SCHEDULED",
            dueDate: reviewDateTime,
            assignedTo: session.user.id,
          },
        });

        // Log the action
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: carePartnerName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Re-review Scheduled",
            content: `Patient moved from DECLINED status for re-review.\n\nScheduled Date: ${reviewDateTime.toLocaleDateString("en-AU", { dateStyle: "long" })}\n\n${callNotes ? `Notes: ${callNotes}` : ""}`,
            isPinned: true,
          },
        });

        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "rereview_scheduled",
            triggerEvent: "care_partner_action",
            channel: "admin_portal",
            status: "completed",
            metadata: {
              scheduledBy: session.user.id,
              reviewDate: reviewDateTime.toISOString(),
              previousStatus: "DECLINED",
            },
          },
        });

        return NextResponse.json({
          success: true,
          action: "review_scheduled",
          reviewDate: reviewDateTime.toISOString(),
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing declined action:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
