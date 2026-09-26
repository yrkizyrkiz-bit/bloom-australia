import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPEN_CONSULTATION_BOOKING_STATUSES } from "@/lib/program-journey/upcoming-consultation";
import {
  getHairJourneyStageDescription,
  resolveHairJourneyStatus,
} from "@/lib/program-journey/hair-journey";
import { isDoctorCompletedHairPrescription } from "@/lib/program/hair-treatment";

const HAIR_MEDICATION_KEYWORDS = [
  "finasteride",
  "minoxidil",
  "dutasteride",
  "spironolactone",
  "ketoconazole",
  "hair",
];

function isHairMedication(name?: string | null, diagnosis?: string | null): boolean {
  const haystack = `${name || ""} ${diagnosis || ""}`.toLowerCase();
  return HAIR_MEDICATION_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function daysBetween(start: Date, end = new Date()): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function nextMilestoneForDay(day: number): number {
  return [30, 90, 180, 365].find((milestone) => day < milestone) ?? 365;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      user,
      programMember,
      wmMember,
      hairNoteBooking,
      openBooking,
      completedBooking,
      prescriptions,
      treatments,
      hairCheckIns,
    ] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            subscriptionTier: true,
            journeyStatus: true,
            approvalStatus: true,
            createdAt: true,
          },
        }),
        prisma.programMember.findFirst({
          where: {
            OR: [{ userId }, { email: session.user.email || "" }],
            program: "HAIR_LOSS",
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            intakeData: true,
            membershipStatus: true,
            createdAt: true,
          },
        }),
        prisma.programMember.findFirst({
          where: {
            OR: [{ userId }, { email: session.user.email || "" }],
            program: { in: ["WEIGHT_MANAGEMENT", "weight_management"] },
          },
          select: { id: true },
        }),
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            completedAt: null,
            status: { in: [...OPEN_CONSULTATION_BOOKING_STATUSES] },
            OR: [
              { notes: { contains: "Hair Loss" } },
              { notes: { contains: "hair_loss" } },
              { notes: { contains: "HAIR_LOSS" } },
              { notes: { contains: "hair health" } },
            ],
          },
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            doctorName: true,
            appointmentType: true,
            completedAt: true,
          },
        }),
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            completedAt: null,
            status: { in: [...OPEN_CONSULTATION_BOOKING_STATUSES] },
          },
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            doctorName: true,
            appointmentType: true,
            completedAt: true,
          },
        }),
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            OR: [{ completedAt: { not: null } }, { status: "BOOKING_COMPLETED" }],
          },
          select: { id: true, notes: true },
        }),
        prisma.prescription.findMany({
          where: {
            patientId: userId,
            OR: [
              { category: "HAIR_LOSS" },
              { category: "OTHER" },
              { diagnosis: { contains: "hair" } },
              { medicationName: { contains: "hair" } },
              { medicationName: { contains: "Finasteride" } },
              { medicationName: { contains: "Minoxidil" } },
              { medicationName: { contains: "Dutasteride" } },
              { medicationName: { contains: "Spironolactone" } },
            ],
          },
          orderBy: { prescribedAt: "desc" },
          include: {
            refills: {
              orderBy: { requestedAt: "desc" },
              take: 3,
            },
          },
        }),
        prisma.treatment.findMany({
          where: { userId, isActive: true },
          include: {
            doses: {
              orderBy: { scheduledAt: "desc" },
              take: 60,
            },
          },
          orderBy: { startDate: "asc" },
        }),
        prisma.hairWeeklyCheckIn.findMany({
          where: { userId },
          select: { photos: true },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hairPrescriptions = prescriptions.filter(
      (rx) =>
        isDoctorCompletedHairPrescription(rx) ||
        isHairMedication(rx.medicationName, rx.diagnosis)
    );
    const hairRxIds = new Set(hairPrescriptions.map((rx) => rx.id));
    const hairTreatments = treatments.filter(
      (treatment) =>
        (treatment.prescriptionId && hairRxIds.has(treatment.prescriptionId)) ||
        isHairMedication(treatment.medicationName)
    );

    const treatmentStart =
      hairTreatments[0]?.startDate || hairPrescriptions[0]?.startDate || null;
    const currentDay = treatmentStart ? daysBetween(treatmentStart) + 1 : 0;
    const allDoses = hairTreatments.flatMap((treatment) => treatment.doses);
    const scheduledDoses = allDoses.filter(
      (dose) => dose.scheduledAt <= new Date() && !dose.skipped
    );
    const takenDoses = scheduledDoses.filter((dose) => dose.takenAt);
    const treatmentAdherence =
      scheduledDoses.length > 0
        ? Math.round((takenDoses.length / scheduledDoses.length) * 100)
        : null;

    const isHairMember =
      user.subscriptionTier === "hair_loss" || programMember?.id != null;
    const hairOnly =
      Boolean(programMember) &&
      !wmMember &&
      (user.subscriptionTier === "hair_loss" || user.subscriptionTier === "HAIR_LOSS");
    const booking = hairNoteBooking ?? (isHairMember ? openBooking : null);
    const hasHairPrescription = hairPrescriptions.length > 0;
    const hasActiveTreatment = hairTreatments.length > 0 || hasHairPrescription;
    const hairJourneyStatus = resolveHairJourneyStatus({
      journeyStatus: user.journeyStatus,
      approvalStatus: user.approvalStatus,
      programMemberStatus: programMember?.membershipStatus,
      hasUpcomingBooking: Boolean(booking),
      consultCompleted:
        Boolean(completedBooking) &&
        (hairOnly ||
          !wmMember ||
          /hair|bald/i.test(completedBooking.notes || "")),
      hasHairPrescription,
      hasActiveTreatment: hairTreatments.length > 0,
      hairOnly,
    });
    const hairJourneyLabel = getHairJourneyStageDescription(hairJourneyStatus);

    const hasPaid = [
      "CONSULTATION_PAID",
      "PRE_TRIAGE_PENDING",
      "PRE_TRIAGE_COMPLETE",
      "AWAITING_DOCTOR_CALL",
      "CONSULT_COMPLETED",
      "AWAITING_DOCTOR_DECISION",
      "APPROVED",
      "ONBOARDING_PENDING",
      "ONBOARDING_COMPLETE",
      "ACTIVE",
    ].includes(user.journeyStatus || "") || Boolean(programMember);

    return NextResponse.json({
      user: {
        firstName: user.firstName,
        subscriptionTier: user.subscriptionTier,
        journeyStatus: user.journeyStatus,
        approvalStatus: user.approvalStatus,
      },
      isHairMember,
      hairJourney: {
        status: hairJourneyStatus,
        label: hairJourneyLabel,
      },
      status: {
        hasPaid,
        isApproved:
          user.approvalStatus === "APPROVED" ||
          hairJourneyStatus === "APPROVED" ||
          hairJourneyStatus === "ACTIVE",
        hasActiveTreatment,
        label: hairJourneyLabel,
      },
      intake: (programMember?.intakeData as Record<string, unknown> | null) || null,
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
        totalDays: 365,
        startDate: treatmentStart?.toISOString() || null,
        treatmentAdherence,
        photosLogged: hairCheckIns.reduce((sum, row) => {
          const photos = Array.isArray(row.photos) ? row.photos : [];
          return sum + photos.length;
        }, 0),
        nextMilestone: nextMilestoneForDay(currentDay),
      },
      prescriptions: hairPrescriptions.map((rx) => {
        const linked = hairTreatments.find((treatment) => treatment.prescriptionId === rx.id);
        const hasSchedule = Boolean(linked && linked.doses.length > 0);
        return {
          id: rx.id,
          medicationName: rx.medicationName,
          strength: rx.strength,
          dosage: rx.dosage,
          frequency: rx.frequency,
          instructions: rx.instructions,
          status: rx.status,
          scriptStatus: rx.scriptStatus,
          prescribedAt: rx.prescribedAt.toISOString(),
          startDate: rx.startDate.toISOString(),
          nextRefillDate: rx.nextRefillDate?.toISOString() || null,
          refillsRemaining: rx.refillsRemaining,
          needsFirstDose: isDoctorCompletedHairPrescription(rx) && !hasSchedule,
        };
      }),
      treatments: hairTreatments.map((treatment) => {
        const doses = treatment.doses;
        const dueDoses = doses.filter(
          (dose) => dose.scheduledAt <= new Date() && !dose.skipped
        );
        const taken = dueDoses.filter((dose) => dose.takenAt).length;
        const upcoming = doses
          .filter((dose) => !dose.takenAt && !dose.skipped)
          .slice(0, 8);
        return {
          id: treatment.id,
          prescriptionId: treatment.prescriptionId,
          medicationName: treatment.medicationName,
          dosage: treatment.dosage,
          frequency: treatment.frequency,
          instructions: treatment.instructions,
          startDate: treatment.startDate.toISOString(),
          nextDoseDate: upcoming[0]?.scheduledAt.toISOString() || treatment.nextDoseDate?.toISOString() || null,
          adherence:
            dueDoses.length > 0 ? Math.round((taken / dueDoses.length) * 100) : null,
          upcomingDoses: upcoming.map((dose) => ({
            id: dose.id,
            scheduledAt: dose.scheduledAt.toISOString(),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("[hair-loss/portal]", error);
    return NextResponse.json(
      { error: "Failed to load hair loss portal data" },
      { status: 500 }
    );
  }
}
