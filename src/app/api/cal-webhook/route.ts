import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

interface CalBookingPayload {
  uid: string;
  title?: string;
  startTime: string;
  endTime?: string;
  eventLength?: number;
  meetingUrl?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    timeZone?: string;
  }>;
  organizer?: {
    email: string;
    name?: string;
  };
}

interface CalWebhookPayload {
  triggerEvent: string;
  payload: CalBookingPayload;
}

export async function POST(req: NextRequest) {
  // Verify Cal.com webhook signature (optional but recommended)
  const calSignature = req.headers.get("x-cal-signature-256");
  const body = await req.text();

  if (calSignature && process.env.CALCOM_WEBHOOK_SECRET) {
    const expectedSig = createHmac("sha256", process.env.CALCOM_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    if (`sha256=${expectedSig}` !== calSignature) {
      console.error("Cal.com webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: CalWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { triggerEvent, payload: booking } = payload;

  try {
    if (triggerEvent === "BOOKING_CREATED") {
      const attendeeEmail = booking?.attendees?.[0]?.email?.toLowerCase();
      if (!attendeeEmail) {
        console.log("Cal.com webhook: no attendee email provided");
        return NextResponse.json({ error: "No attendee email" }, { status: 400 });
      }

      // Find patient by email
      const user = await prisma.user.findFirst({
        where: { email: attendeeEmail }
      });

      if (!user) {
        console.log("Cal.com webhook: user not found for", attendeeEmail);
        // Don't fail — user may not exist yet (external booking)
        return NextResponse.json({ received: true, note: "User not found" });
      }

      // Check if appointment already exists (prevent duplicates)
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          notes: { contains: booking.uid }
        }
      });

      if (existingAppointment) {
        console.log("Cal.com webhook: appointment already exists for", booking.uid);
        return NextResponse.json({ received: true, note: "Already processed" });
      }

      // Create Appointment record
      await prisma.appointment.create({
        data: {
          userId:      user.id,
          type:        "CONSULTATION",
          title:       booking.title || "Consultation",
          scheduledAt: new Date(booking.startTime),
          duration:    booking.eventLength || 30,
          location:    booking.meetingUrl || "Video",
          videoLink:   booking.meetingUrl || null,
          status:      "CONFIRMED",
          notes:       `Cal.com booking UID: ${booking.uid}`,
        }
      });

      // Update journey status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          journeyStatus: "CONSULTATION_BOOKED"
        }
      });

      // Create care partner task to prepare patient brief
      const appointmentDate = new Date(booking.startTime);
      const briefDueDate = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000); // 2h before

      await prisma.careCommunication.create({
        data: {
          userId:   user.id,
          type:     "FOLLOW_UP",
          priority: "HIGH",
          notes:    `Consultation booked for ${appointmentDate.toLocaleDateString("en-AU")} at ${appointmentDate.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}. Prepare patient brief.`,
          dueDate:  briefDueDate,
          status:   "PENDING",
        }
      }).catch(console.error);

      // Log automation event
      await prisma.automationLog.create({
        data: {
          userId:        user.id,
          automationType: "consultation_booked",
          triggerEvent:  "BOOKING_CREATED",
          channel:       "cal_webhook",
          status:        "completed",
          metadata:      { calBookingUid: booking.uid, meetingUrl: booking.meetingUrl },
        }
      }).catch(console.error);

      console.log("Cal.com webhook: appointment created for", attendeeEmail);
    }

    if (triggerEvent === "BOOKING_CANCELLED") {
      const attendeeEmail = booking?.attendees?.[0]?.email?.toLowerCase();

      // Find and update the appointment by UID in notes
      const result = await prisma.appointment.updateMany({
        where: {
          notes: { contains: booking.uid },
        },
        data: {
          status: "CANCELLED",
          cancellationReason: "Cancelled via Cal.com",
        }
      });

      if (result.count > 0) {
        console.log("Cal.com webhook: appointment cancelled for", booking.uid);

        // If we have the user, update their journey status if needed
        if (attendeeEmail) {
          const user = await prisma.user.findFirst({
            where: { email: attendeeEmail }
          });

          if (user && user.journeyStatus === "CONSULTATION_BOOKED") {
            await prisma.user.update({
              where: { id: user.id },
              data: { journeyStatus: "CONSULTATION_PAID" } // Revert to paid status
            });
          }
        }
      }
    }

    if (triggerEvent === "BOOKING_RESCHEDULED") {
      const attendeeEmail = booking?.attendees?.[0]?.email?.toLowerCase();

      // Update the existing appointment
      const result = await prisma.appointment.updateMany({
        where: {
          notes: { contains: booking.uid },
        },
        data: {
          scheduledAt: new Date(booking.startTime),
          videoLink: booking.meetingUrl || undefined,
          status: "CONFIRMED",
        }
      });

      if (result.count > 0 && attendeeEmail) {
        const user = await prisma.user.findFirst({ where: { email: attendeeEmail } });
        if (user) {
          // Create a note about the reschedule
          await prisma.internalNote.create({
            data: {
              userId: user.id,
              category: "GENERAL",
              title: "Appointment Rescheduled",
              content: `Consultation rescheduled to ${new Date(booking.startTime).toLocaleDateString("en-AU")}`,
              createdBy: "system",
            }
          }).catch(console.error);
        }
      }

      console.log("Cal.com webhook: appointment rescheduled for", booking.uid);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Cal.com webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Handle webhook verification (Cal.com may send a GET request to verify)
export async function GET() {
  return NextResponse.json({ status: "ok", message: "Cal.com webhook endpoint active" });
}
