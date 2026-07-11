import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { signMagicLoginToken } from "@/lib/magic-link";
import {
  createDoctorCalendarEvent as createGoogleCalendarEvent,
  CalendarEventData,
  CalendarEventResult,
} from "@/lib/google-calendar";
import { sendEmail } from "@/lib/email";
import { resolveAppBaseUrl } from "@/lib/app-base-url";
import {
  buildPortalActivationMagicLink,
  WM_POST_CHECKOUT_PATH,
} from "@/lib/portal-context";
import {
  genderForPublicConsultSlug,
  genderForSubscriptionTier,
} from "@/lib/funnel/program-gender";
import {
  CLINIC_TIMEZONE,
  getTimezoneAbbreviation,
  isSameTimezone,
} from "@/lib/australia-timezone";
import {
  resolveMensHealthCanonicalKey,
  resolvePublicConsultProgramFromContext,
  resolveWomensHealthCanonicalKey,
  type PublicConsultProgram,
} from "@/lib/funnel/public-consult-programs";
import { createProgramPreTriageTask, resolvePreTriageProgramForBooking } from "@/lib/funnel/program-pre-triage";
import { savePublicFunnelQuizFromIntake } from "@/lib/portal/public-funnel-quiz-submission";
import { grantProgramPanelEntitlementsAtPayment } from "@/lib/portal/grant-program-panel-at-payment";
import { verifyFirstMonthPaymentForBooking } from "@/lib/stripe/verify-booking-payment-intent";
import { verifyOrganCareMembershipBookingPayment } from "@/lib/stripe/verify-organ-care-booking-payment";
import {
  isBiomarkersPanelBookingNotes,
  verifyBiomarkersPanelBookingPayment,
} from "@/lib/stripe/verify-biomarkers-panel-booking-payment";
import { validatePrePaymentConsent } from "@/lib/legal/consent-record";
import { syncEntitlementsFromSignals } from "@/lib/membership/entitlement-service";
import { normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "sanative-secret-key";

/** Resolve program + panel tier hints from the latest ProgramMember intake. */
async function resolvePanelGrantContext(
  userId: string,
  consultProgram: PublicConsultProgram
): Promise<{
  programKey: ProgramKey | null;
  publicPanelTier: string | null;
  billingPanelTier: string | null;
  sourceProgram: string | null;
}> {
  const programMember = await prisma.programMember.findFirst({
    where: { userId },
    select: { program: true, intakeData: true },
    orderBy: { createdAt: "desc" },
  });
  const intake =
    programMember?.intakeData && typeof programMember.intakeData === "object"
      ? (programMember.intakeData as Record<string, unknown>)
      : {};

  const publicPanelTier =
    typeof intake.panelTier === "string" ? intake.panelTier : null;
  const billingPanelTier =
    typeof intake.billingPanelTier === "string" ? intake.billingPanelTier : null;

  if (typeof intake.canonicalProgramKey === "string" && intake.canonicalProgramKey) {
    const canonical = normalizeProgramKey(intake.canonicalProgramKey);
    if (canonical) {
      return {
        programKey: canonical,
        publicPanelTier,
        billingPanelTier,
        sourceProgram: consultProgram.slug === "hair_loss" ? "hair_loss" : null,
      };
    }
  }

  if (intake.undiagnosed === true || intake.canonicalProgramKey === null) {
    return {
      programKey: null,
      publicPanelTier,
      billingPanelTier,
      sourceProgram: null,
    };
  }

  let programKey: ProgramKey | null = null;
  if (consultProgram.slug === "weight_management") {
    programKey = "WEIGHT_MANAGEMENT";
  } else if (consultProgram.slug === "hair_loss") {
    programKey = "HAIR_LOSS";
  } else if (consultProgram.slug === "mens_health") {
    programKey = resolveMensHealthCanonicalKey(
      typeof intake.concern === "string" ? intake.concern : ""
    );
  } else if (consultProgram.slug === "womens_health") {
    programKey = resolveWomensHealthCanonicalKey(
      typeof intake.category === "string" ? intake.category : ""
    );
  }

  return {
    programKey,
    publicPanelTier,
    billingPanelTier,
    sourceProgram: consultProgram.slug === "hair_loss" ? "hair_loss" : null,
  };
}
export interface ConfirmRequest {
  bookingHoldId: string;
  paymentIntentId: string;
  consentRecordId: string;
  userId?: string;
  sessionId?: string;
  selectedPlan?: "CORE" | "PRECISION";
  /** Browser origin from checkout (e.g. http://localhost:3000) for magic links in dev */
  clientOrigin?: string;
}

export interface ConfirmResponse {
  success: boolean;
  booking: {
    id: string;
    status: string;
    scheduledAt: string;
    doctorId: string | null;
    doctorName: string | null;
    appointmentType: string;
    selectedPlan: string | null;
    calendarEventId: string | null;
  };
  calendarEvent: {
    id: string;
    title: string;
    description: string;
    htmlLink?: string | null;
    calendarId?: string | null;
  };
  calendarWarning?: string;
  message: string;
  magicLink?: string; // Magic link for portal access without password
}

// UAT8-GAP-007: Create admin exception task for calendar failures
async function createCalendarFailureException(
  userId: string | null,
  bookingId: string,
  doctorId: string | null,
  doctorName: string | null,
  scheduledAt: Date,
  patientName: string,
  patientPhone: string | null,
  errorMessage: string
): Promise<void> {
  console.error(`[CALENDAR] Creating admin exception for calendar failure:`, {
    bookingId,
    doctorId,
    errorMessage,
  });

  try {
    // Find an admin user to assign the task
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admin) {
      // Create urgent notification
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "ALERT",
          title: "🚨 Doctor Calendar Event Creation Failed",
          message: `Booking confirmed but calendar event could not be created automatically.

**BOOKING DETAILS:**
• Booking ID: ${bookingId}
• Patient: ${patientName}
• Phone: ${patientPhone || "Not provided"}
• Doctor: ${doctorName || "Not assigned"}
• Date: ${scheduledAt.toLocaleString("en-AU", { timeZone: CLINIC_TIMEZONE })}

**ERROR:** ${errorMessage}

**ACTION REQUIRED:** Manually create calendar event for the doctor.`,
          isRead: false,
        },
      });

      // Create care communication task for tracking
      await prisma.careCommunication.create({
        data: {
          userId: userId || admin.id,
          type: "ADMIN_TASK",
          priority: "HIGH",
          subject: `⚠️ Manual Calendar Event Required: ${patientName}`,
          notes: `Booking was confirmed but Google Calendar event creation failed.

**Details:**
• Booking ID: ${bookingId}
• Patient: ${patientName}
• Phone: ${patientPhone || "Not provided"}
• Doctor: ${doctorName || doctorId || "Not assigned"}
• Scheduled: ${scheduledAt.toLocaleString("en-AU", { timeZone: CLINIC_TIMEZONE, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}

**Error:** ${errorMessage}

**Action:** Create calendar event manually in doctor's calendar with:
1. Patient name and phone number
2. Appointment time
3. Doctor brief URL (see booking record)
4. Mark as phone consultation`,
          status: "PENDING",
          dueDate: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000), // Due 24h before appointment
          assignedTo: admin.id,
        },
      });
    }

    // Log activity for audit trail
    await prisma.activityLog.create({
      data: {
        userId: userId || undefined,
        action: "CALENDAR_EVENT_FAILED",
        entity: "consultation_booking",
        entityId: bookingId,
        details: {
          doctorId,
          doctorName,
          scheduledAt: scheduledAt.toISOString(),
          error: errorMessage,
          requiresManualCreation: true,
        },
      },
    });

    // Create internal note on booking if user exists
    if (userId) {
      await prisma.internalNote.create({
        data: {
          userId,
          category: "GENERAL",
          title: "Calendar Event Creation Failed",
          content: `Booking ${bookingId} was confirmed but calendar event could not be created: ${errorMessage}. Manual calendar entry required.`,
          createdBy: "system",
          isPinned: true,
        },
      });
    }
  } catch (e) {
    console.error("[CALENDAR] Failed to create calendar exception:", e);
  }
}

