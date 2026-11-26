import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/** Crockford-style alphabet: no 0/O, 1/I/L so codes stay readable. Length 32. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const BODY_LENGTH = 12;
const PREFIX = "SAN";

export const GIFT_CARD_PAYMENT_REF_PREFIX = "gift_";

export function isGiftCardPaymentRef(paymentIntentId: string): boolean {
  return paymentIntentId.startsWith(GIFT_CARD_PAYMENT_REF_PREFIX);
}

export function giftCardPaymentRef(giftCardId: string): string {
  return `${GIFT_CARD_PAYMENT_REF_PREFIX}${giftCardId}`;
}

export function generateGiftCardCode(): string {
  const bytes = randomBytes(BODY_LENGTH);
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return formatGiftCardBody(body);
}

function formatGiftCardBody(body: string): string {
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

/** Strip separators and uppercase. Accepts SAN-XXXX-XXXX-XXXX or the 12-char body. */
export function normalizeGiftCardCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.startsWith(PREFIX) && compact.length === PREFIX.length + BODY_LENGTH) {
    return compact;
  }
  if (compact.length === BODY_LENGTH) {
    return `${PREFIX}${compact}`;
  }
  return null;
}

export function formatGiftCardCode(input: string): string {
  const normalized = normalizeGiftCardCode(input);
  if (!normalized) return input.trim().toUpperCase();
  const body = normalized.slice(PREFIX.length);
  return formatGiftCardBody(body);
}

export async function findGiftCardByCode(code: string) {
  const normalized = normalizeGiftCardCode(code);
  if (!normalized) return null;
  return prisma.giftCard.findUnique({
    where: { codeNormalized: normalized },
  });
}

export async function findUnusedGiftCard(code: string) {
  const normalized = normalizeGiftCardCode(code);
  if (!normalized) return null;
  return prisma.giftCard.findFirst({
    where: { codeNormalized: normalized, usedAt: null },
    select: { id: true, code: true },
  });
}

/** Peek only — does not consume the code. */
export async function validateGiftCard(code: string): Promise<{
  valid: boolean;
  code?: string;
  error?: string;
}> {
  if (!normalizeGiftCardCode(code)) {
    return { valid: false, error: "Enter a valid gift card number." };
  }
  const unused = await findUnusedGiftCard(code);
  if (!unused) {
    return {
      valid: false,
      error: "This gift card is invalid or has already been used.",
    };
  }
  return { valid: true, code: unused.code };
}

/**
 * Atomically mark a card used. Returns null if missing or already used.
 * Call this at membership complete, not on validate.
 */
export async function claimGiftCard(code: string): Promise<{ id: string; code: string } | null> {
  const normalized = normalizeGiftCardCode(code);
  if (!normalized) return null;
  const now = new Date();
  const result = await prisma.giftCard.updateMany({
    where: { codeNormalized: normalized, usedAt: null },
    data: { usedAt: now },
  });
  if (result.count !== 1) return null;
  const card = await prisma.giftCard.findUnique({
    where: { codeNormalized: normalized },
    select: { id: true, code: true },
  });
  return card;
}

export async function releaseGiftCardClaim(id: string): Promise<void> {
  await prisma.giftCard.updateMany({
    where: { id, usedByUserId: null },
    data: { usedAt: null },
  });
}

export async function attachGiftCardUser(id: string, userId: string): Promise<void> {
  await prisma.giftCard.update({
    where: { id },
    data: { usedByUserId: userId },
  });
}

export async function issueGiftCards(count: number, batchId?: string): Promise<string[]> {
  if (!Number.isInteger(count) || count < 1 || count > 5000) {
    throw new Error("Issue between 1 and 5000 gift cards");
  }
  const batch = batchId || `batch_${new Date().toISOString().slice(0, 10)}_${randomBytes(3).toString("hex")}`;
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let created = false;
    for (let attempt = 0; attempt < 8 && !created; attempt++) {
      const code = generateGiftCardCode();
      const codeNormalized = normalizeGiftCardCode(code);
      if (!codeNormalized) continue;
      try {
        await prisma.giftCard.create({
          data: { code, codeNormalized, batchId: batch },
        });
        codes.push(code);
        created = true;
      } catch (error) {
        const duplicate =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "P2002";
        if (!duplicate || attempt === 7) throw error;
      }
    }
  }

  return codes;
}
