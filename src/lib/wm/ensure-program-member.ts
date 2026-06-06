import { prisma } from "@/lib/prisma";
import { isWeightManagementUser } from "./is-wm-user";

const WM_PROGRAM = "weight_management";

async function resolveCarePartnerRecord(assignedUserId: string | null) {
  if (!assignedUserId) return null;

  const staff = await prisma.user.findUnique({
    where: { id: assignedUserId },
    select: { email: true, firstName: true, lastName: true, role: true },
  });

  if (!staff?.email) return null;

  let partner = await prisma.carePartner.findUnique({
    where: { email: staff.email },
  });

  if (!partner) {
    partner = await prisma.carePartner.create({
      data: {
        firstName: staff.firstName || "Care",
        lastName: staff.lastName || "Partner",
        email: staff.email,
        programs: [WM_PROGRAM],
        active: true,
      },
    });
  } else if (!partner.programs.includes(WM_PROGRAM)) {
    partner = await prisma.carePartner.update({
      where: { id: partner.id },
      data: { programs: [...partner.programs, WM_PROGRAM] },
    });
  }

  return partner.id;
}

/**
 * Ensures a ProgramMember row exists for WM dashboard messaging only.
 * Does not modify non–weight-management ProgramMember records.
 */
export async function ensureWMProgramMember(userId: string) {
  if (!(await isWeightManagementUser(userId))) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      assignedCarePartnerId: true,
    },
  });

  if (!user?.email) return null;

  const carePartnerId = await resolveCarePartnerRecord(user.assignedCarePartnerId);

  const existing = await prisma.programMember.findUnique({
    where: { email: user.email },
  });

  if (existing) {
    if (existing.program !== WM_PROGRAM && existing.program !== "WEIGHT_MANAGEMENT") {
      return existing;
    }

    return prisma.programMember.update({
      where: { id: existing.id },
      data: {
        userId: user.id,
        firstName: user.firstName || existing.firstName,
        lastName: user.lastName || existing.lastName,
        mobile: user.phone || existing.mobile,
        ...(carePartnerId ? { carePartnerId } : {}),
        program: WM_PROGRAM,
      },
    });
  }

  const dob = user.dateOfBirth || new Date("1990-01-01");
  const membershipEnd = new Date();
  membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);

  return prisma.programMember.create({
    data: {
      userId: user.id,
      email: user.email,
      firstName: user.firstName || "Member",
      lastName: user.lastName || "",
      mobile: user.phone || "0400000000",
      dob,
      program: WM_PROGRAM,
      membershipStatus: "ACTIVE",
      membershipEnd,
      carePartnerId: carePartnerId || undefined,
      intakeData: { source: "wm_portal_bridge" },
    },
  });
}
