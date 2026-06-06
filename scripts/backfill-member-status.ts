import prisma from "../src/lib/prisma";
import { derivePortalMemberStatus } from "../src/lib/member-status";

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      subscriptionStatus: true,
      journeyStatus: true,
      consultationBookings: {
        where: { status: "BOOKING_CONFIRMED" },
        select: { id: true },
        take: 1,
      },
    },
  });

  let updated = 0;

  for (const user of users) {
    const memberStatus = derivePortalMemberStatus({
      subscriptionStatus: user.subscriptionStatus,
      journeyStatus: user.journeyStatus,
      hasConfirmedBooking: user.consultationBookings.length > 0,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { memberStatus },
    });
    updated++;
  }

  console.log(`Backfilled memberStatus for ${updated} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
