import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@sanative.com.au";
  const password = "admin123"; // Matches the demo credentials on login page

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("Admin user already exists:", existing.email, "Role:", existing.role);

    // Update to ADMIN role if not already
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log("Updated role to ADMIN");
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      passwordHash,
      gender: "OTHER",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
    },
  });

  console.log("Created admin user:");
  console.log("  Email:", admin.email);
  console.log("  Password:", password);
  console.log("  Role:", admin.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
