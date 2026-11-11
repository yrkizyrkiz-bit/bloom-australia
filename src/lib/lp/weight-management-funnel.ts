import { LP_FUNNEL_SOURCE, PRICING } from "@/lib/lp/weight-management";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import { getSydneyDayOfWeek } from "@/lib/sydney-time";

export const LP_WM_ASSESSMENT_CENTS = PRICING.assessmentFee * 100;
export const LP_WM_PURCHASE_TYPE = "lp_wm_assessment";
export const LP_WM_APPOINTMENT_TYPE = "PHONE_CONSULT";

export const LP_WM_QUIZ_STEPS = (getPublicFunnelQuizSteps("WEIGHT_MANAGEMENT") ?? []).filter(
  (step) => step.id !== "startTiming"
);

/** LP funnel only: Monday–Wednesday are booked out; calendar lands on the next open day. */
export const LP_WM_CLOSED_WEEKDAYS = new Set([1, 2, 3]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LpWmContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type LpWmSlot = {
  slotId: string;
  startTime: string;
  endTime: string;
};

export function trimField(value: unknown, max = 80): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function normalizeEmail(value: unknown): string {
  return trimField(value, 160).toLowerCase();
}

export function digitsInPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function readLpWmContact(input: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
}): LpWmContact {
  return {
    firstName: trimField(input.firstName),
    lastName: trimField(input.lastName),
    email: normalizeEmail(input.email),
    phone: trimField(input.phone, 32),
  };
}

export function validateLpWmContact(input: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
}): { ok: true; value: LpWmContact } | { ok: false; error: string } {
  const { firstName, lastName, email, phone } = readLpWmContact(input);

  if (firstName.length < 1 || lastName.length < 1) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (digitsInPhone(phone).length < 8) {
    return { ok: false, error: "Please enter a valid mobile number." };
  }

  return { ok: true, value: { firstName, lastName, email, phone } };
}

export function validateLpWmSlot(input: {
  slotId?: unknown;
  startTime?: unknown;
  endTime?: unknown;
}): { ok: true; value: LpWmSlot } | { ok: false; error: string } {
  const slotId = trimField(input.slotId, 80);
  const startTime = trimField(input.startTime, 40);
  const endTime = trimField(input.endTime, 40);
  if (!slotId || !startTime || !endTime) {
    return { ok: false, error: "Please choose a consultation time." };
  }
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ok: false, error: "Please choose a valid consultation time." };
  }
  if (isLpWmClosedWeekday(startTime)) {
    return { ok: false, error: "Monday to Wednesday are fully booked. Please choose another day." };
  }
  return { ok: true, value: { slotId, startTime, endTime } };
}

export type LpWmPaymentGate =
  | { ok: true }
  | { ok: false; error: string; target: "time" | "details" };

export function lpWmPaymentGate(input: {
  slot: LpWmSlot | null;
  contact: ReturnType<typeof validateLpWmContact>;
}): LpWmPaymentGate {
  if (!input.slot) {
    return { ok: false, error: "Choose a consultation time before paying.", target: "time" };
  }
  if (!input.contact.ok) {
    return { ok: false, error: input.contact.error, target: "details" };
  }
  return { ok: true };
}

export function isLpWmClosedWeekday(date: Date | string): boolean {
  return LP_WM_CLOSED_WEEKDAYS.has(getSydneyDayOfWeek(date));
}

export function applyLpWmClosedWeekdayBookings<
  T extends { startTime: string; availabilityStatus: string; availableDoctors: number },
>(slots: T[]): T[] {
  return slots.map((slot) =>
    isLpWmClosedWeekday(slot.startTime)
      ? { ...slot, availabilityStatus: "BOOKED", availableDoctors: 0 }
      : slot
  );
}

export function collectLpWmUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const utm: Record<string, string> = {};
  params.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "source" ||
      lower.startsWith("utm_") ||
      lower === "gclid" ||
      lower === "gbraid" ||
      lower === "wbraid" ||
      lower === "fbclid"
    ) {
      utm[key] = value.slice(0, 200);
    }
  });
  if (!utm.source) utm.source = LP_FUNNEL_SOURCE;
  return utm;
}

export function stripeMetadataFromFunnel(input: LpWmContact & LpWmSlot) {
  return {
    purchaseType: LP_WM_PURCHASE_TYPE,
    source: LP_FUNNEL_SOURCE,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    slotId: input.slotId,
    slotStart: input.startTime,
    slotEnd: input.endTime,
  };
}

export function formatAppointmentSydney(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function quizAnswerLabels(answers: Record<string, string>): Array<{
  prompt: string;
  answer: string;
}> {
  return LP_WM_QUIZ_STEPS.map((step) => {
    const selectedId = answers[step.id];
    const option = step.options.find((item) => item.id === selectedId);
    return {
      prompt: step.prompt,
      answer: option?.label ?? selectedId ?? "",
    };
  }).filter((row) => row.answer);
}
