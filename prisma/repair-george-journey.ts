/**
 * Repair George Coolando's WM journey — remove stale test-session data
 * and restore a coherent PRE_TRIAGE_PENDING state (quiz done, paid, booked, Mia assigned).
 *
 * Usage: bun run prisma/repair-george-journey.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GEORGE_EMAIL = "yrkizyrkiz@gmail.com";
const MIA_EMAIL = "mia@sanative.com.au";

function parseDob(dob: string): Date {
  const [d, m, y] = dob.split("/").map(Number);
  return new Date(y, m - 1, d);
}

async function main() {
  const george = await prisma.user.findUnique({
    where: { email: GEORGE_EMAIL },
    select: { id: true, firstName: true, lastName: true },
  });
  const mia = await prisma.user.findUnique({
    where: { email: MIA_EMAIL },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  if (!george) throw new Error(`George not found (${GEORGE_EMAIL})`);
  if (!mia) throw new Error(`Mia not found (${MIA_EMAIL})`);

  let miaCarePartner = await prisma.carePartner.findUnique({
    where: { email: MIA_EMAIL },
  });
  if (!miaCarePartner) {
    miaCarePartner = await prisma.carePartner.create({
      data: {
        firstName: mia.firstName || "Mia",
        lastName: mia.lastName || "Care Partner",
        email: MIA_EMAIL,
        programs: ["weight_management"],
        active: true,
      },
    });
  }

  const intake = await prisma.weightManagementIntake.findFirst({
    where: { userId: george.id },
    orderBy: { createdAt: "desc" },
  });

  const booking = await prisma.consultationBooking.findFirst({
    where: { userId: george.id },
    orderBy: { createdAt: "desc" },
  });

  const quizData = (intake?.quizData as Record<string, unknown>) || {};
  const consultationAt = new Date("2026-06-06T04:30:00.000Z");

  console.log("🔧 Repairing George WM journey...\n");

  await prisma.$transaction(async (tx) => {
    // Remove test-session artifacts
    const rxIds = (
      await tx.prescription.findMany({
        where: { patientId: george.id },
        select: { id: true },
      })
    ).map((r) => r.id);

    if (rxIds.length) {
      await tx.prescriptionRefill.deleteMany({
        where: { prescriptionId: { in: rxIds } },
      });
      await tx.prescription.deleteMany({ where: { id: { in: rxIds } } });
      console.log(`  Deleted ${rxIds.length} test prescription(s)`);
    }

    await tx.careCommunication.deleteMany({
      where: { userId: george.id },
    });
    console.log("  Cleared care communication tasks");

    await tx.appointment.deleteMany({ where: { userId: george.id } });
    console.log("  Cleared appointments");

    await tx.memberProgram.deleteMany({ where: { userId: george.id } });

    await tx.weightManagementPreferences.deleteMany({
      where: { userId: george.id },
    });

    await tx.memberSubscription.deleteMany({ where: { userId: george.id } });
    await tx.membershipSubscription.deleteMany({ where: { userId: george.id } });

    await tx.internalNote.deleteMany({
      where: {
        userId: george.id,
        OR: [
          { title: { contains: "Doctor Decision" } },
          { title: { contains: "Triage Record" } },
          { title: "Calendar Event Creation Failed" },
          { title: "Consultation Schedule" },
          { title: "Patient Brief for Doctor Review" },
          { title: "✓ TRIAGE COMPLETED" },
          { title: "Ongoing Subscription Created" },
        ],
      },
    });
    console.log("  Removed stale internal notes");

    // Booking — confirmed, not completed
    if (booking) {
      await tx.consultationBooking.update({
        where: { id: booking.id },
        data: {
          status: "BOOKING_CONFIRMED",
          scheduledAt: consultationAt,
          completedAt: null,
          doctorId: null,
          doctorName: null,
          notes: "Doctor to be assigned during triage by care partner",
          intakeId: intake?.id || null,
        },
      });
      console.log("  Reset consultation booking to BOOKING_CONFIRMED");
    }

    // Intake — paid, awaiting triage
    if (intake) {
      const syncedQuiz = {
        ...quizData,
        journeyStatus: "PRE_TRIAGE_PENDING",
        submittedAt: quizData.submittedAt || new Date().toISOString(),
      };

      await tx.weightManagementIntake.update({
        where: { id: intake.id },
        data: {
          selectedPlan: "CORE",
          paymentStatus: "PAID",
          paymentIntentId: booking?.paymentIntentId || intake.paymentIntentId,
          paymentAmount: 24900,
          paidAt: intake.paidAt || new Date("2026-06-05T10:17:04.622Z"),
          bookingId: booking?.id || intake.bookingId,
          bookingStatus: "CONFIRMED",
          scheduledAt: consultationAt,
          doctorReviewStatus: "PENDING_TRIAGE",
          doctorId: null,
          doctorReviewedAt: null,
          doctorDecision: null,
          doctorNotes: null,
          prescriptionId: null,
          portalStatus: "INTAKE_COMPLETED",
          quizData: syncedQuiz,
        },
      });
      console.log("  Synced WeightManagementIntake");
    }

    // Pre-triage task
    await tx.preTriageTask.deleteMany({ where: { patientId: george.id } });
    if (booking) {
      await tx.preTriageTask.create({
        data: {
          patientId: george.id,
          intakeId: intake?.id || null,
          bookingId: booking.id,
          assignedOwnerId: mia.id,
          dueDate: new Date(consultationAt.getTime() - 24 * 60 * 60 * 1000),
          status: "PENDING",
          quizComplete: true,
          phoneConfirmed: false,
          appointmentConfirmed: false,
          medicationsChecked: false,
          allergiesChecked: false,
          riskFlagsChecked: false,
          bmiChecked: false,
          briefAttached: false,
          readyForDoctor: false,
        },
      });
      console.log("  Recreated pre-triage task for Mia");
    }

    // ProgramMember demographics from quiz
    const dob = quizData.dateOfBirth
      ? parseDob(quizData.dateOfBirth as string)
      : new Date("1973-02-02");

    await tx.programMember.upsert({
      where: { email: GEORGE_EMAIL },
      create: {
        userId: george.id,
        firstName: "George",
        lastName: "Coolando",
        email: GEORGE_EMAIL,
        mobile: "0416299091",
        dob,
        program: "WEIGHT_MANAGEMENT",
        intakeData: intake?.quizData || quizData,
        membershipStatus: "PENDING",
        membershipStart: new Date(),
        membershipEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        carePartnerId: miaCarePartner.id,
      },
      update: {
        firstName: "George",
        lastName: "Coolando",
        mobile: "0416299091",
        dob,
        intakeData: intake?.quizData || quizData,
        membershipStatus: "PENDING",
        carePartnerId: miaCarePartner.id,
      },
    });
    console.log("  Fixed ProgramMember profile");

    // User journey state
    await tx.user.update({
      where: { id: george.id },
      data: {
        journeyStatus: "PRE_TRIAGE_PENDING",
        memberStatus: "MEMBER",
        subscriptionStatus: "INACTIVE",
        subscriptionTier: "weight_management",
        approvalStatus: "PENDING",
        triageScore: 100,
        assignedCarePartnerId: mia.id,
        lastName: "Coolando",
        phone: "0416299091",
        dateOfBirth: dob,
        gender: "MALE",
        addressLine1: "19 Manly Road",
        suburb: "Seaforth",
        state: "NSW",
        postcode: "2092",
      },
    });
    console.log("  Set user to PRE_TRIAGE_PENDING / assigned to Mia");
  });

  const summary = await prisma.user.findUnique({
    where: { id: george.id },
    select: {
      journeyStatus: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      approvalStatus: true,
      assignedCarePartnerId: true,
      consultationBookings: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, scheduledAt: true },
      },
      weightManagementIntakes: {
        take: 1,
        select: { paymentStatus: true, doctorReviewStatus: true },
      },
      prescriptions: { select: { id: true } },
      careCommunications: { select: { id: true } },
    },
  });

  console.log("\n✅ Done. George's journey:\n");
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
