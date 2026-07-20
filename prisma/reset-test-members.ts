/**
 * Remove all member/test data while keeping staff accounts for E2E testing.
 * Default keep: admin@sanative.com.au + phil@sanative.com.au (Dr Phil)
 *
 * Usage: bun run prisma/reset-test-members.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_EMAILS = [
  "admin@sanative.com.au",
  "phil@sanative.com.au",
] as const;

async function main() {
  console.log("🧹 Resetting member data (keeping admin + Dr Phil)...\n");

  const keepUsers = await prisma.user.findMany({
    where: { email: { in: [...KEEP_EMAILS] } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (keepUsers.length === 0) {
    throw new Error(
      `None of the keep accounts found. Expected: ${KEEP_EMAILS.join(", ")}`
    );
  }

  const missing = KEEP_EMAILS.filter(
    (e) => !keepUsers.some((u) => u.email.toLowerCase() === e)
  );
  if (missing.length) {
    console.warn(`⚠ Missing keep accounts: ${missing.join(", ")}`);
  }

  console.log("Keeping:");
  for (const u of keepUsers) {
    console.log(`  ✓ ${u.firstName} ${u.lastName} <${u.email}> (${u.role})`);
  }

  const keepIds = new Set(keepUsers.map((u) => u.id));

  const deleteUsers = await prisma.user.findMany({
    where: { id: { notIn: [...keepIds] } },
    select: { id: true, email: true },
  });

  const deleteIds = deleteUsers.map((u) => u.id);

  console.log(`\nRemoving ${deleteIds.length} user accounts and related data...\n`);

  await prisma.$transaction(async (tx) => {
    // --- All bookings (member test data) ---
    const allBookingIds = (
      await tx.consultationBooking.findMany({ select: { id: true } })
    ).map((b) => b.id);

    if (allBookingIds.length) {
      const dBcl = await tx.bookingChangeLog.deleteMany({
        where: { bookingId: { in: allBookingIds } },
      });
      console.log(`  bookingChangeLog (by booking): ${dBcl.count}`);
    }

    if (deleteIds.length) {
      const dBclUser = await tx.bookingChangeLog.deleteMany({
        where: { changedByUserId: { in: deleteIds } },
      });
      console.log(`  bookingChangeLog (by changedBy): ${dBclUser.count}`);
    }

    const dBookings = await tx.consultationBooking.deleteMany({});
    console.log(`  consultationBooking: ${dBookings.count}`);

    // --- Pre-triage queue (no User FK — wipe all test tasks) ---
    const dPretriage = await tx.preTriageTask.deleteMany({});
    console.log(`  preTriageTask: ${dPretriage.count}`);

    // --- Legacy GP / program member system ---
    const programMembers = await tx.programMember.findMany({ select: { id: true } });
    const pmIds = programMembers.map((p) => p.id);
    if (pmIds.length) {
      await tx.memberNotification.deleteMany({ where: { memberId: { in: pmIds } } });
      await tx.memberMessage.deleteMany({ where: { memberId: { in: pmIds } } });
      await tx.programBiomarkerResult.deleteMany({
        where: { memberId: { in: pmIds } },
      });
      await tx.programCheckIn.deleteMany({ where: { memberId: { in: pmIds } } });
      const d = await tx.programMember.deleteMany({});
      console.log(`  programMember (+ children): ${d.count}`);
    }

    await tx.carePartner.deleteMany({});
    console.log("  carePartner: all removed");

    if (deleteIds.length) {
      const dChatHist = await tx.memberChatHistory.deleteMany({
        where: { memberId: { in: deleteIds } },
      });
      console.log(`  memberChatHistory: ${dChatHist.count}`);

      const chatSessions = await tx.chatSession.findMany({
        where: { memberId: { in: deleteIds } },
        select: { id: true },
      });
      if (chatSessions.length) {
        await tx.chatMessage.deleteMany({
          where: { sessionId: { in: chatSessions.map((s) => s.id) } },
        });
        const d = await tx.chatSession.deleteMany({
          where: { id: { in: chatSessions.map((s) => s.id) } },
        });
        console.log(`  chatSession: ${d.count}`);
      }

      const dCall = await tx.callLog.deleteMany({
        where: { memberId: { in: deleteIds } },
      });
      console.log(`  callLog: ${dCall.count}`);

      const dCoach = await tx.coachMessage.deleteMany({
        where: { userId: { in: deleteIds } },
      });
      console.log(`  coachMessage: ${dCoach.count}`);

      const dTicket = await tx.supportTicket.deleteMany({
        where: { userId: { in: deleteIds } },
      });
      console.log(`  supportTicket: ${dTicket.count}`);

      const dPrefs = await tx.weightManagementPreferences.deleteMany({
        where: { userId: { in: deleteIds } },
      });
      console.log(`  weightManagementPreferences: ${dPrefs.count}`);

      const dReferral = await tx.referral.deleteMany({
        where: {
          OR: [
            { referrerId: { in: deleteIds } },
            { refereeId: { in: deleteIds } },
          ],
        },
      });
      console.log(`  referral: ${dReferral.count}`);

      const treatments = await tx.treatment.findMany({
        where: { userId: { in: deleteIds } },
        select: { id: true },
      });
      if (treatments.length) {
        await tx.medicationDose.deleteMany({
          where: { treatmentId: { in: treatments.map((t) => t.id) } },
        });
        const d = await tx.treatment.deleteMany({
          where: { id: { in: treatments.map((t) => t.id) } },
        });
        console.log(`  treatment: ${d.count}`);
      }

      const dAvail = await tx.doctorAvailability.deleteMany({
        where: { doctorId: { in: deleteIds } },
      });
      console.log(`  doctorAvailability (removed doctors): ${dAvail.count}`);

      const dBlocked = await tx.doctorBlockedDate.deleteMany({
        where: { doctorId: { in: deleteIds } },
      });
      console.log(`  doctorBlockedDate (removed doctors): ${dBlocked.count}`);
    }

    // Clear care-partner assignments (care partners are being removed)
    await tx.user.updateMany({
      where: { assignedCarePartnerId: { not: null } },
      data: { assignedCarePartnerId: null },
    });

    const dNotifs = await tx.notification.deleteMany({});
    console.log(`  notifications: ${dNotifs.count}`);

    const dActivity = await tx.activityLog.deleteMany({});
    console.log(`  activityLog: ${dActivity.count}`);

    // Delete member users (cascades prescriptions, intakes, invoices, entitlements, etc.)
    if (deleteIds.length) {
      const dUsers = await tx.user.deleteMany({
        where: { id: { in: deleteIds } },
      });
      console.log(`  users: ${dUsers.count}`);
    } else {
      console.log("  users: 0 (nothing to delete)");
    }

    // Reset kept staff accounts to a neutral clinical state
    await tx.user.updateMany({
      where: { id: { in: [...keepIds] } },
      data: {
        journeyStatus: "LEAD",
        subscriptionTier: null,
        subscriptionStatus: "INACTIVE",
        memberStatus: "POTENTIAL_MEMBER",
        triageScore: null,
        approvalStatus: "PENDING",
        assignedCarePartnerId: null,
      },
    });
    console.log("  kept staff accounts reset to neutral journey state");
  });

  const remaining = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true, role: true },
    orderBy: { email: "asc" },
  });

  console.log("\n✅ Done. Remaining accounts:");
  for (const u of remaining) {
    console.log(`  • ${u.firstName} ${u.lastName} <${u.email}> (${u.role})`);
  }

  const counts = await Promise.all([
    prisma.consultationBooking.count(),
    prisma.weightManagementIntake.count(),
    prisma.prescription.count(),
    prisma.invoice.count(),
    prisma.careCommunication.count(),
    prisma.memberSubscription.count(),
    prisma.preTriageTask.count(),
    prisma.entitlement.count(),
    prisma.portalQuizSubmission.count(),
    prisma.programMember.count(),
  ]);

  console.log("\nRemaining records:");
  console.log(`  bookings: ${counts[0]}`);
  console.log(`  WM intakes: ${counts[1]}`);
  console.log(`  prescriptions: ${counts[2]}`);
  console.log(`  invoices: ${counts[3]}`);
  console.log(`  care comms: ${counts[4]}`);
  console.log(`  member subscriptions: ${counts[5]}`);
  console.log(`  pre-triage tasks: ${counts[6]}`);
  console.log(`  entitlements: ${counts[7]}`);
  console.log(`  portal quiz submissions: ${counts[8]}`);
  console.log(`  program members: ${counts[9]}`);
  console.log(
    "\nYou can now run the full journey from a fresh member signup.\n"
  );
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
