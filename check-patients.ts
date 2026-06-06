import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPatients() {
  // Find users with names containing yyy or ggg
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: 'yyy', mode: 'insensitive' } },
        { firstName: { contains: 'ggg', mode: 'insensitive' } },
        { lastName: { contains: 'yyy', mode: 'insensitive' } },
        { lastName: { contains: 'ggg', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gender: true,
      phone: true,
      createdAt: true,
    }
  });

  console.log('=== USERS FOUND ===');
  console.log(JSON.stringify(users, null, 2));

  // Check WeightManagementIntake for these users
  for (const user of users) {
    const intake = await prisma.weightManagementIntake.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        selectedPlan: true,
        quizData: true,
        portalStatus: true,
        createdAt: true,
      }
    });

    console.log(`\n=== INTAKE FOR ${user.firstName} ${user.lastName} ===`);
    if (intake) {
      console.log('Intake ID:', intake.id);
      console.log('Selected Plan:', intake.selectedPlan);
      console.log('Portal Status:', intake.portalStatus);
      console.log('Quiz Data:', JSON.stringify(intake.quizData, null, 2));
    } else {
      console.log('NO INTAKE RECORD FOUND');
    }
  }

  // Also check consultation bookings
  for (const user of users) {
    const bookings = await prisma.consultationBooking.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
      }
    });
    console.log(`\n=== BOOKINGS FOR ${user.firstName} ===`);
    console.log(JSON.stringify(bookings, null, 2));
  }

  await prisma.$disconnect();
}

checkPatients().catch(console.error);
