/**
 * Dev/test database cleanup for end-to-end portal testing.
 *
 * Preserves: staff users (ADMIN, SUPER_ADMIN, CARE_PARTNER, DOCTOR)
 * Removes: all MEMBER accounts (+ cascaded data), bookings, triage, program enrollments
 *
 * Optional: KEEP_EMAILS=one@x.com,two@y.com to preserve specific member accounts
 *
 * Usage: CONFIRM=1 bun run scripts/cleanup-test-data.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const STAFF_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN", "CARE_PARTNER", "DOCTOR"];

const DEFAULT_PRESERVED_EMAILS = [
  "admin@sanative.com.au",
  "admin@satative.com.au",
].map((e) => e.toLowerCase());

function preservedEmails(): string[] {
  const extra = (process.env.KEEP_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_PRESERVED_EMAILS, ...extra])];
}

async function logDeleteCount(label: string, fn: () => Promise<{ count: number }>) {
  const { count: n } = await fn();
  console.log(`  ${label}: ${n}`);
  return n;
}

async function main() {
  if (process.env.CONFIRM !== "1") {
    console.error(
      "Refusing to run without CONFIRM=1.\n" +
        "Usage: CONFIRM=1 bun run scripts/cleanup-test-data.ts\n" +
        "Optional: KEEP_EMAILS=member@sanative.com.au bun run db:cleanup-test"
    );
    process.exit(1);
  }

  const keepEmails = preservedEmails();

  console.log("🧹 SANATIVE member & test data cleanup\n");
  console.log("Preserved staff roles:", STAFF_ROLES.join(", "));
  console.log("Also preserved emails:", keepEmails.join(", ") || "(none extra)");
  console.log("");

  const preservedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: STAFF_ROLES } },
        { email: { in: keepEmails, mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });

  const preservedIds = new Set(preservedUsers.map((u) => u.id));
  console.log("Preserved users:");
  for (const u of preservedUsers) {
    console.log(`  ✓ ${u.email} (${u.role})`);
  }
  console.log("");

  const usersToDelete = await prisma.user.findMany({
    where: { id: { notIn: [...preservedIds] } },
    select: { id: true, email: true, role: true, memberStatus: true, journeyStatus: true },
    orderBy: { email: "asc" },
  });

  const deleteIds = usersToDelete.map((u) => u.id);
  console.log(`Members / potential members to delete: ${deleteIds.length}`);
  for (const u of usersToDelete) {
    console.log(`  - ${u.email} (${u.role}, ${u.memberStatus}, ${u.journeyStatus})`);
  }
  console.log("");

  // ── Calendar, bookings & triage (full wipe — includes orphan holds) ───────
  console.log("Clearing calendar, bookings & triage...");
  await logDeleteCount("BookingChangeLog", () => prisma.bookingChangeLog.deleteMany());
  await logDeleteCount("ConsultationBooking", () => prisma.consultationBooking.deleteMany());
  await logDeleteCount("Appointment", () => prisma.appointment.deleteMany());
  await logDeleteCount("PreTriageTask", () => prisma.preTriageTask.deleteMany());
  console.log("");

  // ── Clinic program enrollments (GP portal) ───────────────────────────────
  console.log("Clearing clinic program enrollments...");
  await logDeleteCount("ProgramCheckIn", () => prisma.programCheckIn.deleteMany());
  await logDeleteCount("MemberMessage (program)", () => prisma.memberMessage.deleteMany());
  await logDeleteCount("MemberNotification (program)", () => prisma.memberNotification.deleteMany());
  await logDeleteCount("ProgramBiomarkerResult", () => prisma.programBiomarkerResult.deleteMany());
  await logDeleteCount("QrScanEvent", () => prisma.qrScanEvent.deleteMany());
  await logDeleteCount("ProgramMember", () => prisma.programMember.deleteMany());
  await logDeleteCount("GpReferral", () => prisma.gpReferral.deleteMany());
  console.log("");

  // ── Billing / portal purchase artifacts (before user delete) ─────────────
  console.log("Clearing billing & portal records for removed members...");
  if (deleteIds.length > 0) {
    await logDeleteCount("MemberSubscriptionHistory", () =>
      prisma.memberSubscriptionHistory.deleteMany({
        where: { memberSubscription: { userId: { in: deleteIds } } },
      })
    );
    await logDeleteCount("MemberSubscription", () =>
      prisma.memberSubscription.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("MembershipSubscription", () =>
      prisma.membershipSubscription.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("Entitlement", () =>
      prisma.entitlement.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("PortalQuizSubmission", () =>
      prisma.portalQuizSubmission.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("Invoice", () =>
      prisma.invoice.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("MemberProgram", () =>
      prisma.memberProgram.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("WeightManagementIntake", () =>
      prisma.weightManagementIntake.deleteMany({ where: { userId: { in: deleteIds } } })
    );
  }
  console.log("");

  // ── Orphan / non-cascading user-linked records ───────────────────────────
  if (deleteIds.length > 0) {
    console.log("Clearing remaining related data for users being removed...");
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
          OR: [{ referrerId: { in: deleteIds } }, { refereeId: { in: deleteIds } }],
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
    await logDeleteCount("InternalNote", () =>
      prisma.internalNote.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    await logDeleteCount("CareCommunication", () =>
      prisma.careCommunication.deleteMany({ where: { userId: { in: deleteIds } } })
    );
    console.log("");
  }

  // ── Misc test artifacts ─────────────────────────────────────────────────
  console.log("Clearing verification codes & email events...");
  await logDeleteCount("VerificationCode", () => prisma.verificationCode.deleteMany());
  await logDeleteCount("EmailEvent", () => prisma.emailEvent.deleteMany());
  console.log("");

  // ── Delete member users (cascades remaining User-linked models) ──────────
  console.log("Deleting member accounts...");
  const { count: usersDeleted } = await prisma.user.deleteMany({
    where: { id: { in: deleteIds } },
  });
  console.log(`  Users deleted: ${usersDeleted}`);
  console.log("");

  const remaining = await prisma.user.findMany({
    select: { email: true, role: true, memberStatus: true },
    orderBy: { email: "asc" },
  });

  console.log("✅ Cleanup complete. Remaining users:");
  for (const u of remaining) {
    console.log(`  ${u.email} (${u.role}, ${u.memberStatus})`);
  }

  const [bookings, triage, entitlements, quizSubs, invoices] = await Promise.all([
    prisma.consultationBooking.count(),
    prisma.preTriageTask.count(),
    prisma.entitlement.count(),
    prisma.portalQuizSubmission.count(),
    prisma.invoice.count(),
  ]);

  console.log("");
  console.log("Remaining records:");
  console.log(`  Consultation bookings: ${bookings}`);
  console.log(`  Pre-triage tasks: ${triage}`);
  console.log(`  Entitlements: ${entitlements}`);
  console.log(`  Portal quiz submissions: ${quizSubs}`);
  console.log(`  Invoices: ${invoices}`);
  console.log("");
  console.log("You can create fresh test members via signup, magic link, or:");
  console.log("  bun run scripts/create-test-member.ts");
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