// Generate magic login link for portal access
function generateMagicLink(
  userId: string,
  email: string,
  options?: { request?: NextRequest; clientOrigin?: string }
): string {
  const token = signMagicLoginToken(userId, email);

  const baseUrl = resolveAppBaseUrl({
    clientOrigin: options?.clientOrigin,
    request: options?.request,
  });

  return `${baseUrl}/auth/magic?token=${token}`;
}

function formatPatientAppointmentTime(
  scheduledAt: Date,
  patientTimezone: string
): { formatted: string; clinicFootnote?: string } {
  const abbrev = getTimezoneAbbreviation(patientTimezone, scheduledAt);
  const formatted = scheduledAt.toLocaleString("en-AU", {
    timeZone: patientTimezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const withTz = abbrev ? `${formatted} (${abbrev})` : formatted;

  if (isSameTimezone(patientTimezone, CLINIC_TIMEZONE)) {
    return { formatted: withTz };
  }

  const clinicFormatted = scheduledAt.toLocaleString("en-AU", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return {
    formatted: withTz,
    clinicFootnote: `Clinic time (Sydney): ${clinicFormatted}`,
  };
}

// UAT8-GAP-013: Send confirmation email - properly wired up
async function sendConfirmationEmail(
  email: string,
  data: {
    firstName: string;
    scheduledAt: Date;
    doctorName: string;
    selectedPlan: string;
    magicLink?: string;
    patientTimezone?: string;
  }
): Promise<void> {
  const tz = data.patientTimezone ?? CLINIC_TIMEZONE;
  const { formatted, clinicFootnote } = formatPatientAppointmentTime(data.scheduledAt, tz);

  const planDisplay = data.selectedPlan?.toUpperCase() === "PRECISION"
    ? "Sanative Precision"
    : "Sanative Core";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const portalCtaHref = data.magicLink
    ? buildPortalActivationMagicLink(data.magicLink)
    : `${baseUrl}${WM_POST_CHECKOUT_PATH}`;

  try {
    await sendEmail({
      to: email,
      subject: `Your Sanative consultation is confirmed for ${data.scheduledAt.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: tz })}`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3628;">Hi ${data.firstName},</h2>

          <p style="color: #2c3628; font-size: 16px;">Great news! Your Weight Management consultation is confirmed.</p>

          <div style="background: #f4f7f2; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #2c3628; margin-top: 0;">Appointment Details</h3>
            <table style="width: 100%; color: #5c7a52;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Date & Time:</td>
                <td style="padding: 8px 0;">${formatted}${clinicFootnote ? `<br><span style="font-size: 13px; color: #7e9a72;">${clinicFootnote}</span>` : ""}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Doctor:</td>
                <td style="padding: 8px 0;">${data.doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Type:</td>
                <td style="padding: 8px 0;">Phone consultation (we'll call you)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Plan:</td>
                <td style="padding: 8px 0;">${planDisplay}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #2c3628;">What happens next?</h3>
          <ol style="color: #5c7a52; line-height: 1.8;">
            <li>Activate your portal to follow your program journey</li>
            <li>Our care team will review your health assessment</li>
            <li>Your doctor will call you at your scheduled time</li>
            <li>If clinically appropriate, your doctor will discuss next steps for your care plan</li>
          </ol>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Please ensure your phone is available</strong> at your appointment time. If you need to reschedule, please do so at least 24 hours in advance.
            </p>
          </div>

          <div style="margin: 32px 0;">
            <a href="${portalCtaHref}" style="display: inline-block; background: #5c7a52; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Activate my portal
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Use the button above to set your password and open your weight program home. Progress tracking unlocks once your doctor confirms your care plan. This link is valid for 7 days.
          </p>

          <p style="color: #666; font-size: 14px;">
            Questions? Reply to this email or contact our care team at support@sanative.com.au
          </p>

          <p style="color: #2c3628; margin-top: 32px;">
            The Sanative Health Team
          </p>
        </div>
      `,
    });
    console.log(`[EMAIL] Booking confirmation sent to ${email}`);
  } catch (error) {
    console.error(`[EMAIL] Failed to send booking confirmation to ${email}:`, error);
    // Don't throw - email failure shouldn't fail the booking
  }
}

// UAT8-GAP-013: Send confirmation SMS - properly wired up
async function sendConfirmationSMS(
  phone: string,
  userId: string | null,
  data: {
    firstName: string;
    scheduledAt: Date;
    doctorName: string;
    patientTimezone?: string;
  }
): Promise<void> {
  const tz = data.patientTimezone ?? CLINIC_TIMEZONE;
  const { formatted } = formatPatientAppointmentTime(data.scheduledAt, tz);

  const message = `Hi ${data.firstName}, your Sanative consultation is confirmed for ${formatted} with ${data.doctorName}. We'll call you at this number. Reply STOP to opt out.`;

  try {
    // Queue SMS via SMSNotification model (processed by SMS API)
    // Note: recipientId is required, so we use a placeholder if userId is null
    const smsData: {
      recipientId: string;
      recipientPhone: string;
      message: string;
      status: "PENDING" | "SENT" | "FAILED" | "DELIVERED";
      provider: string;
    } = {
      recipientId: userId || "anonymous-booking",
      recipientPhone: phone,
      message,
      status: "PENDING",
      provider: process.env.SMS_PROVIDER || "mock",
    };

    await prisma.sMSNotification.create({ data: smsData });
    console.log(`[SMS] Booking confirmation queued for ${phone}`);
  } catch (error) {
    console.error(`[SMS] Failed to queue booking confirmation for ${phone}:`, error);
    // Don't throw - SMS failure shouldn't fail the booking
  }
}

// GAP-032: Create urgent admin exception task when booking fails
async function createAdminException(
  userId: string | null,
  paymentIntentId: string,
  originalBookingId: string,
  errorMessage: string
): Promise<void> {
  console.error(`[URGENT] Admin exception created for booking failure:`, {
    userId,
    paymentIntentId,
    originalBookingId,
    errorMessage,
  });

  // Create an internal notification for admins
  try {
    // Find an admin user to assign the task
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "ALERT",
          title: "🚨 URGENT: Booking Confirmation Failed After Payment",
          message: `Payment succeeded but booking confirmation failed. Patient may be left without a booking.

Payment Intent: ${paymentIntentId}
Original Booking ID: ${originalBookingId}
User ID: ${userId || "Unknown"}
Error: ${errorMessage}

ACTION REQUIRED: Manually confirm booking or assign next available slot.`,
          isRead: false,
        },
      });
    }

    // Also create an internal note on the user record if available
    if (userId) {
      await prisma.internalNote.create({
        data: {
          userId,
          category: "GENERAL",
          title: "Booking Confirmation Failed After Payment",
          content: `Payment succeeded (${paymentIntentId}) but booking confirmation failed: ${errorMessage}. Manual intervention required.`,
          createdBy: "system",
          isPinned: true,
        },
      });
    }
  } catch (e) {
    console.error("Failed to create admin exception:", e);
  }
}

// GAP-032: Try to assign next equivalent slot if original fails
async function assignNextAvailableSlot(
  originalBooking: {
    scheduledAt: Date;
    doctorId: string | null;
    selectedPlan: string | null;
    userId: string | null;
    patientPhone: string | null;
    patientBmi: number | null;
    riskFlags: string[];
    intakeId: string | null;
  },
  paymentIntentId: string
): Promise<{ success: boolean; newBookingId?: string; error?: string }> {
  try {
    // Find next available slot within 7 days
    const now = new Date();
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find slots that are not booked
    const bookedSlots = await prisma.consultationBooking.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: maxDate,
        },
        status: {
          in: ["SLOT_HELD", "BOOKING_CONFIRMED"],
        },
      },
      select: {
        scheduledAt: true,
        doctorId: true,
      },
    });

    const bookedSlotKeys = new Set(
      bookedSlots.map(s => `${s.doctorId || "any"}_${s.scheduledAt.getTime()}`)
    );

    // Generate potential slots for next 7 days
    const potentialSlots: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day + 1);

      // Only Thu, Fri, Sat
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 4 && dayOfWeek !== 5 && dayOfWeek !== 6) continue;

      // 9am to 7pm
      for (let hour = 9; hour < 19; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, minute, 0, 0);
          if (slotTime > now) {
            potentialSlots.push(slotTime);
          }
        }
      }
    }

    // Find first available slot
    for (const slot of potentialSlots) {
      const slotKey = `${originalBooking.doctorId || "any"}_${slot.getTime()}`;
      if (!bookedSlotKeys.has(slotKey)) {
        // Create new booking
        const newBooking = await prisma.consultationBooking.create({
          data: {
            userId: originalBooking.userId || undefined,
            bookingType: "initial_consultation",
            scheduledAt: slot,
            duration: 30,
            status: "BOOKING_CONFIRMED",
            paymentIntentId,
            selectedPlan: originalBooking.selectedPlan,
            doctorId: originalBooking.doctorId,
            appointmentType: "PHONE_CONSULT",
            patientPhone: originalBooking.patientPhone,
            patientBmi: originalBooking.patientBmi,
            riskFlags: originalBooking.riskFlags,
            intakeId: originalBooking.intakeId,
            notes: "Auto-assigned slot due to original booking confirmation failure.",
          },
        });

        return { success: true, newBookingId: newBooking.id };
      }
    }

    return { success: false, error: "No available slots in next 7 days" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function syncWeightManagementIntakeAfterPayment(
  userId: string,
  bookingId: string,
  paymentIntentId: string,
  scheduledAt: Date,
  selectedPlan?: string | null
): Promise<string | null> {
  const intake = await prisma.weightManagementIntake.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!intake) return null;

  const plan = selectedPlan?.toUpperCase() === "PRECISION" ? "PRECISION" : "CORE";
  const paymentAmount = plan === "PRECISION" ? 39900 : 24900;

  await prisma.weightManagementIntake.update({
    where: { id: intake.id },
    data: {
      paymentStatus: "PAID",
      paymentIntentId,
      paymentAmount,
      paidAt: new Date(),
      bookingId,
      bookingStatus: "CONFIRMED",
      scheduledAt,
      selectedPlan: plan,
    },
  });

  await prisma.consultationBooking.update({
    where: { id: bookingId },
    data: { intakeId: intake.id },
  });

  return intake.id;
}

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmRequest = await req.json();
    const {
      bookingHoldId,
      paymentIntentId,
      consentRecordId,
      userId: bodyUserId,
      sessionId,
      selectedPlan,
      clientOrigin,
    } = body;

    const magicLinkOptions = { request: req, clientOrigin };

    // Verify session or user ID
    let userId = bodyUserId;

    if (!userId && sessionId) {
      try {
        const tokenData = verify(sessionId, JWT_SECRET) as { userId: string | null };
        userId = tokenData.userId || undefined;
      } catch {
        // Session verification failed
      }
    }

    // Validate required fields
    if (!bookingHoldId) {
      return NextResponse.json(
        { error: "Booking hold ID is required" },
        { status: 400 }
      );
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    if (!consentRecordId) {
      return NextResponse.json(
        { error: "Payment consent is required before confirming booking" },
        { status: 400 }
      );
    }

    // Find the booking hold
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingHoldId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking hold not found" },
        { status: 404 }
      );
    }

    const bookingUserId = userId || booking.userId;

    if (!bookingUserId) {
      return NextResponse.json(
        { error: "User is required to confirm a paid booking" },
        { status: 400 }
      );
    }

    if (userId && booking.userId && booking.userId !== userId) {
      return NextResponse.json(
        { error: "Booking does not belong to this user" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: bookingUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        timezone: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const consultProgram = resolvePublicConsultProgramFromContext({
      subscriptionTier: user.subscriptionTier,
      bookingNotes: booking.notes,
    });
    const programLabel = consultProgram.label;

    const consentVerification = await validatePrePaymentConsent({
      consentRecordId,
      userId: bookingUserId,
      email: user.email,
    });

    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const isOrganCareBooking = (booking.notes || "").includes("Organ & Metabolic Care");
    // Hair Advanced funnel books as Hair Loss but pays with a biomarkers PaymentIntent.
    const isBiomarkersBooking =
      isBiomarkersPanelBookingNotes(booking.notes) ||
      (Array.isArray(booking.riskFlags) && booking.riskFlags.includes("BIOMARKERS_PANEL"));

    const paymentVerification = isOrganCareBooking
      ? await (async () => {
          const organCarePayment = await verifyOrganCareMembershipBookingPayment({
            paymentIntentId,
            userId: bookingUserId,
            bookingHoldId,
          });
          if (!organCarePayment.ok) {
            return organCarePayment;
          }
          return {
            paymentIntent: organCarePayment.paymentIntent,
            expectedAmountCents: organCarePayment.paymentIntent.amount,
            normalizedPlan: null,
            bookingId: bookingHoldId,
          };
        })()
      : isBiomarkersBooking
        ? await (async () => {
            const biomarkersPayment = await verifyBiomarkersPanelBookingPayment({
              paymentIntentId,
              userId: bookingUserId,
              bookingHoldId,
            });
            if (!biomarkersPayment.ok) {
              return biomarkersPayment;
            }
            return {
              paymentIntent: biomarkersPayment.paymentIntent,
              expectedAmountCents: biomarkersPayment.paymentIntent.amount,
              normalizedPlan: null,
              bookingId: bookingHoldId,
            };
          })()
        : await verifyFirstMonthPaymentForBooking({
            paymentIntentId,
            userId: bookingUserId,
            bookingHoldId,
            selectedPlan: selectedPlan || booking.selectedPlan,
          });

    if ("error" in paymentVerification) {
      return NextResponse.json(
        { error: paymentVerification.error },
        { status: paymentVerification.status }
      );
    }

    // Verify the booking is still on hold
    const now = new Date();
    if (booking.status !== "SLOT_HELD") {
      return NextResponse.json(
        { error: "Booking is not in held status" },
        { status: 400 }
      );
    }

    // Check if hold has expired
    if (booking.holdExpiresAt && booking.holdExpiresAt <= now) {
      // GAP-032: Handle expired hold atomically
      // Try to find next available slot since payment succeeded
      const fallbackResult = await assignNextAvailableSlot(
        {
          scheduledAt: booking.scheduledAt,
          doctorId: booking.doctorId,
          selectedPlan: selectedPlan || booking.selectedPlan,
          userId: userId || booking.userId,
          patientPhone: booking.patientPhone,
          patientBmi: booking.patientBmi,
          riskFlags: booking.riskFlags,
          intakeId: booking.intakeId,
        },
        paymentIntentId
      );

      if (fallbackResult.success && fallbackResult.newBookingId) {
        // Mark original as cancelled
        await prisma.consultationBooking.update({
          where: { id: bookingHoldId },
          data: { status: "BOOKING_CANCELLED" },
        });

        // Return the new booking
        const newBooking = await prisma.consultationBooking.findUnique({
          where: { id: fallbackResult.newBookingId },
        });

        if (newBooking) {
          return NextResponse.json({
            success: true,
            booking: {
              id: newBooking.id,
              status: newBooking.status,
              scheduledAt: newBooking.scheduledAt.toISOString(),
              doctorId: newBooking.doctorId,
              doctorName: newBooking.doctorName,
              appointmentType: newBooking.appointmentType,
              selectedPlan: newBooking.selectedPlan,
              calendarEventId: null,
            },
            calendarEvent: {
              id: "",
              title: "",
              description: "",
            },
            message: `Your original time slot expired, but we've automatically assigned you the next available slot. Your consultation is now confirmed.`,
          });
        }
      }

      // If fallback also failed, create admin exception
      await createAdminException(
        userId || booking.userId,
        paymentIntentId,
        bookingHoldId,
        "Hold expired and no fallback slot available"
      );

      return NextResponse.json(
        {
          error: "Booking hold has expired. Our team has been notified and will contact you shortly to reschedule.",
          adminNotified: true,
        },
        { status: 410 }
      );
    }

    // Get patient name
    const patientName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || "Patient";

    // GAP-013: Create doctor brief URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
    const doctorBriefUrl = booking.intakeId
      ? `${baseUrl}/admin/doctor/brief/${booking.intakeId}`
      : bookingUserId
      ? `${baseUrl}/admin/doctor/brief/${bookingUserId}`
      : null;

    // GAP-013: Create calendar event with all required fields
    const calendarTitle = `Sanative ${programLabel} Phone Consult — ${patientName}`;

    // UAT8-GAP-007: Get doctor's email for calendar integration
    let doctorEmail: string | null = null;
    if (booking.doctorId) {
      const doctor = await prisma.user.findUnique({
        where: { id: booking.doctorId },
        select: { email: true },
      });
      doctorEmail = doctor?.email || null;
    }

    // GAP-013 + UAT8-GAP-007: Create actual calendar event using Google Calendar API
    const endTime = new Date(booking.scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + (booking.duration || 30));

    const calendarEventData: CalendarEventData = {
      doctorId: booking.doctorId,
      doctorEmail,
      title: calendarTitle,
      description: "", // Will be built by the calendar service
      startTime: booking.scheduledAt,
      endTime,
      patientName,
      patientPhone: booking.patientPhone || user?.phone || null,
      patientEmail: user?.email || null,
      selectedPlan: selectedPlan || booking.selectedPlan,
      appointmentType: booking.appointmentType || "PHONE_CONSULT",
      doctorBriefUrl,
      paymentStatus: "PAID",
      intakeId: booking.intakeId,
      riskFlags: booking.riskFlags,
      patientBmi: booking.patientBmi,
      bookingId: booking.id,
    };

    // UAT8-GAP-007: Create calendar event with real Google Calendar integration
    const calendarResult: CalendarEventResult = await createGoogleCalendarEvent(calendarEventData);

    // Extract event ID (may be placeholder if calendar creation failed)
    const calendarEventId = calendarResult.eventId;
    let calendarWarning: string | undefined;

    // UAT8-GAP-007: Handle calendar creation failure
    // IMPORTANT: Booking still proceeds if calendar fails (payment succeeded)
    if (!calendarResult.success || calendarResult.requiresManualCreation) {
      console.error(`[CALENDAR] Event creation failed or requires manual creation:`, calendarResult.error);

      // Create admin exception task for manual calendar creation
      await createCalendarFailureException(
        bookingUserId || null,
        booking.id,
        booking.doctorId,
        booking.doctorName,
        booking.scheduledAt,
        patientName,
        booking.patientPhone || user?.phone || null,
        calendarResult.error || "Unknown calendar error"
      );

      calendarWarning = `Calendar event could not be created automatically. Admin has been notified. ${calendarResult.error || ""}`;
    }

    // GAP-032: Use transaction for atomic update
    let updatedBooking;
    try {
      updatedBooking = await prisma.$transaction(async (tx) => {
        // Update the booking to confirmed status
        const confirmed = await tx.consultationBooking.update({
          where: { id: bookingHoldId },
          data: {
            status: "BOOKING_CONFIRMED",
            paymentIntentId,
            selectedPlan: selectedPlan || booking.selectedPlan,
            holdExpiresAt: null,
            calendarEventId,
            doctorBriefUrl,
            ...(bookingUserId && !booking.userId ? { userId: bookingUserId } : {}),
          },
        });

        // Update user journey status
        if (bookingUserId) {
          await tx.user.update({
            where: { id: bookingUserId },
            data: { journeyStatus: "CONSULTATION_PAID", memberStatus: "MEMBER" },
          });

          // Remove any other abandoned holds / cancelled attempts for this patient
          await tx.consultationBooking.deleteMany({
            where: {
              userId: bookingUserId,
              id: { not: bookingHoldId },
              status: { in: ["SLOT_HELD", "BOOKING_CANCELLED"] },
            },
          });
        }

        return confirmed;
      });
    } catch (txError) {
      // GAP-032: If transaction fails after payment, create admin exception
      await createAdminException(
        bookingUserId || null,
        paymentIntentId,
        bookingHoldId,
        `Transaction failed: ${String(txError)}`
      );

      // Try fallback slot assignment
      const fallbackResult = await assignNextAvailableSlot(
        {
          scheduledAt: booking.scheduledAt,
          doctorId: booking.doctorId,
          selectedPlan: selectedPlan || booking.selectedPlan,
          userId: bookingUserId,
          patientPhone: booking.patientPhone,
          patientBmi: booking.patientBmi,
          riskFlags: booking.riskFlags,
          intakeId: booking.intakeId,
        },
        paymentIntentId
      );

      if (fallbackResult.success) {
        return NextResponse.json({
          success: true,
          warning: "Original slot confirmation failed, assigned to next available slot",
          booking: { id: fallbackResult.newBookingId },
        });
      }

      return NextResponse.json(
        {
          error: "Booking confirmation failed. Our team has been notified and will contact you shortly.",
          adminNotified: true,
        },
        { status: 500 }
      );
    }

    // Log activity
    if (bookingUserId) {
      await syncEntitlementsFromSignals(bookingUserId).catch((err) => {
        console.error("[bookings/confirm] entitlement sync failed:", err);
      });

      // B1: grant clinically required panel at payment (consult-first Starts).
      // Biomarkers / Organ Care checkouts grant via their own purchase paths.
      if (!isOrganCareBooking && !isBiomarkersBooking) {
        try {
          const panelContext = await resolvePanelGrantContext(
            bookingUserId,
            consultProgram
          );
          await grantProgramPanelEntitlementsAtPayment({
            userId: bookingUserId,
            paymentIntentId,
            programKey: panelContext.programKey,
            publicPanelTier: panelContext.publicPanelTier,
            billingPanelTier: panelContext.billingPanelTier,
            sourceProgram: panelContext.sourceProgram,
            source: "public_consult_booking",
          });
        } catch (panelGrantError) {
          console.error(
            "[bookings/confirm] program panel entitlement grant failed:",
            panelGrantError
          );
        }
      }

      await prisma.activityLog.create({
        data: {
          userId: bookingUserId,
          action: "CONSULTATION_CONFIRMED",
          entity: "consultation_booking",
          entityId: booking.id,
          details: {
            paymentIntentId,
            selectedPlan: updatedBooking.selectedPlan,
            scheduledAt: booking.scheduledAt.toISOString(),
            doctorId: booking.doctorId,
            doctorName: booking.doctorName,
            calendarEventId,
          },
        },
      });

      // Fallback: Create invoice and subscription if webhook hasn't already
      // This handles cases where Stripe webhook doesn't fire (test mode, preview env, etc.)
      try {
        // Check if invoice already exists for this payment
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            OR: [
              { stripeId: paymentIntentId },
              { userId: bookingUserId, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } }, // Within last 5 mins
            ],
          },
        });

        if (!existingInvoice) {
          // Determine amount based on plan
          const planSelected = selectedPlan || updatedBooking.selectedPlan;
          const amount = consultProgram.isWeightManagement
            ? planSelected?.toUpperCase() === "PRECISION"
              ? 399
              : 249
            : consultProgram.firstMonthAud;

          await prisma.invoice.create({
            data: {
              userId: bookingUserId,
              stripeId: paymentIntentId,
              amount,
              currency: "AUD",
              status: "PAID",
              paidAt: new Date(),
              paymentMethod: "card",
              description: consultProgram.isWeightManagement
                ? `Weight Management - First Month (${planSelected || "Core"} Plan)`
                : consultProgram.invoiceDescription,
            },
          });
          console.log(`[Booking Confirm] Created fallback invoice for user ${bookingUserId}`);
        }

        // UAT8-GAP-004: Do NOT create MembershipSubscription here
        // Subscription should only be created AFTER doctor approval
        // The Invoice record above tracks the first-month payment
        // The actual recurring subscription is created in:
        // - /api/admin/doctor/decision (after APPROVED decision)
        // - Stripe webhook (for ongoing billing after approval)
        console.log(`[Booking Confirm] Payment recorded. Subscription will be created after doctor approval.`);

        // Update user's journey status - payment received, pending doctor review
        const programGender =
          genderForPublicConsultSlug(consultProgram.slug) ??
          genderForSubscriptionTier(consultProgram.subscriptionTier);

        await prisma.user.update({
          where: { id: bookingUserId },
          data: {
            subscriptionTier: consultProgram.subscriptionTier,
            subscriptionStatus: "INACTIVE", // UAT8-GAP-004: Remains INACTIVE until doctor approval
            journeyStatus: "CONSULTATION_PAID", // Payment received, awaiting consultation
            memberStatus: "MEMBER",
            ...(programGender ? { gender: programGender } : {}),
          },
        });
      } catch (fallbackError) {
        console.error("[Booking Confirm] Fallback invoice/subscription creation failed:", fallbackError);
        // Don't fail the booking confirmation if fallback fails
      }
    }

    if (bookingUserId) {
      let intakeId: string | null = booking.intakeId;
      if (consultProgram.isWeightManagement) {
        intakeId = await syncWeightManagementIntakeAfterPayment(
          bookingUserId,
          booking.id,
          paymentIntentId,
          booking.scheduledAt,
          selectedPlan || updatedBooking.selectedPlan
        );
      }

      await createProgramPreTriageTask({
        userId: bookingUserId,
        bookingId: booking.id,
        patientName,
        scheduledAt: booking.scheduledAt,
        intakeId: intakeId || booking.intakeId,
        program: resolvePreTriageProgramForBooking({
          subscriptionTier: user.subscriptionTier,
          bookingNotes: booking.notes,
          paymentMetadata: paymentVerification.paymentIntent.metadata ?? {},
        }),
      });

      if (!consultProgram.isWeightManagement) {
        const programMember = await prisma.programMember.findFirst({
          where: { userId: bookingUserId },
          select: { program: true, intakeData: true },
          orderBy: { createdAt: "desc" },
        });
        if (programMember?.intakeData) {
          await savePublicFunnelQuizFromIntake({
            userId: bookingUserId,
            program: programMember.program,
            intakeData: programMember.intakeData as Record<string, unknown>,
          }).catch((err) => {
            console.error("[bookings/confirm] public funnel quiz save failed:", err);
          });
        }
      }
    }

    const patientTimezone = user?.timezone ?? CLINIC_TIMEZONE;

    // Send confirmation email with magic link for portal access
    if (user?.email && bookingUserId) {
      const magicLink = generateMagicLink(bookingUserId, user.email, magicLinkOptions);
      await sendConfirmationEmail(user.email, {
        firstName: user.firstName || "there",
        scheduledAt: booking.scheduledAt,
        doctorName: booking.doctorName || "your doctor",
        selectedPlan: updatedBooking.selectedPlan || "your selected plan",
        magicLink,
        patientTimezone,
      });
    } else if (user?.email) {
      await sendConfirmationEmail(user.email, {
        firstName: user.firstName || "there",
        scheduledAt: booking.scheduledAt,
        doctorName: booking.doctorName || "your doctor",
        selectedPlan: updatedBooking.selectedPlan || "your selected plan",
        patientTimezone,
      });
    }

    // Send confirmation SMS
    const phone = booking.patientPhone || user?.phone;
    if (phone) {
      await sendConfirmationSMS(phone, bookingUserId || null, {
        firstName: user?.firstName || "there",
        scheduledAt: booking.scheduledAt,
        doctorName: booking.doctorName || "your doctor",
        patientTimezone,
      });
    }

    // Format the response
    const { formatted: formattedDate } = formatPatientAppointmentTime(
      booking.scheduledAt,
      patientTimezone
    );

    // Generate magic link for portal access
    const portalMagicLink = bookingUserId && user?.email
      ? generateMagicLink(bookingUserId, user.email, magicLinkOptions)
      : undefined;

    // UAT8-GAP-007: Build response with calendar details
    const response: ConfirmResponse = {
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        scheduledAt: booking.scheduledAt.toISOString(),
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        appointmentType: booking.appointmentType,
        selectedPlan: updatedBooking.selectedPlan,
        calendarEventId: calendarEventId || null,
      },
      calendarEvent: {
        id: calendarEventId || "",
        title: calendarTitle,
        description: calendarResult.success ? "Event created successfully" : "Event creation failed - see calendarWarning",
        htmlLink: calendarResult.htmlLink || null,
        calendarId: calendarResult.calendarId || null,
      },
      // UAT8-GAP-007: Include warning if calendar failed (but booking still succeeded)
      ...(calendarWarning ? { calendarWarning } : {}),
      message: `Your consultation is confirmed for ${formattedDate} with ${booking.doctorName || "your doctor"}. You will receive a phone call at the scheduled time.`,
      // Include magic link so thank you screen can redirect user to portal
      ...(portalMagicLink ? { magicLink: portalMagicLink } : {}),
    };

    // Log calendar event details for audit
    if (bookingUserId && calendarResult.success) {
      await prisma.activityLog.create({
        data: {
          userId: bookingUserId,
          action: "CALENDAR_EVENT_CREATED",
          entity: "consultation_booking",
          entityId: booking.id,
          details: {
            calendarEventId: calendarResult.eventId,
            calendarId: calendarResult.calendarId,
            htmlLink: calendarResult.htmlLink,
          },
        },
      }).catch(console.error);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error confirming booking:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}

// GET endpoint to check booking confirmation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const paymentIntentId = searchParams.get("paymentIntentId");

    if (!bookingId && !paymentIntentId) {
      return NextResponse.json(
        { error: "Booking ID or Payment Intent ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.consultationBooking.findFirst({
      where: bookingId
        ? { id: bookingId }
        : { paymentIntentId: paymentIntentId! },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        doctorId: true,
        doctorName: true,
        appointmentType: true,
        selectedPlan: true,
        calendarEventId: true,
        paymentIntentId: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        isConfirmed: booking.status === "BOOKING_CONFIRMED",
        scheduledAt: booking.scheduledAt.toISOString(),
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        appointmentType: booking.appointmentType,
        selectedPlan: booking.selectedPlan,
        calendarEventId: booking.calendarEventId,
        paymentIntentId: booking.paymentIntentId,
      },
    });
  } catch (error) {
    console.error("Error checking booking status:", error);
    return NextResponse.json(
      { error: "Failed to check booking status" },
      { status: 500 }
    );
  }
}
