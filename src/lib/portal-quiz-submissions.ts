import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type SavePortalQuizInput = {
  userId: string;
  programKey: string;
  answers: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  intent?: string | null;
  source?: string;
};

export async function savePortalQuizSubmission(input: SavePortalQuizInput) {
  return prisma.portalQuizSubmission.create({
    data: {
      userId: input.userId,
      programKey: input.programKey,
      answers: input.answers as Prisma.InputJsonValue,
      result: (input.result ?? undefined) as Prisma.InputJsonValue | undefined,
      intent: input.intent ?? undefined,
      source: input.source ?? "in_portal",
    },
  });
}

/** Latest submission per programKey, newest first within each program. */
export async function getLatestPortalQuizSubmissions(userId: string) {
  const rows = await prisma.portalQuizSubmission.findMany({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });

  const byProgram = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!byProgram.has(row.programKey)) {
      byProgram.set(row.programKey, row);
    }
  }
  return Array.from(byProgram.values()).sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
  );
}

export async function getPortalQuizHistory(userId: string, programKey: string) {
  return prisma.portalQuizSubmission.findMany({
    where: { userId, programKey },
    orderBy: { submittedAt: "desc" },
    take: 10,
  });
}
