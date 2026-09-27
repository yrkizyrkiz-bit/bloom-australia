/**
 * Delete MEMBER accounts except Maria, Tianna, and George.
 * Preserves ADMIN / SUPER_ADMIN / DOCTOR and all of their (and the three kept members') data.
 *
 * Usage: CONFIRM=1 bun run scripts/delete-members-except-core.ts
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_MEMBER_EMAILS = [
  "mariazekry@yahoo.co.uk",
  "tt@sanative.com",
  "george.zekry@sanative.com.au",
].map((e) => e.toLowerCase());

const STAFF_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN", "DOCTOR"];

async function logDelete(label: string, fn: () => Promise<{ count: number }>) {
  try {
    const { count } = await fn();
    console.log(`  ${label}: ${count}`);
    return count;
  } catch (error) {
    console.log(`  ${label}: skipped (${(error as Error).message.split("\n")[0]})`);
    return 0;
  }
}

async function main() {
  if (process.env.CONFIRM !== "1") {
    console.error("Refusing without CONFIRM=1");
    process.exit(1);
  }

  const preserved = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: STAFF_ROLES } },
        { email: { in: KEEP_MEMBER_EMAILS, mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  const keepIds = preserved.map((u) => u.id);

  const toDelete = await prisma.user.findMany({
    where: { id: { notIn: keepIds } },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
    orderBy: { email: "asc" },
  });
  const deleteIds = toDelete.map((u) => u.id);
  const deleteEmails = toDelete.map((u) => u.email.toLowerCase());

  console.log("Keeping:");
  for (const u of preserved) console.log(`  ✓ ${u.role} ${u.email}`);
  console.log("\nDeleting:");
  for (const u of toDelete) {
    console.log(`  - ${u.role} ${u.email} (${u.firstName} ${u.lastName})`);
  }
  if (deleteIds.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log("\nRelated rows (scoped to deleted members only)...");

  const bookingIds = (
    await prisma.consultationBooking.findMany({
      where: { userId: { in: deleteIds } },
      select: { id: true },
    })
  ).map((b) => b.id);

  if (bookingIds.length > 0) {
    await logDelete("BookingChangeLog (by booking)", () =>
      prisma.bookingChangeLog.deleteMany({ where: { bookingId: { in: bookingIds } } })
    );
  }
  await logDelete("BookingChangeLog (as changer)", () =>
    prisma.bookingChangeLog.deleteMany({ where: { changedByUserId: { in: deleteIds } } })
  );
  await logDelete("ConsultationBooking", () =>
    prisma.consultationBooking.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Appointment", () =>
    prisma.appointment.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("PreTriageTask", () =>
    prisma.preTriageTask.deleteMany({ where: { patientId: { in: deleteIds } } })
  );

  await logDelete("ChatSession", () =>
    prisma.chatSession.deleteMany({ where: { memberId: { in: deleteIds } } })
  );
  await logDelete("MemberChatHistory", () =>
    prisma.memberChatHistory.deleteMany({ where: { memberId: { in: deleteIds } } })
  );
  await logDelete("CallLog", () =>
    prisma.callLog.deleteMany({ where: { memberId: { in: deleteIds } } })
  );
  await logDelete("CoachMessage", () =>
    prisma.coachMessage.deleteMany({ where: { userId: { in: deleteIds } } })
  );

  await logDelete("MemberSubscriptionHistory", () =>
    prisma.memberSubscriptionHistory.deleteMany({
      where: { memberSubscription: { userId: { in: deleteIds } } },
    })
  );
  await logDelete("MemberSubscription", () =>
    prisma.memberSubscription.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("MembershipSubscription", () =>
    prisma.membershipSubscription.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Entitlement", () =>
    prisma.entitlement.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("PortalQuizSubmission", () =>
    prisma.portalQuizSubmission.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Invoice", () =>
    prisma.invoice.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("MemberProgram", () =>
    prisma.memberProgram.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("WeightManagementIntake", () =>
    prisma.weightManagementIntake.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("WmMealPlanWeek", () =>
    prisma.wmMealPlanWeek.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Prescription", () =>
    prisma.prescription.deleteMany({ where: { patientId: { in: deleteIds } } })
  );
  await logDelete("ConsentRecord", () =>
    prisma.consentRecord.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Treatment", () =>
    prisma.treatment.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("ActivityLog", () =>
    prisma.activityLog.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("DailyStepGoal", () =>
    prisma.dailyStepGoal.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("WeightManagementPreferences", () =>
    prisma.weightManagementPreferences.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("SupportTicket", () =>
    prisma.supportTicket.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("ContentCompletion", () =>
    prisma.contentCompletion.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("SavedItem", () =>
    prisma.savedItem.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("InternalNote", () =>
    prisma.internalNote.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("CareCommunication", () =>
    prisma.careCommunication.deleteMany({ where: { userId: { in: deleteIds } } })
  );
  await logDelete("Referral", () =>
    prisma.referral.deleteMany({
      where: {
        OR: [{ referrerId: { in: deleteIds } }, { refereeId: { in: deleteIds } }],
      },
    })
  );
  await logDelete("SMSNotification", () =>
    prisma.sMSNotification.deleteMany({ where: { recipientId: { in: deleteIds } } })
  );
  await logDelete("CoachAvailability", () =>
    prisma.coachAvailability.deleteMany({ where: { coachId: { in: deleteIds } } })
  );

  const programMembers = await prisma.programMember.findMany({
    where: {
      OR: [
        { userId: { in: deleteIds } },
        { email: { in: deleteEmails, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  const pmIds = programMembers.map((p) => p.id);
  if (pmIds.length > 0) {
    await logDelete("ProgramCheckIn", () =>
      prisma.programCheckIn.deleteMany({ where: { memberId: { in: pmIds } } })
    );
    await logDelete("MemberMessage", () =>
      prisma.memberMessage.deleteMany({ where: { memberId: { in: pmIds } } })
    );
    await logDelete("MemberNotification", () =>
      prisma.memberNotification.deleteMany({ where: { memberId: { in: pmIds } } })
    );
    await logDelete("ProgramBiomarkerResult", () =>
      prisma.programBiomarkerResult.deleteMany({ where: { memberId: { in: pmIds } } })
    );
    await logDelete("QrScanEvent", () =>
      prisma.qrScanEvent.deleteMany({ where: { memberId: { in: pmIds } } })
    );
    await logDelete("ProgramMember", () =>
      prisma.programMember.deleteMany({ where: { id: { in: pmIds } } })
    );
  }

  // Best-effort for optional models
  if ("lead" in prisma) {
    await logDelete("Lead", () =>
      // @ts-expect-error optional in some schemas
      prisma.lead.deleteMany({ where: { userId: { in: deleteIds } } })
    );
  }

  console.log("\nDeleting users (cascades remaining)...");
  const { count } = await prisma.user.deleteMany({ where: { id: { in: deleteIds } } });
  console.log(`  Users deleted: ${count}`);

  const remaining = await prisma.user.findMany({
    select: { email: true, role: true, firstName: true, lastName: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  console.log("\nRemaining users:");
  for (const u of remaining) {
    console.log(`  ${u.role} ${u.email} — ${u.firstName} ${u.lastName}`);
  }
}

main()
  .catch((err) => {
    console.error("Delete failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
