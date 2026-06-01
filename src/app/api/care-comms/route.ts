import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, replaceTemplateVariables } from "@/lib/email";

// GET - Fetch all communications for a member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const type = searchParams.get("type"); // chat, email, call, note, all
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const fetchFollowUps = searchParams.get("followUps") === "true";

    // If fetching follow-ups across all members (for admin dashboard)
    if (fetchFollowUps) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const pendingFollowUps = await prisma.callLog.findMany({
        where: {
          followUpRequired: true,
          followUpDate: { not: null },
          ...(memberId && { memberId }),
        },
        orderBy: { followUpDate: "asc" },
        take: 50,
      });

      // Get member names for each follow-up
      const memberIds = [...new Set(pendingFollowUps.map(f => f.memberId))];
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      const memberMap = new Map(members.map(m => [m.id, m]));

      const followUps = pendingFollowUps.map(f => {
        const member = memberMap.get(f.memberId);
        const followUpDate = f.followUpDate ? new Date(f.followUpDate) : null;
        let status: "overdue" | "today" | "upcoming" = "upcoming";

        if (followUpDate) {
          if (followUpDate < today) {
            status = "overdue";
          } else if (followUpDate < tomorrow) {
            status = "today";
          }
        }

        return {
          id: f.id,
          memberId: f.memberId,
          memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
          memberEmail: member?.email,
          subject: f.subject,
          notes: f.notes,
          followUpDate: f.followUpDate,
          calledAt: f.calledAt,
          agentName: f.agentName,
          status,
        };
      });

      // Categorize follow-ups
      const overdue = followUps.filter(f => f.status === "overdue");
      const dueToday = followUps.filter(f => f.status === "today");
      const upcoming = followUps.filter(f => f.status === "upcoming");

      return NextResponse.json({
        followUps: {
          overdue,
          dueToday,
          upcoming,
          total: followUps.length,
        },
      });
    }

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const communications: {
      id: string;
      type: string;
      subject: string;
      preview: string;
      date: Date;
      agent?: string;
      status?: string;
      details?: unknown;
    }[] = [];

    // Fetch chat history
    if (!type || type === "all" || type === "chat") {
      const chats = await prisma.memberChatHistory.findMany({
        where: {
          memberId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: "desc" },
      });

      chats.forEach(chat => {
        communications.push({
          id: chat.id,
          type: "chat",
          subject: chat.wasAiHandled ? "AI Chat Session" : "Live Chat Session",
          preview: chat.summary || `${chat.messageCount} messages`,
          date: chat.createdAt,
          agent: chat.coachName || (chat.wasAiHandled ? "AI Assistant" : "Unknown"),
          status: "completed",
          details: {
            messageCount: chat.messageCount,
            duration: chat.endedAt && chat.startedAt
              ? Math.round((new Date(chat.endedAt).getTime() - new Date(chat.startedAt).getTime()) / 1000 / 60)
              : null,
            wasAiHandled: chat.wasAiHandled,
            transcript: chat.transcript,
          },
        });
      });
    }

    // Fetch email events
    if (!type || type === "all" || type === "email") {
      const emails = await prisma.emailEvent.findMany({
        where: {
          recipientId: memberId,
          eventType: "SENT",
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: { campaign: true },
        orderBy: { createdAt: "desc" },
      });

      emails.forEach(email => {
        communications.push({
          id: email.id,
          type: "email",
          subject: email.campaign?.subject || "Email",
          preview: email.campaign?.body?.substring(0, 100) || "",
          date: email.createdAt,
          status: email.eventType.toLowerCase(),
          agent: "System",
          details: {
            campaignId: email.campaignId,
            messageId: email.messageId,
            body: email.campaign?.body,
          },
        });
      });
    }

    // Fetch call logs
    if (!type || type === "all" || type === "call") {
      const calls = await prisma.callLog.findMany({
        where: {
          memberId,
          ...(Object.keys(dateFilter).length > 0 && { calledAt: dateFilter }),
        },
        orderBy: { calledAt: "desc" },
      });

      calls.forEach(call => {
        communications.push({
          id: call.id,
          type: "call",
          subject: call.subject,
          preview: call.notes?.substring(0, 100) || "",
          date: call.calledAt,
          agent: call.agentName || "Unknown",
          status: call.callResult.toLowerCase(),
          details: {
            callType: call.callType,
            callResult: call.callResult,
            duration: call.duration,
            followUpRequired: call.followUpRequired,
            followUpDate: call.followUpDate,
            notes: call.notes,
          },
        });
      });
    }

    // Fetch internal notes
    if (!type || type === "all" || type === "note") {
      const notes = await prisma.internalNote.findMany({
        where: {
          memberId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: "desc" },
      });

      notes.forEach(note => {
        communications.push({
          id: note.id,
          type: "note",
          subject: note.title,
          preview: note.content.substring(0, 100),
          date: note.createdAt,
          agent: note.authorName || note.createdBy || "System",
          status: note.category.toLowerCase(),
          details: {
            category: note.category,
            content: note.content,
            isPinned: note.isPinned,
          },
        });
      });
    }

    // Sort all communications by date descending
    communications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Also fetch pending follow-ups for this member
    const pendingFollowUps = await prisma.callLog.findMany({
      where: {
        memberId,
        followUpRequired: true,
        followUpDate: { not: null },
      },
      orderBy: { followUpDate: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const memberFollowUps = pendingFollowUps.map(f => {
      const followUpDate = f.followUpDate ? new Date(f.followUpDate) : null;
      let status: "overdue" | "today" | "upcoming" = "upcoming";

      if (followUpDate) {
        if (followUpDate < today) {
          status = "overdue";
        } else if (followUpDate < tomorrow) {
          status = "today";
        }
      }

      return {
        id: f.id,
        subject: f.subject,
        followUpDate: f.followUpDate,
        status,
        agentName: f.agentName,
      };
    });

    return NextResponse.json({
      communications,
      followUps: memberFollowUps,
    });
  } catch (error) {
    console.error("Error fetching communications:", error);
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 });
  }
}

