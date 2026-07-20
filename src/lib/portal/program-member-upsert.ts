import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function findProgramMemberByUserOrEmail(input: {
  userId: string;
  email?: string | null;
}) {
  const normalizedEmail = input.email?.toLowerCase().trim();
  return prisma.programMember.findFirst({
    where: {
      OR: [
        { userId: input.userId },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    },
    select: { id: true, intakeData: true, program: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertProgramMemberEnrollment(input: {
  userId: string;
  email: string;
  program: string;
  firstName: string;
  lastName: string;
  mobile: string;
  dob: Date;
  intakeData: Prisma.InputJsonValue;
  membershipStatus?: "PENDING" | "ACTIVE";
  membershipStart?: Date;
  membershipEnd?: Date;
}) {
  const existing = await findProgramMemberByUserOrEmail({
    userId: input.userId,
    email: input.email,
  });

  if (existing) {
    const current =
      existing.intakeData && typeof existing.intakeData === "object"
        ? (existing.intakeData as Record<string, unknown>)
        : {};
    const mergedIntake =
      typeof input.intakeData === "object" && input.intakeData !== null
        ? { ...current, ...(input.intakeData as Record<string, unknown>) }
        : input.intakeData;

    return prisma.programMember.update({
      where: { id: existing.id },
      data: {
        userId: input.userId,
        program: input.program,
        firstName: input.firstName,
        lastName: input.lastName,
        mobile: input.mobile,
        dob: input.dob,
        intakeData: mergedIntake as Prisma.InputJsonValue,
        membershipStatus: input.membershipStatus ?? "PENDING",
        ...(input.membershipStart ? { membershipStart: input.membershipStart } : {}),
        ...(input.membershipEnd ? { membershipEnd: input.membershipEnd } : {}),
      },
    });
  }

  const membershipStart = input.membershipStart ?? new Date();
  const membershipEnd =
    input.membershipEnd ??
    (() => {
      const end = new Date(membershipStart);
      end.setFullYear(end.getFullYear() + 1);
      return end;
    })();

  return prisma.programMember.create({
    data: {
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase().trim(),
      mobile: input.mobile,
      dob: input.dob,
      program: input.program,
      intakeData: input.intakeData,
      membershipStatus: input.membershipStatus ?? "PENDING",
      membershipStart,
      membershipEnd,
    },
  });
}
