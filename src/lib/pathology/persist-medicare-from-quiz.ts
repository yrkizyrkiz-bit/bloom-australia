import { prisma } from "@/lib/prisma";
import { parseMedicareNumber } from "@/lib/medicare-number";

/** Save a quiz Medicare answer onto program-member intake so pathology referrals can read it. */
export async function persistMedicareFromQuizAnswers(
  userId: string,
  answers: Record<string, string>
): Promise<void> {
  const parsed = parseMedicareNumber(answers.medicareNumber);
  if (!parsed) return;

  const members = await prisma.programMember.findMany({
    where: { userId },
    select: { id: true, intakeData: true },
  });

  await Promise.all(
    members.map((member) => {
      const current =
        member.intakeData && typeof member.intakeData === "object" && !Array.isArray(member.intakeData)
          ? (member.intakeData as Record<string, unknown>)
          : {};
      return prisma.programMember.update({
        where: { id: member.id },
        data: {
          intakeData: {
            ...current,
            medicareNumber: parsed.cardNumber,
            medicareIrn: parsed.irn ?? "",
            medicareExpiry:
              parsed.expiryMonth && parsed.expiryYear
                ? `${parsed.expiryMonth}/${parsed.expiryYear}`
                : "",
          },
        },
      });
    })
  );
}