// POST - Log a call, add internal note, or send email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, memberId, ...data } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    // Get member info
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Log a call
    if (action === "logCall") {
      const call = await prisma.callLog.create({
        data: {
          memberId,
          agentId: session.user.id,
          agentName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
          callType: data.callType || "OUTBOUND",
          callResult: data.callResult || "COMPLETED",
          duration: data.duration || null,
          subject: data.subject,
          notes: data.notes || null,
          followUpRequired: data.followUpRequired || false,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          calledAt: data.calledAt ? new Date(data.calledAt) : new Date(),
        },
      });

      return NextResponse.json({ call });
    }

    // Add internal note
    if (action === "addNote") {
      const note = await prisma.internalNote.create({
        data: {
          userId: memberId,
          memberId,
          authorId: session.user.id,
          authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
          createdBy: session.user.id,
          category: data.category || "GENERAL",
          title: data.title,
          content: data.content,
          isPinned: data.isPinned || false,
        },
      });

      return NextResponse.json({ note });
    }

    // Send email and log it
    if (action === "sendEmail") {
      const agentName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin";

      // Replace template variables if provided
      let subject = data.subject;
      let body = data.body;

      if (data.variables) {
        subject = replaceTemplateVariables(subject, data.variables);
        body = replaceTemplateVariables(body, data.variables);
      }

      // Send actual email using Resend
      const emailResult = await sendEmail({
        to: member.email,
        subject,
        body,
        tags: [
          { name: 'type', value: 'care-comms' },
          { name: 'memberId', value: memberId },
        ],
      });

      // Create an email campaign to track this individual email
      const campaign = await prisma.emailCampaign.create({
        data: {
          subject,
          body,
          sentBy: session.user.id,
          recipientCount: 1,
          sentCount: emailResult.success ? 1 : 0,
          deliveredCount: 0, // Will be updated by webhook
          status: emailResult.success ? "SENT" : "FAILED",
          sentAt: new Date(),
        },
      });

      // Create email event for tracking
      const emailEvent = await prisma.emailEvent.create({
        data: {
          campaignId: campaign.id,
          recipientEmail: member.email,
          recipientId: memberId,
          messageId: emailResult.messageId,
          eventType: emailResult.success ? "SENT" : "BOUNCED",
          metadata: {
            sentBy: agentName,
            sentByUserId: session.user.id,
            isDirectEmail: true,
            error: emailResult.error,
          },
        },
      });

      // Also add an internal note about the email
      await prisma.internalNote.create({
        data: {
          userId: memberId,
          memberId,
          authorId: session.user.id,
          authorName: agentName,
          createdBy: session.user.id,
          category: "GENERAL",
          title: `Email ${emailResult.success ? 'sent' : 'failed'}: ${subject}`,
          content: `${emailResult.success ? 'Sent' : 'Failed to send'} email to ${member.email}\n\nSubject: ${subject}\n\nBody:\n${body}${emailResult.error ? `\n\nError: ${emailResult.error}` : ''}`,
          isPinned: false,
        },
      });

      if (!emailResult.success) {
        return NextResponse.json({
          success: false,
          error: emailResult.error || 'Failed to send email',
          campaign,
          emailEvent,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        campaign,
        emailEvent,
        message: `Email sent to ${member.email}`,
      });
    }

    // Mark follow-up as complete
    if (action === "completeFollowUp") {
      const call = await prisma.callLog.update({
        where: { id: data.callLogId },
        data: {
          followUpRequired: false,
        },
      });

      return NextResponse.json({ call, success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in care comms:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

// DELETE - Delete a call log or note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
    }

    if (type === "call") {
      await prisma.callLog.delete({ where: { id } });
    } else if (type === "note") {
      await prisma.internalNote.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
