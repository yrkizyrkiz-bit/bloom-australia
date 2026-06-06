import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🩺 Seeding doctor accounts...\n");

  // Test doctor accounts
  const doctors = [
    {
      email: "dr.smith@sanative.com.au",
      firstName: "James",
      lastName: "Smith",
      phone: "0412345678",
    },
    {
      email: "dr.chen@sanative.com.au",
      firstName: "Sarah",
      lastName: "Chen",
      phone: "0412345679",
    },
    {
      email: "dr.patel@sanative.com.au",
      firstName: "Raj",
      lastName: "Patel",
      phone: "0412345680",
    },
  ];

  const password = await bcrypt.hash("Doctor123!", 10);

  for (const doc of doctors) {
    const existing = await prisma.user.findUnique({
      where: { email: doc.email },
    });

    if (existing) {
      // Update to doctor role if not already
      if (existing.role !== "DOCTOR") {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "DOCTOR" },
        });
        console.log(`✓ Updated ${doc.firstName} ${doc.lastName} to DOCTOR role`);
      } else {
        console.log(`- ${doc.firstName} ${doc.lastName} already exists as DOCTOR`);
      }
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: doc.email,
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
        passwordHash: password,
        role: "DOCTOR",
        journeyStatus: "ACTIVE",
        subscriptionStatus: "ACTIVE",
      },
    });

    console.log(`✓ Created Dr. ${doc.firstName} ${doc.lastName} (${user.id})`);
  }

  console.log("\n📅 Seeding default availability for doctors...\n");

  // Get all doctors
  const allDoctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, firstName: true, lastName: true },
  });

  // Default schedule: Thu/Fri/Sat 9am-7pm
  const defaultSchedule = [
    { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" }, // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" }, // Friday
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" }, // Saturday
  ];

  for (const doctor of allDoctors) {
    // Check if already has schedule
    const existingSlots = await prisma.doctorAvailability.count({
      where: { doctorId: doctor.id },
    });

    if (existingSlots > 0) {
      console.log(`- Dr. ${doctor.firstName} ${doctor.lastName} already has ${existingSlots} slots`);
      continue;
    }

    // Create availability
    await prisma.doctorAvailability.createMany({
      data: defaultSchedule.map((slot) => ({
        doctorId: doctor.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: 30,
        isRecurring: true,
        maxBookings: 1,
        status: "AVAILABLE",
      })),
    });

    console.log(`✓ Created schedule for Dr. ${doctor.firstName} ${doctor.lastName}`);
  }

  console.log("\n✅ Doctor seeding complete!");
  console.log("\nLogin credentials:");
  console.log("  Email: dr.smith@sanative.com.au");
  console.log("  Password: Doctor123!");
}

main()
  .catch((e) => {
    console.error("Error seeding doctors:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
