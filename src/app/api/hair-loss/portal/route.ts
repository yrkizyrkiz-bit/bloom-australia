import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const [user, programMember, booking, prescriptions, treatments] =
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
        prisma.consultationBooking.findFirst({
          where: {
            userId,
            notes: { contains: "Hair Loss" },
            completedAt: null,
            status: { in: ["BOOKING_CONFIRMED", "BOOKING_RESCHEDULED", "SLOT_HELD"] },
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
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hairPrescriptions = prescriptions.filter((rx) =>
      isHairMedication(rx.medicationName, rx.diagnosis)
    );
    const hairTreatments = treatments.filter((treatment) =>
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

    const hasPaid = [
      "CONSULTATION_PAID",
      "PRE_TRIAGE_PENDING",
      "PRE_TRIAGE_COMPLETE",
      "AWAITING_DOCTOR_CALL",
      "CONSULT_COMPLETED",
      "AWAITING_DOCTOR_DECISION",
      "APPROVED",
      "ACTIVE",
    ].includes(user.journeyStatus || "");

    return NextResponse.json({
      user: {
        firstName: user.firstName,
        subscriptionTier: user.subscriptionTier,
        journeyStatus: user.journeyStatus,
        approvalStatus: user.approvalStatus,
      },
      isHairMember:
        user.subscriptionTier === "hair_loss" || programMember?.id != null,
      status: {
        hasPaid,
        isApproved: user.approvalStatus === "APPROVED",
        hasActiveTreatment: hairTreatments.length > 0 || hairPrescriptions.length > 0,
        label: hairTreatments.length > 0
          ? "Treatment active"
          : hasPaid
            ? "Care team triage"
            : "Assessment started",
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
        photosLogged: 0,
        nextMilestone: nextMilestoneForDay(currentDay),
      },
      prescriptions: hairPrescriptions.map((rx) => ({
        id: rx.id,
        medicationName: rx.medicationName,
        strength: rx.strength,
        dosage: rx.dosage,
        frequency: rx.frequency,
        status: rx.status,
        scriptStatus: rx.scriptStatus,
        prescribedAt: rx.prescribedAt.toISOString(),
        startDate: rx.startDate.toISOString(),
        nextRefillDate: rx.nextRefillDate?.toISOString() || null,
        refillsRemaining: rx.refillsRemaining,
      })),
      treatments: hairTreatments.map((treatment) => {
        const doses = treatment.doses;
        const dueDoses = doses.filter(
          (dose) => dose.scheduledAt <= new Date() && !dose.skipped
        );
        const taken = dueDoses.filter((dose) => dose.takenAt).length;
        return {
          id: treatment.id,
          medicationName: treatment.medicationName,
          dosage: treatment.dosage,
          frequency: treatment.frequency,
          instructions: treatment.instructions,
          startDate: treatment.startDate.toISOString(),
          nextDoseDate: treatment.nextDoseDate?.toISOString() || null,
          adherence:
            dueDoses.length > 0 ? Math.round((taken / dueDoses.length) * 100) : null,
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
