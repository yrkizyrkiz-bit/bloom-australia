/**
 * Backfill calculated biomarkers for all members from existing lab results.
 * Safe to re-run — skips values already stored for each test date.
 *
 * Usage: bun run scripts/backfill-derived-biomarkers.ts
 */

import prisma from "../src/lib/prisma";
import { persistDerivedBiomarkersForUser } from "../src/lib/persist-derived-biomarkers";

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  let totalCreated = 0;

  for (const user of users) {
    const result = await persistDerivedBiomarkersForUser(user.id);
    if (result.created > 0) {
      console.log(
        `${user.email}: +${result.created} (${result.derived.map(d => d.biomarkerId).join(", ")})`
      );
      totalCreated += result.created;
    }
  }

  console.log(`\nDone. ${totalCreated} derived results created across ${users.length} members.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
