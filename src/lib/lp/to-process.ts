import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const TO_PROCESS_STATUS = {
  lead: "lead",
  paid: "paid",
  quizComplete: "quiz_complete",
} as const;

export type ToProcessRow = {
  id: string;
  accessToken: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentStart: Date | null;
  emailsSentAt: Date | null;
  stripePaymentIntentId: string | null;
};

function asJson(value: unknown) {
  return JSON.stringify(value ?? {});
}

function isLockedStatus(status: string) {
  return status === TO_PROCESS_STATUS.paid || status === TO_PROCESS_STATUS.quizComplete;
}

export async function findToProcessByPaymentIntent(stripePaymentIntentId: string) {
  if (!stripePaymentIntentId) return null;
  const rows = await prisma.$queryRaw<ToProcessRow[]>`
    SELECT id, "accessToken", status, "firstName", "lastName", email, phone,
           "appointmentStart", "emailsSentAt", "stripePaymentIntentId"
    FROM "to_process"
    WHERE "stripePaymentIntentId" = ${stripePaymentIntentId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findToProcessByAccessToken(accessToken: string) {
  if (!accessToken) return null;
  const rows = await prisma.$queryRaw<ToProcessRow[]>`
    SELECT id, "accessToken", status, "firstName", "lastName", email, phone,
           "appointmentStart", "emailsSentAt", "stripePaymentIntentId"
    FROM "to_process"
    WHERE "accessToken" = ${accessToken}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findOpenToProcessLeadByEmail(email: string) {
  if (!email) return null;
  const rows = await prisma.$queryRaw<ToProcessRow[]>`
    SELECT id, "accessToken", status, "firstName", "lastName", email, phone,
           "appointmentStart", "emailsSentAt", "stripePaymentIntentId"
    FROM "to_process"
    WHERE email = ${email} AND status = ${TO_PROCESS_STATUS.lead}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

type UpsertLeadInput = {
  accessToken?: string | null;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  appointmentSlotId?: string | null;
  appointmentStart?: Date | null;
  appointmentEnd?: Date | null;
  appointmentType: string;
  stripePaymentIntentId?: string | null;
  amountCents: number;
  source: string;
  utm: unknown;
  quizAnswers?: Record<string, string> | null;
};

async function resolveExistingLead(input: UpsertLeadInput) {
  const token = String(input.accessToken || "").trim();
  if (token.length >= 32) {
    const byToken = await findToProcessByAccessToken(token);
    if (byToken) return byToken;
  }
  const pi = String(input.stripePaymentIntentId || "").trim();
  if (pi.startsWith("pi_")) {
    const byPi = await findToProcessByPaymentIntent(pi);
    if (byPi) return byPi;
  }
  return findOpenToProcessLeadByEmail(input.email);
}

export async function upsertToProcessLead(input: UpsertLeadInput): Promise<ToProcessRow> {
  const existing = await resolveExistingLead(input);
  if (existing) {
    if (isLockedStatus(existing.status)) return existing;
    const now = new Date();
    const pi = String(input.stripePaymentIntentId || "").trim();
    await prisma.$executeRawUnsafe(
      `UPDATE "to_process"
       SET "firstName" = $1,
           "lastName" = CASE WHEN NULLIF($2, '') IS NULL THEN "lastName" ELSE $2 END,
           email = $3,
           phone = CASE WHEN NULLIF($4, '') IS NULL THEN phone ELSE $4 END,
           "appointmentSlotId" = COALESCE($5, "appointmentSlotId"),
           "appointmentStart" = COALESCE($6, "appointmentStart"),
           "appointmentEnd" = COALESCE($7, "appointmentEnd"),
           "appointmentType" = $8,
           "stripePaymentIntentId" = COALESCE(NULLIF($9, ''), "stripePaymentIntentId"),
           "amountCents" = $10,
           utm = $11::jsonb,
           "quizAnswers" = COALESCE($12::jsonb, "quizAnswers"),
           "updatedAt" = $13
       WHERE id = $14
         AND status = $15`,
      input.firstName,
      input.lastName ?? "",
      input.email,
      input.phone ?? "",
      input.appointmentSlotId ?? null,
      input.appointmentStart ?? null,
      input.appointmentEnd ?? null,
      input.appointmentType,
      pi.startsWith("pi_") ? pi : "",
      input.amountCents,
      asJson(input.utm),
      input.quizAnswers ? asJson(input.quizAnswers) : null,
      now,
      existing.id,
      TO_PROCESS_STATUS.lead
    );
    return {
      ...existing,
      firstName: input.firstName,
      lastName: input.lastName || existing.lastName,
      email: input.email,
      phone: input.phone || existing.phone,
      appointmentStart: input.appointmentStart ?? existing.appointmentStart,
      stripePaymentIntentId: pi.startsWith("pi_") ? pi : existing.stripePaymentIntentId,
    };
  }

  return createToProcess({
    ...input,
    stripePaymentIntentId: String(input.stripePaymentIntentId || "").trim() || null,
    status: TO_PROCESS_STATUS.lead,
  });
}

export async function createToProcess(input: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  appointmentSlotId?: string | null;
  appointmentStart?: Date | null;
  appointmentEnd?: Date | null;
  appointmentType: string;
  stripePaymentIntentId?: string | null;
  amountCents: number;
  source: string;
  utm: unknown;
  status?: string;
  quizAnswers?: Record<string, string> | null;
}) {
  const id = randomUUID();
  const accessToken = randomBytes(32).toString("hex");
  const now = new Date();
  const status = input.status || TO_PROCESS_STATUS.paid;
  const paymentIntentId = String(input.stripePaymentIntentId || "").trim() || null;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "to_process" (
        id, "accessToken", status, source, "firstName", "lastName", email, phone,
        "appointmentSlotId", "appointmentStart", "appointmentEnd", "appointmentType",
        "stripePaymentIntentId", "amountCents", utm, "quizAnswers", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17, $18
      )`,
      id,
      accessToken,
      status,
      input.source,
      input.firstName,
      input.lastName ?? "",
      input.email,
      input.phone ?? "",
      input.appointmentSlotId ?? null,
      input.appointmentStart ?? null,
      input.appointmentEnd ?? null,
      input.appointmentType,
      paymentIntentId,
      input.amountCents,
      asJson(input.utm),
      input.quizAnswers ? asJson(input.quizAnswers) : null,
      now,
      now
    );
  } catch (error) {
    if (paymentIntentId) {
      const existing = await findToProcessByPaymentIntent(paymentIntentId);
      if (existing) return existing;
    }
    const existingLead = await findOpenToProcessLeadByEmail(input.email);
    if (existingLead) return existingLead;
    throw error;
  }
  return {
    id,
    accessToken,
    status,
    firstName: input.firstName,
    lastName: input.lastName ?? "",
    email: input.email,
    phone: input.phone ?? "",
    appointmentStart: input.appointmentStart ?? null,
    emailsSentAt: null,
    stripePaymentIntentId: paymentIntentId,
  } satisfies ToProcessRow;
}

