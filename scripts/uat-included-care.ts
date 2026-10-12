import { prisma } from "../src/lib/prisma";
import {
  closeReservedIncludedCareSlot,
  getIncludedCarePolicy,
  includedCareAvailableFor,
  openIncludedCareForNewMember,
  reserveIncludedCareProgram,
  saveIncludedCarePolicy,
  useIncludedCareSlot,
} from "../src/lib/billing/included-care";

const failures: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`PASS ${name}`);
    return;
  }
  const line = detail ? `${name}: ${detail}` : name;
  failures.push(line);
  console.error(`FAIL ${line}`);
}

async function makeUser(tag: string) {
  return prisma.user.create({
    data: {
      email: `uat-included-care-${tag}-${Date.now()}@example.invalid`,
      firstName: "Uat",
      lastName: tag,
      role: "MEMBER",
    },
  });
}

async function main() {
  const original = await prisma.billingSettings.findUnique({ where: { id: "default" } });
  const restore = {
    enabled: original?.includedCareEnabled ?? true,
    includedDays: original?.includedCareDays ?? 30,
  };

  const createdIds: string[] = [];
  try {
    const legacy = await prisma.user.findMany({
      where: {
        email: {
          in: [
            "mariazekry@yahoo.co.uk",
            "tt@sanative.com",
            "george.zekry@sanative.com.au",
          ],
        },
      },
      select: { id: true, email: true, includedCareSlot: { select: { id: true } } },
    });
    check("legacy members found", legacy.length === 3, `found ${legacy.length}`);
    for (const member of legacy) {
      check(`${member.email} has no included-care slot`, member.includedCareSlot == null);
      const available = await includedCareAvailableFor(member.id, "HAIR_LOSS");
      check(`${member.email} cannot reserve a free program`, available === false);
    }

    await saveIncludedCarePolicy({ enabled: true, includedDays: 30 });
    const on = await getIncludedCarePolicy();
    check("policy on is 30 days with a 7 day lead", on.enabled && on.includedDays === 30 && on.chargeLeadDays === 7);

    const biomarkers = await makeUser("biomarkers");
    createdIds.push(biomarkers.id);
    await openIncludedCareForNewMember(biomarkers.id, "biomarkers");
    const openSlot = await prisma.includedCareSlot.findUnique({ where: { userId: biomarkers.id } });
    check("biomarkers signup leaves the slot open", openSlot?.status === "OPEN" && openSlot.programKey == null);
    check("open slot can take hair", await includedCareAvailableFor(biomarkers.id, "HAIR_LOSS"));
    const reserved = await reserveIncludedCareProgram({
      userId: biomarkers.id,
      programKey: "HAIR_LOSS",
      billingTerm: "12m",
    });
    check("hair reserve succeeds", reserved.reserved);
    const hairSlot = await prisma.includedCareSlot.findUnique({ where: { userId: biomarkers.id } });
    check("hair reserve stores annual term", hairSlot?.status === "RESERVED" && hairSlot.programKey === "HAIR_LOSS" && hairSlot.billingTerm === "12m");
    check("a second program cannot take the slot", (await includedCareAvailableFor(biomarkers.id, "WEIGHT_MANAGEMENT")) === false);
    const wrong = await useIncludedCareSlot({
      userId: biomarkers.id,
      programKey: "WEIGHT_MANAGEMENT",
      reason: "approved",
    });
    check("approving a different program does not consume the slot", wrong === false);
    const declined = await closeReservedIncludedCareSlot(biomarkers.id);
    const used = await prisma.includedCareSlot.findUnique({ where: { userId: biomarkers.id } });
    check("decline uses the reserved slot", declined && used?.status === "USED" && used.usedReason === "declined");
    check("a used slot cannot be reserved again", (await includedCareAvailableFor(biomarkers.id, "HAIR_LOSS")) === false);

    const hairSignup = await makeUser("hair");
    createdIds.push(hairSignup.id);
    await openIncludedCareForNewMember(hairSignup.id, "hair_loss");
    const hairOpen = await prisma.includedCareSlot.findUnique({ where: { userId: hairSignup.id } });
    check("hair signup reserves hair", hairOpen?.status === "RESERVED" && hairOpen.programKey === "HAIR_LOSS");
    const cancelled = await useIncludedCareSlot({
      userId: hairSignup.id,
      programKey: "HAIR_LOSS",
      reason: "cancelled",
    });
    const cancelledSlot = await prisma.includedCareSlot.findUnique({ where: { userId: hairSignup.id } });
    check("cancelling the reserved program uses the slot", cancelled && cancelledSlot?.usedReason === "cancelled");

    const clinical = await makeUser("clinical");
    createdIds.push(clinical.id);
    const product = await prisma.product.findFirst({
      where: { program: "HAIR_LOSS", isActive: true },
      select: { id: true },
    });
    if (!product) throw new Error("hair product missing");
    await prisma.memberSubscription.create({
      data: { userId: clinical.id, productId: product.id, status: "ACTIVE" },
    });
    await openIncludedCareForNewMember(clinical.id, "hair_loss");
    const clinicalSlot = await prisma.includedCareSlot.findUnique({ where: { userId: clinical.id } });
    check("a member who already has a program gets no slot", clinicalSlot == null);

    await saveIncludedCarePolicy({ enabled: false, includedDays: 30 });
    const off = await getIncludedCarePolicy();
    check("switch off disables included care and keeps the lead", off.enabled === false && off.chargeLeadDays === 7);
    const storedOff = await prisma.billingSettings.findUnique({ where: { id: "default" } });
    check("switch off keeps the day count for turning it back on", storedOff?.includedCareDays === 30 && storedOff.includedCareEnabled === false);
    const switched = await makeUser("switched-off");
    createdIds.push(switched.id);
    await openIncludedCareForNewMember(switched.id, "hair_loss");
    const switchedSlot = await prisma.includedCareSlot.findUnique({ where: { userId: switched.id } });
    check(
      "new signup while the switch is off does not get the offer",
      switchedSlot?.status === "USED" && switchedSlot.usedReason === "included_care_disabled"
    );
    check("that member cannot reserve", (await includedCareAvailableFor(switched.id, "HAIR_LOSS")) === false);
  } finally {
    await saveIncludedCarePolicy(restore).catch((err) => {
      console.error("FAILED to restore included care policy", err);
      failures.push("restore policy");
    });
    if (createdIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    }
    const restored = await prisma.billingSettings.findUnique({ where: { id: "default" } });
    check(
      "live policy restored",
      restored?.includedCareEnabled === restore.enabled && restored?.includedCareDays === restore.includedDays
    );
    await prisma.$disconnect();
  }

  if (failures.length) {
    console.error(`\n${failures.length} UAT check(s) failed`);
    process.exit(1);
  }
  console.log("\nIncluded-care UAT checks passed");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
