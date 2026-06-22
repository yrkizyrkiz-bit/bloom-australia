/**
 * Repair Harold Finch test member — hair-loss only, no weight leakage.
 *
 * Removes stale WEIGHT_MANAGEMENT entitlements created before cross-program
 * entitlement fixes, then re-syncs from current signals.
 *
 * Usage: bun run prisma/repair-haroldfinch-entitlements.ts
 */
import { PrismaClient } from "@prisma/client";
import { syncEntitlementsFromSignals } from "../src/lib/membership/entitlement-service";

const prisma = new PrismaClient();

const HAROLD_EMAIL = "haroldfinch@sanative.com.au";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: HAROLD_EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!user) {
    throw new Error(`Harold not found (${HAROLD_EMAIL})`);
  }

  console.log(`🔧 Repairing ${user.firstName} ${user.lastName} (${user.email})...\n`);

  await prisma.$transaction(async (tx) => {
    await tx.consultationBooking.updateMany({
      where: {
        userId: user.id,
        notes: { contains: "Hair Loss" },
      },
      data: { selectedPlan: null },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: "hair_loss",
        subscriptionStatus: "TRIAL",
        memberStatus: "MEMBER",
        journeyStatus: "PRE_TRIAGE_PENDING",
        approvalStatus: "PENDING",
      },
    });

    const wmIntakes = await tx.weightManagementIntake.deleteMany({
      where: { userId: user.id },
    });
    if (wmIntakes.count) {
      console.log(`  Removed ${wmIntakes.count} weight-management intake row(s)`);
    }

    await tx.memberProgram.deleteMany({ where: { userId: user.id } });

    const wmMembers = await tx.programMember.deleteMany({
      where: { userId: user.id, program: "WEIGHT_MANAGEMENT" },
    });
    if (wmMembers.count) {
      console.log(`  Removed ${wmMembers.count} weight ProgramMember row(s)`);
    }

    await tx.entitlement.updateMany({
      where: { userId: user.id, key: "WEIGHT_MANAGEMENT" },
      data: { status: "INACTIVE" },
    });
  });

  await syncEntitlementsFromSignals(user.id);

  const entitlements = await prisma.entitlement.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { key: "asc" }],
  });

  console.log("\n✅ Entitlements after repair:");
  for (const e of entitlements) {
    console.log(`  ${e.type} ${e.key}: ${e.status} (${e.source})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
