import prisma from "../src/lib/prisma";

async function main() {
  const email = "sue@sanative.com.au";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, gender: true, subscriptionTier: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log("Before:", user);

  const updated = await prisma.user.update({
    where: { email },
    data: { gender: "FEMALE" },
    select: { id: true, email: true, gender: true, subscriptionTier: true },
  });

  console.log("After:", updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
