import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  focusLabel,
  consultationSummary,
} from "@/lib/programs/quizzes/mens-sexual-health-quiz";
import {
  isSexualHealthMedication,
  parseUseLogNotes,
  scriptStatusInfo,
} from "@/lib/mens-sexual-health/portal-data";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, entitlement, quizSubmission, booking, prescriptions, treatments] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            firstName: true,
            journeyStatus: true,
            approvalStatus: true,
          },
        }),
        prisma.entitlement.findFirst({
          where: {
            userId,
            type: "PROGRAM",
            key: "MENS_HEALTH_SEXUAL",
            status: { in: ["ACTIVE", "PENDING"] },
          },
        }),
        prisma.portalQuizSubmission.findFirst({
          where: { userId, programKey: "MENS_HEALTH_SEXUAL" },
          orderBy: { submittedAt: "desc" },
        }),
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            OR: [
              { notes: { contains: "Sexual Health", mode: "insensitive" } },
              { notes: { contains: "MENS_HEALTH_SEXUAL", mode: "insensitive" } },
              { notes: { contains: "Erectile", mode: "insensitive" } },
            ],
          },
          orderBy: { scheduledAt: "desc" },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            doctorName: true,
            appointmentType: true,
          },
        }),
        prisma.prescription.findMany({
          where: {
            patientId: userId,
            status: "ACTIVE",
            OR: [
              { category: "SEXUAL_HEALTH" },
              { diagnosis: { contains: "sexual", mode: "insensitive" } },
              { diagnosis: { contains: "erectile", mode: "insensitive" } },
              { medicationName: { contains: "Sildenafil", mode: "insensitive" } },
              { medicationName: { contains: "Tadalafil", mode: "insensitive" } },
              { medicationName: { contains: "Vardenafil", mode: "insensitive" } },
              { medicationName: { contains: "Dapoxetine", mode: "insensitive" } },
            ],
          },
          orderBy: { prescribedAt: "desc" },
          include: {
            refills: { orderBy: { requestedAt: "desc" }, take: 1 },
          },
        }),
        prisma.treatment.findMany({
          where: { userId, isActive: true },
          include: {
            doses: {
              where: { takenAt: { not: null } },
              orderBy: { takenAt: "desc" },
              take: 12,
            },
          },
          orderBy: { startDate: "desc" },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const answers = (quizSubmission?.answers as Record<string, string> | null) || null;
    const treatmentFocus = answers?.treatmentFocus;

    const sexualPrescriptions = prescriptions.filter((rx) =>
      rx.category === "SEXUAL_HEALTH" ||
      isSexualHealthMedication(rx.medicationName, rx.diagnosis, rx.notes)
    );

    const sexualTreatments = treatments.filter((treatment) =>
      isSexualHealthMedication(treatment.medicationName, null, treatment.instructions)
    );

    const primaryPrescription = sexualPrescriptions[0] || null;
    const primaryTreatment =
      sexualTreatments[0] ||
      (primaryPrescription
        ? sexualTreatments.find((t) => t.prescriptionId === primaryPrescription.id)
        : null) ||
      null;

    const allUseDoses = sexualTreatments.flatMap((treatment) => treatment.doses);
    const recentUses = allUseDoses
      .sort(
        (a, b) =>
          new Date(b.takenAt || b.scheduledAt).getTime() -
          new Date(a.takenAt || a.scheduledAt).getTime()
      )
      .slice(0, 12)
      .map((dose) => {
        const parsed = parseUseLogNotes(dose.notes);
        return {
          id: dose.id,
          takenAt: dose.takenAt?.toISOString() || dose.scheduledAt.toISOString(),
          effectiveness: parsed.effectiveness || null,
          detail: parsed.detail || null,
          sideEffects: dose.sideEffects,
        };
      });

    const last30Days = recentUses.filter((use) => {
      const taken = new Date(use.takenAt).getTime();
      return taken >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    });

    const effectiveCount = last30Days.filter(
      (use) => use.effectiveness === "excellent" || use.effectiveness === "good"
    ).length;

    const isMember = Boolean(entitlement);
    const hasPrescription = sexualPrescriptions.length > 0;
    const hasActiveTreatment = Boolean(primaryTreatment);

    let phase: "not_enrolled" | "awaiting_consultation" | "prescription_in_progress" | "active_treatment";
    let statusLabel: string;
    let statusDescription: string;

    if (!isMember) {
      phase = "not_enrolled";
      statusLabel = "Not enrolled";
      statusDescription = "Start the confidential quiz to join the program.";
    } else if (hasActiveTreatment) {
      phase = "active_treatment";
      statusLabel = "Treatment active";
      statusDescription = "Log how your medication is working and message your care team anytime.";
    } else if (hasPrescription) {
      phase = "prescription_in_progress";
      const info = scriptStatusInfo(primaryPrescription!.scriptStatus);
      statusLabel = info.label;
      statusDescription = info.description;
    } else {
      phase = "awaiting_consultation";
      statusLabel = booking?.status === "CONFIRMED" ? "Consultation booked" : "Awaiting consultation";
      statusDescription = booking
        ? "Your doctor consultation is scheduled — we will confirm your treatment plan after the visit."
        : "Your subscription is active. Our care team will contact you to book your included consultation.";
    }

    return NextResponse.json({
      user: { firstName: user.firstName },
      isMember,
      entitlementStatus: entitlement?.status || null,
      focus: {
        id: treatmentFocus || null,
        label: focusLabel(treatmentFocus),
        summary: consultationSummary(treatmentFocus),
      },
      status: { phase, label: statusLabel, description: statusDescription },
      booking: booking
        ? {
            id: booking.id,
            status: booking.status,
            scheduledAt: booking.scheduledAt.toISOString(),
            doctorName: booking.doctorName,
            appointmentType: booking.appointmentType,
          }
        : null,
      prescription: primaryPrescription
        ? {
            id: primaryPrescription.id,
            medicationName: primaryPrescription.medicationName,
            strength: primaryPrescription.strength,
            dosage: primaryPrescription.dosage,
            frequency: primaryPrescription.frequency,
            instructions: primaryPrescription.instructions,
            refillsRemaining: primaryPrescription.refillsRemaining,
            scriptStatus: primaryPrescription.scriptStatus,
            ...scriptStatusInfo(primaryPrescription.scriptStatus),
            nextRefillDate: primaryPrescription.nextRefillDate?.toISOString() || null,
            trackingNumber: primaryPrescription.refills[0]?.trackingNumber || null,
            deliveredAt: primaryPrescription.refills[0]?.deliveredAt?.toISOString() || null,
          }
        : null,
      treatment: primaryTreatment
        ? {
            id: primaryTreatment.id,
            prescriptionId: primaryTreatment.prescriptionId,
            medicationName: primaryTreatment.medicationName,
            dosage: primaryTreatment.dosage,
            frequency: primaryTreatment.frequency,
            instructions: primaryTreatment.instructions,
          }
        : null,
      canLogUse: Boolean(primaryTreatment || primaryPrescription),
      recentUses,
      useStats: {
        totalLogged: recentUses.length,
        last30Days: last30Days.length,
        effectiveRate:
          last30Days.length > 0
            ? Math.round((effectiveCount / last30Days.length) * 100)
            : null,
      },
    });
  } catch (error) {
    console.error("[mens-health/sexual-health/portal]", error);
    return NextResponse.json(
      { error: "Failed to load sexual health data" },
      { status: 500 }
    );
  }
}
