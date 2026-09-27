import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPEN_CONSULTATION_BOOKING_STATUSES } from "@/lib/program-journey/upcoming-consultation";
import {
  getHairJourneyStageDescription,
  resolveHairJourneyStatus,
} from "@/lib/program-journey/hair-journey";
import {
  isDoctorCompletedHairPrescription,
  repairHairTreatmentScheduleIfNeeded,
  selectUpcomingHairDoses,
} from "@/lib/program/hair-treatment";
import {
  canLogDoseScheduledFor,
  formatNextDoseDateShort,
  getCalendarDateKey,
  isDoseOverdue,
} from "@/lib/program/dose-schedule";
import { notifyMember } from "@/lib/notifications/member-notify";

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
      sexualMember,
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
        prisma.programMember.findFirst({
          where: {
            OR: [{ userId }, { email: session.user.email || "" }],
            program: { in: ["MENS_HEALTH_SEXUAL", "MENS_HEALTH"] },
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
              orderBy: { scheduledAt: "asc" },
            },
          },
          orderBy: { startDate: "asc" },
        }),
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COALESCE(SUM(
            CASE
              WHEN jsonb_typeof("photos"::jsonb) = 'array' THEN jsonb_array_length("photos"::jsonb)
              ELSE 0
            END
          ), 0)::int AS count
          FROM "HairWeeklyCheckIn"
          WHERE "userId" = ${userId}
        `,
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
    let hairTreatments = treatments.filter(
      (treatment) =>
        (treatment.prescriptionId && hairRxIds.has(treatment.prescriptionId)) ||
        isHairMedication(treatment.medicationName)
    );

    const repairedIds: string[] = [];
    for (const treatment of hairTreatments) {
      const linkedRx = hairPrescriptions.find((rx) => rx.id === treatment.prescriptionId);
      const repaired = await repairHairTreatmentScheduleIfNeeded({
        userId,
        prescriptionId: treatment.prescriptionId,
        frequency: linkedRx?.frequency || treatment.frequency,
        startDate: treatment.startDate,
        daysSupply: linkedRx?.daysSupply,
        doses: treatment.doses,
      });
      if (repaired) repairedIds.push(treatment.id);
    }

    if (repairedIds.length > 0) {
      const refreshed = await prisma.treatment.findMany({
        where: { id: { in: repairedIds } },
        include: { doses: { orderBy: { scheduledAt: "asc" } } },
      });
      hairTreatments = hairTreatments.map(
        (treatment) => refreshed.find((row) => row.id === treatment.id) ?? treatment
      );
    }

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
      user.subscriptionTier === "hair_loss" ||
      user.subscriptionTier === "HAIR_LOSS" ||
      programMember?.id != null;
    // Shared user.approvalStatus / journeyStatus must not advance Hair when
    // another clinical program (sexual/WM) owns those fields.
    const hairOnly = Boolean(programMember) && !wmMember && !sexualMember;
    const booking = hairNoteBooking ?? (isHairMember ? openBooking : null);
    const hasHairPrescription = hairPrescriptions.length > 0;
    const hasActiveTreatment =
      isHairMember && (hairTreatments.length > 0 || hasHairPrescription);
    const hairJourneyStatus = resolveHairJourneyStatus({
      journeyStatus: hairOnly ? user.journeyStatus : null,
      approvalStatus: hairOnly ? user.approvalStatus : null,
      programMemberStatus: programMember?.membershipStatus,
      hasUpcomingBooking: Boolean(booking),
      consultCompleted:
        Boolean(completedBooking) &&
        (hairOnly ||
          !wmMember ||
          /hair|bald/i.test(completedBooking.notes || "")),
      hasHairPrescription: isHairMember && hasHairPrescription,
      hasActiveTreatment: isHairMember && hairTreatments.length > 0,
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
          hairJourneyStatus === "APPROVED" || hairJourneyStatus === "ACTIVE",
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
        photosLogged: Number(hairCheckIns[0]?.count ?? 0),
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
        const linkedRx = hairPrescriptions.find((rx) => rx.id === treatment.prescriptionId);
        const doses = treatment.doses;
        const dueDoses = doses.filter(
          (dose) => dose.scheduledAt <= new Date() && !dose.skipped
        );
        const taken = dueDoses.filter((dose) => dose.takenAt).length;
        const upcoming = selectUpcomingHairDoses(doses);
        const nextOpen =
          [...doses]
            .filter((dose) => !dose.takenAt && !dose.skipped)
            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0] ?? null;
        const todayKey = getCalendarDateKey(new Date());
        const loggedToday = doses.some(
          (dose) => dose.takenAt && getCalendarDateKey(dose.takenAt) === todayKey
        );
        const overdue = Boolean(nextOpen && isDoseOverdue(nextOpen.scheduledAt));
        if (overdue && nextOpen) {
          void notifyMember({
            userId,
            intent: "PROGRAM_STEP",
            title: "Hair dose overdue",
            message: `Your ${treatment.medicationName} dose was due ${formatNextDoseDateShort(nextOpen.scheduledAt)}. Log it when you can, or message your care team if you need to pause.`,
            actionUrl: "/dashboard/mens-health/hair-loss",
            type: "WARNING",
            category: "REMINDER",
            dedupeDays: 1,
          }).catch((err) => console.error("[hair-loss/portal] overdue reminder", err));
        }
        return {
          id: treatment.id,
          prescriptionId: treatment.prescriptionId,
          medicationName: treatment.medicationName,
          dosage: treatment.dosage,
          strength: linkedRx?.strength || "",
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
          nextDose: nextOpen
            ? {
                id: nextOpen.id,
                scheduledAt: nextOpen.scheduledAt.toISOString(),
                canLog: canLogDoseScheduledFor(nextOpen.scheduledAt),
                overdue,
              }
            : null,
          loggedToday,
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
