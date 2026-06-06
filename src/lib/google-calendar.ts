/**
 * UAT8-GAP-007: Google Calendar Integration for Doctor Appointments
 *
 * This module handles creating calendar events for doctor consultations.
 * Uses Google Calendar API v3 with service account authentication.
 *
 * Environment variables required:
 * - GOOGLE_CALENDAR_CREDENTIALS: Base64-encoded service account JSON key
 * - GOOGLE_CALENDAR_FALLBACK_ID: Fallback calendar ID for events without doctor assignment
 *
 * Each doctor can have their own calendar linked via email/calendar ID.
 */

import { google, calendar_v3 } from "googleapis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarEventData {
  doctorId: string | null;
  doctorEmail: string | null;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  patientName: string;
  patientPhone: string | null;
  patientEmail?: string | null;
  selectedPlan: string | null;
  appointmentType: string;
  doctorBriefUrl: string | null;
  paymentStatus: string;
  intakeId: string | null;
  riskFlags: string[];
  patientBmi: number | null;
  bookingId: string;
}

export interface CalendarEventResult {
  success: boolean;
  eventId: string | null;
  calendarId: string | null;
  htmlLink: string | null;
  error: string | null;
  requiresManualCreation: boolean;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const TIMEZONE = "Australia/Sydney";
const FALLBACK_CALENDAR_ID = process.env.GOOGLE_CALENDAR_FALLBACK_ID || "primary";

// Check if Google Calendar is configured
function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CALENDAR_CREDENTIALS);
}

// Get Google Calendar client with service account authentication
function getCalendarClient(): calendar_v3.Calendar | null {
  try {
    if (!process.env.GOOGLE_CALENDAR_CREDENTIALS) {
      console.warn("[Google Calendar] GOOGLE_CALENDAR_CREDENTIALS not set");
      return null;
    }

    // Decode base64 credentials
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CALENDAR_CREDENTIALS, "base64").toString("utf-8")
    );

    // Create JWT auth client
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    // Return calendar client
    return google.calendar({ version: "v3", auth });
  } catch (error) {
    console.error("[Google Calendar] Failed to initialize client:", error);
    return null;
  }
}

// ─── Calendar Event Creation ──────────────────────────────────────────────────

/**
 * Create a calendar event for a doctor consultation
 *
 * UAT8-GAP-007: This function:
 * 1. Attempts to create event on doctor's personal calendar (if linked)
 * 2. Falls back to shared Sanative calendar if doctor calendar fails
 * 3. Returns detailed result including error info if creation fails
 * 4. Never throws - always returns a result object
 */
