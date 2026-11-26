import { issueGiftCards } from "../src/lib/gift-cards";
import prisma from "../src/lib/prisma";

const count = Number(process.argv[2] || 100);

async function main() {
  const codes = await issueGiftCards(count);
  console.log(`Issued ${codes.length} single-use Sanative membership gift cards:\n`);
  for (const code of codes) {
    console.log(code);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
