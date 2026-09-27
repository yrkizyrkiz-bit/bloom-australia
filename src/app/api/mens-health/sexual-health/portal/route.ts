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
import {
  getSexualJourneyStageDescription,
  resolveSexualJourneyStatus,
} from "@/lib/program-journey/sexual-journey";
import { normalizeProgramKey } from "@/lib/membership/keys";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      user,
      entitlements,
      quizSubmission,
      booking,
      prescriptions,
      treatments,
      programMembers,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          journeyStatus: true,
          approvalStatus: true,
          subscriptionTier: true,
        },
      }),
      prisma.entitlement.findMany({
        where: {
          userId,
          type: "PROGRAM",
          status: { in: ["ACTIVE", "PENDING"] },
        },
        select: { key: true, status: true },
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
            { notes: { contains: "mens_health_sexual", mode: "insensitive" } },
          ],
        },
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          doctorName: true,
          appointmentType: true,
          completedAt: true,
        },
      }),
      prisma.prescription.findMany({
        where: {
          patientId: userId,
          status: "ACTIVE",
          category: "SEXUAL_HEALTH",
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
            take: 20,
          },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.programMember.findMany({
        where: { OR: [{ userId }, { email: session.user.email || "" }] },
        select: { program: true, membershipStatus: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const answers = (quizSubmission?.answers as Record<string, string> | null) || null;
    const treatmentFocus = answers?.treatmentFocus;

    // Only SEXUAL_HEALTH category scripts count — never inherit Hair/WM scripts via fuzzy notes.
    const sexualPrescriptions = prescriptions.filter((rx) => rx.category === "SEXUAL_HEALTH");

    const sexualTreatments = treatments.filter((treatment) => {
      if (
        treatment.prescriptionId &&
        sexualPrescriptions.some((rx) => rx.id === treatment.prescriptionId)
      ) {
        return true;
      }
      return isSexualHealthMedication(treatment.medicationName, null, null);
    });

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

    const entitlement = entitlements.find((row) => row.key === "MENS_HEALTH_SEXUAL") || null;
    const isMember = Boolean(entitlement);
    const hasPrescription = sexualPrescriptions.length > 0;
    const hasActiveTreatment = Boolean(primaryTreatment);

    const sexualMember = programMembers.find((m) => {
      const key = normalizeProgramKey(m.program);
      return key === "MENS_HEALTH_SEXUAL" || key === "MENS_HEALTH";
    });
    const hasWeight =
      programMembers.some((m) => normalizeProgramKey(m.program) === "WEIGHT_MANAGEMENT") ||
      entitlements.some((row) => row.key === "WEIGHT_MANAGEMENT");
    const tier = (user.subscriptionTier || "").toLowerCase();
    const hasHair =
      programMembers.some((m) => normalizeProgramKey(m.program) === "HAIR_LOSS") ||
      entitlements.some((row) => row.key === "HAIR_LOSS") ||
      tier === "hair_loss";
    // Shared user.approvalStatus / journeyStatus must not advance Sexual Health
    // when Hair (or WM) is also on this account — even if ProgramMember rows are missing.
    const sexualOnly = !hasWeight && !hasHair;

    const sexualJourneyStatus = resolveSexualJourneyStatus({
      journeyStatus: sexualOnly ? user.journeyStatus : null,
      approvalStatus: sexualOnly ? user.approvalStatus : null,
      programMemberStatus: sexualMember?.membershipStatus,
      hasUpcomingBooking: Boolean(booking && !booking.completedAt),
      consultCompleted: Boolean(booking?.completedAt),
      hasSexualPrescription: hasPrescription,
      hasActiveTreatment,
      sexualOnly,
    });
    const sexualJourneyLabel = getSexualJourneyStageDescription(sexualJourneyStatus);

    const startDate = primaryTreatment?.startDate || primaryPrescription?.startDate || null;
    const currentDay = startDate
      ? Math.max(
          1,
          Math.floor((Date.now() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1
        )
      : 0;
    const milestones = [7, 14, 30, 90];
    const nextMilestone = milestones.find((d) => d > currentDay) ?? 90;

    let phase:
      | "not_enrolled"
      | "awaiting_consultation"
      | "prescription_in_progress"
      | "active_treatment";
    if (!isMember) phase = "not_enrolled";
    else if (hasActiveTreatment) phase = "active_treatment";
    else if (hasPrescription) phase = "prescription_in_progress";
    else phase = "awaiting_consultation";

    return NextResponse.json({
      user: {
        firstName: user.firstName,
        journeyStatus: user.journeyStatus,
        approvalStatus: user.approvalStatus,
        subscriptionTier: user.subscriptionTier,
      },
      isMember,
      entitlementStatus: entitlement?.status || null,
      sexualJourney: {
        status: sexualJourneyStatus,
        label: sexualJourneyLabel,
      },
      focus: {
        id: treatmentFocus || null,
        label: focusLabel(treatmentFocus),
        summary: consultationSummary(treatmentFocus),
      },
      status: {
        phase,
        label: sexualJourneyLabel,
        description:
          phase === "active_treatment"
            ? "Log how your medication is working and complete your weekly check-in."
            : phase === "prescription_in_progress"
              ? scriptStatusInfo(primaryPrescription!.scriptStatus).description
              : phase === "awaiting_consultation"
                ? booking
                  ? "Your doctor consultation is scheduled."
                  : "Your membership is active. Care team will confirm your consultation."
                : "Start the confidential quiz to join the program.",
        hasPaid: isMember,
        isApproved:
          sexualJourneyStatus === "APPROVED" || sexualJourneyStatus === "ACTIVE",
        hasActiveTreatment,
      },
      booking: booking
        ? {
            id: booking.id,
            status: booking.status,
            scheduledAt: booking.scheduledAt.toISOString(),
            doctorName: booking.doctorName,
            appointmentType: booking.appointmentType,
            completedAt: booking.completedAt?.toISOString() || null,
          }
        : null,
      progress: {
        currentDay,
        totalDays: 90,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        treatmentAdherence:
          last30Days.length > 0
            ? Math.round((effectiveCount / last30Days.length) * 100)
            : null,
        usesLogged: recentUses.length,
        nextMilestone,
      },
      prescriptions: sexualPrescriptions.map((rx) => ({
        id: rx.id,
        medicationName: rx.medicationName,
        strength: rx.strength,
        dosage: rx.dosage,
        frequency: rx.frequency,
        instructions: rx.instructions,
        status: rx.status,
        scriptStatus: rx.scriptStatus,
        prescribedAt: rx.prescribedAt.toISOString(),
        startDate: rx.startDate?.toISOString() || null,
        nextRefillDate: rx.nextRefillDate?.toISOString() || null,
        refillsRemaining: rx.refillsRemaining,
        needsFirstDose: !sexualTreatments.some((t) => t.prescriptionId === rx.id),
        ...scriptStatusInfo(rx.scriptStatus),
      })),
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
      treatments: sexualTreatments.map((t) => ({
        id: t.id,
        prescriptionId: t.prescriptionId,
        medicationName: t.medicationName,
        dosage: t.dosage,
        frequency: t.frequency,
        instructions: t.instructions,
        startDate: t.startDate.toISOString(),
      })),
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