export async function createDoctorCalendarEvent(
  data: CalendarEventData
): Promise<CalendarEventResult> {
  const {
    doctorId,
    doctorEmail,
    title,
    description,
    startTime,
    endTime,
    patientName,
    patientPhone,
    appointmentType,
    doctorBriefUrl,
    paymentStatus,
    intakeId,
    riskFlags,
    patientBmi,
    selectedPlan,
    bookingId,
  } = data;

  // Check if Google Calendar is configured
  if (!isGoogleCalendarConfigured()) {
    console.log("[Google Calendar] Not configured, returning placeholder ID");
    return {
      success: false,
      eventId: `placeholder_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      calendarId: null,
      htmlLink: null,
      error: "Google Calendar not configured (GOOGLE_CALENDAR_CREDENTIALS not set)",
      requiresManualCreation: true,
    };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return {
      success: false,
      eventId: null,
      calendarId: null,
      htmlLink: null,
      error: "Failed to initialize Google Calendar client",
      requiresManualCreation: true,
    };
  }

  // Build detailed event description
  const eventDescription = buildEventDescription({
    patientName,
    patientPhone,
    selectedPlan,
    patientBmi,
    riskFlags,
    doctorBriefUrl,
    paymentStatus,
    intakeId,
    appointmentType,
    bookingId,
  });

  // Build Google Calendar event object
  const event: calendar_v3.Schema$Event = {
    summary: title,
    description: eventDescription,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: TIMEZONE,
    },
    // Add conferencing data for phone consultation
    conferenceData: undefined, // Phone call, not video
    // Add reminders
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 }, // 1 hour before
        { method: "popup", minutes: 15 }, // 15 minutes before
      ],
    },
    // Add metadata as extended properties
    extendedProperties: {
      private: {
        sanativeBookingId: bookingId,
        sanativeDoctorId: doctorId || "",
        sanativeIntakeId: intakeId || "",
        sanativeAppointmentType: appointmentType,
        sanativePaymentStatus: paymentStatus,
        sanativeSelectedPlan: selectedPlan || "",
      },
    },
    // Color coding: Weight Management = green (ID 10)
    colorId: "10",
  };

  // Try to create on doctor's calendar first
  const targetCalendarId = doctorEmail || FALLBACK_CALENDAR_ID;
  let triedDoctorCalendar = false;

  if (doctorEmail && doctorEmail !== FALLBACK_CALENDAR_ID) {
    triedDoctorCalendar = true;
    try {
      console.log(`[Google Calendar] Creating event on doctor calendar: ${doctorEmail}`);

      const response = await calendar.events.insert({
        calendarId: doctorEmail,
        requestBody: event,
        sendUpdates: "all", // Notify attendees
      });

      if (response.data.id) {
        console.log(`[Google Calendar] Event created successfully: ${response.data.id}`);
        return {
          success: true,
          eventId: response.data.id,
          calendarId: doctorEmail,
          htmlLink: response.data.htmlLink || null,
          error: null,
          requiresManualCreation: false,
        };
      }
    } catch (doctorCalendarError) {
      console.error(`[Google Calendar] Failed to create on doctor calendar:`, doctorCalendarError);
      // Fall through to fallback calendar
    }
  }

  // Try fallback calendar
  try {
    console.log(`[Google Calendar] Creating event on fallback calendar: ${FALLBACK_CALENDAR_ID}`);

    // Add note if this is a fallback
    if (triedDoctorCalendar) {
      event.description = `⚠️ NOTE: Event created on fallback calendar (doctor calendar unavailable)\n\n${event.description}`;
    }

    const response = await calendar.events.insert({
      calendarId: FALLBACK_CALENDAR_ID,
      requestBody: event,
      sendUpdates: "none",
    });

    if (response.data.id) {
      console.log(`[Google Calendar] Event created on fallback: ${response.data.id}`);
      return {
        success: true,
        eventId: response.data.id,
        calendarId: FALLBACK_CALENDAR_ID,
        htmlLink: response.data.htmlLink || null,
        error: triedDoctorCalendar ? "Created on fallback calendar (doctor calendar unavailable)" : null,
        requiresManualCreation: false,
      };
    }
  } catch (fallbackError) {
    console.error(`[Google Calendar] Failed to create on fallback calendar:`, fallbackError);
    const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);

    return {
      success: false,
      eventId: null,
      calendarId: null,
      htmlLink: null,
      error: `Failed to create calendar event: ${errorMessage}`,
      requiresManualCreation: true,
    };
  }

  // Should not reach here
  return {
    success: false,
    eventId: null,
    calendarId: null,
    htmlLink: null,
    error: "Unknown error creating calendar event",
    requiresManualCreation: true,
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export interface CalendarScheduleHistoryEntry {
  summary: string;
  reason: string | null;
  changedBy: string;
  changedAt: string;
}

/**
 * Build detailed event description with all required fields
 */
export function buildEventDescription(data: {
  patientName: string;
  patientPhone: string | null;
  selectedPlan: string | null;
  patientBmi: number | null;
  riskFlags: string[];
  doctorBriefUrl: string | null;
  paymentStatus: string;
  intakeId: string | null;
  appointmentType: string;
  bookingId: string;
  currentAppointmentTime?: string | null;
  scheduleHistory?: CalendarScheduleHistoryEntry[];
}): string {
  const lines = [
    `📞 PHONE CONSULTATION`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `PATIENT DETAILS`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 Patient: ${data.patientName}`,
    `📱 Phone: ${data.patientPhone || "⚠️ NOT PROVIDED - Check patient record"}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `PROGRAM DETAILS`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💳 Plan: ${data.selectedPlan || "Not specified"}`,
    `📊 BMI: ${data.patientBmi ? data.patientBmi.toFixed(1) : "Not provided"}`,
    `✅ Payment: ${data.paymentStatus}`,
    ``,
  ];

  // Add risk flags if present
  if (data.riskFlags.length > 0) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`⚠️ RISK FLAGS`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(``);
    data.riskFlags.forEach((flag) => {
      lines.push(`• ${flag}`);
    });
    lines.push(``);
  }

  if (data.currentAppointmentTime || (data.scheduleHistory && data.scheduleHistory.length > 0)) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`APPOINTMENT SCHEDULE`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(``);
    if (data.currentAppointmentTime) {
      lines.push(`📅 Current: ${data.currentAppointmentTime} (Sydney)`);
      lines.push(``);
    }
    if (data.scheduleHistory && data.scheduleHistory.length > 0) {
      lines.push(`Schedule changes:`);
      data.scheduleHistory.forEach((entry) => {
        const reason = entry.reason ? ` — ${entry.reason}` : "";
        const when = new Date(entry.changedAt).toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: TIMEZONE,
        });
        lines.push(`• ${entry.summary}${reason} (${entry.changedBy}, ${when})`);
      });
      lines.push(``);
    }
  }

  // Add doctor brief link
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`RESOURCES`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);
  if (data.doctorBriefUrl) {
    lines.push(`📋 Doctor Brief: ${data.doctorBriefUrl}`);
  } else {
    lines.push(`📋 Doctor Brief: Not yet generated`);
  }
  lines.push(``);

  // Add metadata
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`REFERENCE`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);
  lines.push(`Appointment Type: ${data.appointmentType}`);
  lines.push(`Booking ID: ${data.bookingId}`);
  lines.push(`Intake ID: ${data.intakeId || "N/A"}`);
  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Created by Sanative Health`);

  return lines.join("\n");
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  calendarId: string,
  updates: Partial<calendar_v3.Schema$Event>
): Promise<{ success: boolean; error: string | null }> {
  if (!isGoogleCalendarConfigured()) {
    return { success: false, error: "Google Calendar not configured" };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return { success: false, error: "Failed to initialize calendar client" };
  }

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates,
    });

    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Google Calendar] Failed to update event:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isGoogleCalendarConfigured()) {
    return { success: false, error: "Google Calendar not configured" };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return { success: false, error: "Failed to initialize calendar client" };
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });

    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Google Calendar] Failed to delete event:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if a calendar is accessible (for validation)
 */
export async function checkCalendarAccess(
  calendarId: string
): Promise<{ accessible: boolean; error: string | null }> {
  if (!isGoogleCalendarConfigured()) {
    return { accessible: false, error: "Google Calendar not configured" };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return { accessible: false, error: "Failed to initialize calendar client" };
  }

  try {
    await calendar.calendars.get({ calendarId });
    return { accessible: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { accessible: false, error: errorMessage };
  }
}
