/**
 * Dev/test database cleanup.
 *
 * Preserves: admin@sanative.com.au, member@sanative.com.au
 * Removes: all other users (+ related data), all bookings/calendar, staff roster, CarePartner records
 *
 * Usage: CONFIRM=1 bun run scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRESERVED_EMAILS = [
  "admin@sanative.com.au",
  "admin@satative.com.au", // common typo variant
  "member@sanative.com.au",
].map((e) => e.toLowerCase());

async function logDeleteCount(label: string, fn: () => Promise<{ count: number }>) {
  const { count: n } = await fn();
  console.log(`  ${label}: ${n}`);
  return n;
}

async function main() {
  if (process.env.CONFIRM !== "1") {
    console.error(
      "Refusing to run without CONFIRM=1.\n" +
        "Usage: CONFIRM=1 bun run scripts/cleanup-test-data.ts"
    );
    process.exit(1);
  }

  console.log("🧹 SANATIVE test data cleanup\n");
  console.log("Preserved accounts:", PRESERVED_EMAILS.join(", "));
  console.log("");

  const preservedUsers = await prisma.user.findMany({
    where: {
      email: { in: PRESERVED_EMAILS, mode: "insensitive" },
    },
    select: { id: true, email: true, role: true },
  });

  const preservedIds = new Set(preservedUsers.map((u) => u.id));
  console.log("Found preserved users:");
  for (const u of preservedUsers) {
    console.log(`  ✓ ${u.email} (${u.role})`);
  }
  for (const email of PRESERVED_EMAILS) {
    if (!preservedUsers.some((u) => u.email.toLowerCase() === email)) {
      console.log(`  ⚠ not in DB: ${email}`);
    }
  }
  console.log("");

  const usersToDelete = await prisma.user.findMany({
    where: {
      id: { notIn: [...preservedIds] },
    },
    select: { id: true, email: true, role: true },
  });

  const deleteIds = usersToDelete.map((u) => u.id);
  console.log(`Users to delete: ${deleteIds.length}`);
  console.log("");

  // ── Calendar & bookings (full wipe) ─────────────────────────────────────
  console.log("Clearing calendar & bookings...");
  await logDeleteCount("ConsultationBooking", () => prisma.consultationBooking.deleteMany());
  await logDeleteCount("Appointment", () => prisma.appointment.deleteMany());
  await logDeleteCount("PreTriageTask", () => prisma.preTriageTask.deleteMany());
  await logDeleteCount("DoctorAvailability", () => prisma.doctorAvailability.deleteMany());
  await logDeleteCount("DoctorBlockedDate", () => prisma.doctorBlockedDate.deleteMany());
  console.log("");

  // ── Staff roster (CarePartner table — separate from User) ───────────────
  console.log("Clearing staff roster (CarePartner)...");
  await logDeleteCount("MemberMessage", () => prisma.memberMessage.deleteMany());
  await logDeleteCount("ProgramCheckIn", () => prisma.programCheckIn.deleteMany());
  await logDeleteCount("CarePartner", () => prisma.carePartner.deleteMany());
  console.log("");

  // ── Program portal members (clinic enrollments) ─────────────────────────
  console.log("Clearing program members...");
  await logDeleteCount("ProgramMember", () => prisma.programMember.deleteMany());
  console.log("");

  // ── Orphan / non-cascading user-linked records ──────────────────────────
  if (deleteIds.length > 0) {
    console.log("Clearing related data for users being removed...");
    await logDeleteCount("ActivityLog", () =>
      prisma.activityLog.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("Treatment (+ doses via cascade)", () =>
      prisma.treatment.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("DailyStepGoal", () =>
      prisma.dailyStepGoal.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("WeightManagementPreferences", () =>
      prisma.weightManagementPreferences.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("SupportTicket", () =>
      prisma.supportTicket.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("ContentCompletion", () =>
      prisma.contentCompletion.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("CoachMessage", () =>
      prisma.coachMessage.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("ChatSession (+ messages)", () =>
      prisma.chatSession.deleteMany({ where: { memberId: { in: deleteIds } } })
    );
    await logDeleteCount("MemberChatHistory", () =>
      prisma.memberChatHistory.deleteMany({ where: { memberId: { in: deleteIds } } })
    );
    await logDeleteCount("CallLog", () =>
      prisma.callLog.deleteMany({ where: { memberId: { in: deleteIds } } })
    );
    await logDeleteCount("Referral", () =>
      prisma.referral.deleteMany({
        where: {
          OR: [
            { referrerId: { in: deleteIds } },
            { refereeId: { in: deleteIds } },
          ],
        },
      })
    );
    await logDeleteCount("SavedItem", () =>
      prisma.savedItem.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("CoachAvailability", () =>
      prisma.coachAvailability.deleteMany({ where: { coachId: { in: deleteIds } } })
    );
    await logDeleteCount("SMSNotification", () =>
      prisma.sMSNotification.deleteMany({ where: { recipientId: { in: deleteIds } } })
    );
    console.log("");
  }

  // ── Misc test artifacts ─────────────────────────────────────────────────
  console.log("Clearing verification codes & email events...");
  await logDeleteCount("VerificationCode", () => prisma.verificationCode.deleteMany());
  await logDeleteCount("EmailEvent", () => prisma.emailEvent.deleteMany());
  console.log("");

  // ── Delete users (cascades User-linked models) ──────────────────────────
  console.log("Deleting users...");
  const { count: usersDeleted } = await prisma.user.deleteMany({
    where: { id: { in: deleteIds } },
  });
  console.log(`  Users deleted: ${usersDeleted}`);
  console.log("");

  const remaining = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });

  console.log("✅ Cleanup complete. Remaining users:");
  for (const u of remaining) {
    console.log(`  ${u.email} (${u.role})`);
  }

  const bookingCount = await prisma.consultationBooking.count();
  const rosterCount = await prisma.doctorAvailability.count();
  console.log("");
  console.log(`Consultation bookings remaining: ${bookingCount}`);
  console.log(`Doctor roster slots remaining: ${rosterCount}`);
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
