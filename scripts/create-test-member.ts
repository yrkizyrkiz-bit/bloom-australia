import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "member@sanative.com.au";
const PASSWORD = "demo123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const member = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      role: "MEMBER",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "LEAD",
    },
    create: {
      email: EMAIL,
      passwordHash,
      firstName: "Test",
      lastName: "Member",
      dateOfBirth: new Date("1990-06-15"),
      gender: "OTHER",
      role: "MEMBER",
      subscriptionStatus: "ACTIVE",
      subscriptionTier: "core",
      phone: "+61 400 111 222",
      journeyStatus: "LEAD",
    },
  });

  console.log("Test member ready:");
  console.log(`  Email:    ${member.email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Role:     ${member.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