export async function markToProcessPaid(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    appointmentSlotId: string;
    appointmentStart: Date;
    appointmentEnd: Date;
    stripePaymentIntentId: string;
  }
) {
  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE "to_process"
     SET "firstName" = $1,
         "lastName" = $2,
         email = $3,
         phone = $4,
         "appointmentSlotId" = $5,
         "appointmentStart" = $6,
         "appointmentEnd" = $7,
         "stripePaymentIntentId" = $8,
         status = CASE WHEN status = $9 THEN status ELSE $10 END,
         "updatedAt" = $11
     WHERE id = $12`,
    input.firstName,
    input.lastName,
    input.email,
    input.phone,
    input.appointmentSlotId,
    input.appointmentStart,
    input.appointmentEnd,
    input.stripePaymentIntentId,
    TO_PROCESS_STATUS.quizComplete,
    TO_PROCESS_STATUS.paid,
    now,
    id
  );
  const rows = await prisma.$queryRaw<ToProcessRow[]>`
    SELECT id, "accessToken", status, "firstName", "lastName", email, phone,
           "appointmentStart", "emailsSentAt", "stripePaymentIntentId"
    FROM "to_process"
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function markToProcessEmailsSent(id: string) {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "to_process" SET "emailsSentAt" = ${now}, "updatedAt" = ${now} WHERE id = ${id}
  `;
}

export async function saveToProcessQuiz(
  id: string,
  answers: Record<string, string>,
  status?: string
) {
  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE "to_process"
     SET "quizAnswers" = $1::jsonb, status = COALESCE($2, status), "updatedAt" = $3
     WHERE id = $4`,
    asJson(answers),
    status ?? null,
    now,
    id
  );
}
