/** Australian Medicare card number (10 digits), IRN, and valid-to date. */

export const MEDICARE_NUMBER_ERROR =
  "Please check the number on your Medicare card and try again.";

/** Weights for the first 8 digits; digit 9 is the check, digit 10 is the issue number. */
const CARD_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9] as const;

export type MedicareIntakeParts = {
  group4: string;
  group5: string;
  group1: string;
  irn: string;
  expiryMonth: string;
  expiryYear: string;
};

export type ParsedMedicareNumber = {
  cardNumber: string;
  irn?: string;
  expiryMonth?: string;
  expiryYear?: string;
  formatted: string;
};

export const EMPTY_MEDICARE_PARTS: MedicareIntakeParts = {
  group4: "",
  group5: "",
  group1: "",
  irn: "",
  expiryMonth: "",
  expiryYear: "",
};

export function digitsOnlyMedicare(raw: string): string {
  return raw.replace(/\D/g, "");
}

function hasValidMedicareChecksum(cardNumber: string): boolean {
  if (!/^[2-6]\d{9}$/.test(cardNumber)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    sum += Number(cardNumber[i]) * CARD_WEIGHTS[i];
  }
  return sum % 10 === Number(cardNumber[8]);
}

export function formatMedicareNumber(cardNumber: string, irn?: string): string {
  const grouped = `${cardNumber.slice(0, 4)} ${cardNumber.slice(4, 9)} ${cardNumber.slice(9)}`;
  return irn ? `${grouped} ${irn}` : grouped;
}

function isValidExpiry(month: string, year: string): boolean {
  if (!/^(0[1-9]|1[0-2])$/.test(month)) return false;
  if (!/^20\d{2}$/.test(year)) return false;
  const expYear = Number(year);
  const expMonth = Number(month);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  if (expYear > currentYear + 15) return false;
  return true;
}

export function serializeMedicareIntake(parts: MedicareIntakeParts): string {
  const card = `${parts.group4}${parts.group5}${parts.group1}`;
  const expiry =
    parts.expiryMonth || parts.expiryYear
      ? `${parts.expiryMonth}/${parts.expiryYear}`
      : "";
  if (!card && !parts.irn && !expiry) return "";
  return `${card}|${parts.irn}|${expiry}`;
}

export function partsFromMedicareIntake(raw: string | undefined | null): MedicareIntakeParts {
  const value = (raw ?? "").trim();
  if (!value) return { ...EMPTY_MEDICARE_PARTS };

  if (value.includes("|")) {
    const [card = "", irn = "", expiry = ""] = value.split("|");
    const digits = digitsOnlyMedicare(card);
    const [expiryMonth = "", expiryYear = ""] = expiry.split("/");
    return {
      group4: digits.slice(0, 4),
      group5: digits.slice(4, 9),
      group1: digits.slice(9, 10),
      irn: digitsOnlyMedicare(irn).slice(0, 1),
      expiryMonth: digitsOnlyMedicare(expiryMonth).slice(0, 2),
      expiryYear: digitsOnlyMedicare(expiryYear).slice(0, 4),
    };
  }

  const digits = digitsOnlyMedicare(value);
  return {
    group4: digits.slice(0, 4),
    group5: digits.slice(4, 9),
    group1: digits.slice(9, 10),
    irn: digits.slice(10, 11),
    expiryMonth: "",
    expiryYear: "",
  };
}

export function parseMedicareNumber(raw: string | undefined | null): ParsedMedicareNumber | null {
  const parts = partsFromMedicareIntake(raw);
  const cardNumber = `${parts.group4}${parts.group5}${parts.group1}`;
  if (!hasValidMedicareChecksum(cardNumber)) return null;
  if (parts.irn && !/^[1-9]$/.test(parts.irn)) return null;

  return {
    cardNumber,
    irn: parts.irn || undefined,
    expiryMonth: parts.expiryMonth || undefined,
    expiryYear: parts.expiryYear || undefined,
    formatted: formatMedicareNumber(cardNumber, parts.irn || undefined),
  };
}

/** Quiz completion: 10-digit card and a valid unexpired date. */
export function parseMedicareIntake(raw: string | undefined | null): ParsedMedicareNumber | null {
  const parsed = parseMedicareNumber(raw);
  if (!parsed?.expiryMonth || !parsed.expiryYear) return null;
  if (!isValidExpiry(parsed.expiryMonth, parsed.expiryYear)) return null;
  return parsed;
}

export function isValidMedicareNumber(raw: string | undefined | null): boolean {
  return parseMedicareIntake(raw) !== null;
}
