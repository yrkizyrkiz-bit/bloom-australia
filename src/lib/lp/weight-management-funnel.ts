import { calculateBmi, LP_FUNNEL_SOURCE, PRICING } from "@/lib/lp/weight-management";
import { getSydneyDayOfWeek } from "@/lib/sydney-time";

export const LP_WM_ASSESSMENT_CENTS = PRICING.assessmentFee * 100;
export const LP_WM_PURCHASE_TYPE = "lp_wm_assessment";
export const LP_WM_APPOINTMENT_TYPE = "PHONE_CONSULT";
export const LP_WM_PROJECTION_MONTHS = 6;

export type LpWmQuizOption = {
  id: string;
  label: string;
  showIf?: (answers: Record<string, string>) => boolean;
};

export type LpWmQuizKind = "choice" | "text" | "bmi" | "graph";

export type LpWmQuizStep = {
  id: string;
  prompt: string;
  subtitle?: string;
  kind?: LpWmQuizKind;
  options?: LpWmQuizOption[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  showIf?: (answers: Record<string, string>) => boolean;
};

const choice = (
  id: string,
  prompt: string,
  options: LpWmQuizOption[],
  extra?: Partial<LpWmQuizStep>
): LpWmQuizStep => ({ id, prompt, kind: "choice", options, ...extra });

const isFemale = (answers: Record<string, string>) => answers.gender === "female";

/**
 * Shortened copy of the original /weight-management/assessment idea:
 * goal → first name → height+weight together → graph gated by email →
 * gender → remaining clinical questions. Digestive, mental-health,
 * medications, ethnicity, waist, exercise and how-heard screens are dropped.
 */
export const LP_WM_QUIZ_STEPS: LpWmQuizStep[] = [
  choice("weightLossGoal", "How much weight are you looking to lose?", [
    { id: "1-10", label: "A little (under 10 kg)" },
    { id: "10-25", label: "A moderate amount (10–25 kg)" },
    { id: "25+", label: "A significant amount (25+ kg)" },
    { id: "unsure", label: "I'm not sure yet" },
  ]),
  {
    id: "firstName",
    prompt: "What's your first name?",
    kind: "text",
    placeholder: "First name",
  },
  {
    id: "measurements",
    prompt: "What's your height and current weight?",
    subtitle: "This helps your doctor check whether the program is likely to be suitable.",
    kind: "bmi",
  },
  {
    id: "projection",
    prompt: "Let's see what goal we can aim for",
    kind: "graph",
  },
  choice("gender", "What's your biological sex?", [
    { id: "female", label: "Female" },
    { id: "male", label: "Male" },
  ]),
  choice("motivation", "What's your main motivation?", [
    { id: "health", label: "Improve overall health" },
    { id: "energy", label: "Have more energy" },
    { id: "mobility", label: "Move more easily" },
    { id: "confidence", label: "Feel more confident" },
    { id: "chronic", label: "Manage a chronic condition" },
    { id: "longevity", label: "Live longer for family" },
  ]),
  choice("previousAttempt", "Have you tried to lose weight before?", [
    { id: "tracking", label: "Calorie counting / tracking apps" },
    { id: "diets", label: "Keto, fasting or commercial diets" },
    { id: "exercise", label: "Exercise programs" },
    { id: "prescription", label: "Previous prescription medications" },
    { id: "surgery", label: "Weight loss surgery" },
    { id: "none", label: "None, this is my first attempt" },
  ]),
  choice("previousTreatment", "Have you tried medical treatment for weight loss before?", [
    { id: "none", label: "No, this is my first time" },
    { id: "otc", label: "Over-the-counter or online products" },
    { id: "prescription", label: "Prescription medication in the past" },
    { id: "current", label: "I'm currently on something" },
  ]),
  choice(
    "medicalConditions",
    "Do any of these apply to you?",
    [
      { id: "blood-sugar", label: "High blood sugar or insulin resistance" },
      { id: "diabetes", label: "Type 2 diabetes or prediabetes" },
      { id: "pcos", label: "PCOS", showIf: isFemale },
      { id: "thyroid", label: "Thyroid issues" },
      { id: "heart", label: "Heart disease, stroke, or high blood pressure" },
      { id: "none", label: "None of these apply" },
    ],
    { subtitle: "Select the closest match. Your doctor will review in full." }
  ),
  choice(
    "pregnancyStatus",
    "Are you currently pregnant, trying, or breastfeeding?",
    [
      { id: "no", label: "No" },
      { id: "pregnant", label: "Pregnant or actively trying" },
      { id: "breastfeeding", label: "Currently breastfeeding" },
    ],
    { showIf: isFemale }
  ),
];

export const LP_WM_FUNNEL_STAGE_LABELS = [
  { id: "quiz", label: "Complete assessment" },
  { id: "book", label: "Book appointment" },
  { id: "pay", label: "Pay $49" },
] as const;

export function visibleLpWmQuizSteps(answers: Record<string, string>): LpWmQuizStep[] {
  return LP_WM_QUIZ_STEPS.filter((step) => !step.showIf || step.showIf(answers));
}

export function visibleLpWmQuizOptions(
  step: LpWmQuizStep,
  answers: Record<string, string>
): LpWmQuizOption[] {
  return (step.options ?? []).filter((option) => !option.showIf || option.showIf(answers));
}

export function lpWmNeedsExtraReview(answers: Record<string, string>) {
  return answers.pregnancyStatus === "pregnant" || answers.pregnancyStatus === "breastfeeding";
}

export function parseLpWmHeightWeight(answers: Record<string, string>) {
  const height = Number.parseFloat(String(answers.height ?? "").trim());
  const weight = Number.parseFloat(String(answers.weight ?? "").trim());
  const bmi = calculateBmi(height, weight);
  return { height, weight, bmi };
}

export function lpWmProjectedTargetKg(weightKg: number, goal: string): number {
  if (!(weightKg > 0)) return 0;
  const loss =
    goal === "1-10"
      ? Math.min(8, Math.max(4, weightKg * 0.08))
      : goal === "10-25"
        ? Math.min(20, Math.max(10, weightKg * 0.15))
        : goal === "25+"
          ? Math.min(35, Math.max(20, weightKg * 0.2))
          : weightKg * 0.15;
  return Math.round(Math.max(weightKg - loss, weightKg * 0.75) * 10) / 10;
}

export function lpWmWeightLossCurveParams(currentWeight: number, targetWeight: number) {
  const weightLoss = Math.max(0, currentWeight - targetWeight);
  const goalMonths = LP_WM_PROJECTION_MONTHS;
  const k = -Math.log(0.05) / goalMonths;
  return { weightLoss, goalMonths, totalMonths: goalMonths, k };
}

export function readLpWmQuizMap(answersIn: unknown): Record<string, string> {
  if (!answersIn || typeof answersIn !== "object") return {};
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(answersIn as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) answers[key] = value.trim();
  }
  return answers;
}

export function validateLpWmQuizAnswers(
  answersIn: unknown
): { ok: true; value: Record<string, string> } | { ok: false; error: string } {
  const answers = readLpWmQuizMap(answersIn);
  const visible = visibleLpWmQuizSteps(answers);

  for (const step of visible) {
    const kind = step.kind ?? "choice";
    if (kind === "graph") {
      if (!EMAIL_RE.test(normalizeEmail(answers.email))) {
        return { ok: false, error: "Please enter a valid email address." };
      }
      answers.email = normalizeEmail(answers.email);
      answers.projection = "viewed";
      continue;
    }
    if (kind === "bmi") {
      const { height, weight, bmi } = parseLpWmHeightWeight(answers);
      if (!bmi) return { ok: false, error: "Please enter your height and weight." };
      answers.height = String(Math.round(height));
      answers.weight = String(Math.round(weight * 10) / 10);
      answers.bmi = String(bmi);
      continue;
    }
    if (kind === "text") {
      if (!(answers[step.id] ?? "").trim()) {
        return { ok: false, error: "Please enter your first name." };
      }
      continue;
    }
    const value = answers[step.id] ?? "";
    const valid = visibleLpWmQuizOptions(step, answers).some((option) => option.id === value);
    if (!valid) return { ok: false, error: "Please answer every question." };
  }

  const { height, weight, bmi } = parseLpWmHeightWeight(answers);
  if (bmi) {
    answers.height = String(Math.round(height));
    answers.weight = String(Math.round(weight * 10) / 10);
    answers.bmi = String(bmi);
  }
  return { ok: true, value: answers };
}

/** LP funnel only: Monday–Wednesday are booked out; calendar lands on the next open day. */
export const LP_WM_CLOSED_WEEKDAYS = new Set([1, 2, 3]);
/** LP funnel only: Sundays are omitted from the date strip. */
export const LP_WM_HIDDEN_WEEKDAYS = new Set([0]);
/** LP funnel only: show dates from tomorrow through this many calendar days. */
export const LP_WM_CALENDAR_HORIZON_DAYS = 14;

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

export function validateLpWmIdentity(input: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
}): { ok: true; value: LpWmContact } | { ok: false; error: string } {
  const contact = readLpWmContact(input);
  if (contact.firstName.length < 1) {
    return { ok: false, error: "Please enter your first name." };
  }
  if (!EMAIL_RE.test(contact.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  return { ok: true, value: contact };
}

export function validateLpWmContact(input: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
}): { ok: true; value: LpWmContact } | { ok: false; error: string } {
  const identity = validateLpWmIdentity(input);
  if (!identity.ok) return identity;
  if (identity.value.lastName.length < 1) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (digitsInPhone(identity.value.phone).length < 8) {
    return { ok: false, error: "Please enter a valid mobile number." };
  }
  return identity;
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
  if (isLpWmHiddenWeekday(startTime)) {
    return { ok: false, error: "Please choose another day." };
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

export function isLpWmHiddenWeekday(date: Date | string): boolean {
  return LP_WM_HIDDEN_WEEKDAYS.has(getSydneyDayOfWeek(date));
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

export function stripeMetadataFromFunnel(input: LpWmContact & Partial<LpWmSlot>) {
  return {
    purchaseType: LP_WM_PURCHASE_TYPE,
    source: LP_FUNNEL_SOURCE,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    slotId: input.slotId ?? "",
    slotStart: input.startTime ?? "",
    slotEnd: input.endTime ?? "",
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
  return visibleLpWmQuizSteps(answers).flatMap((step) => {
    const kind = step.kind ?? "choice";
    if (kind === "graph") {
      return [{ prompt: "Email", answer: answers.email ?? "" }].filter((row) => row.answer);
    }
    if (kind === "bmi") {
      return [
        { prompt: "Height", answer: answers.height ? `${answers.height} cm` : "" },
        { prompt: "Weight", answer: answers.weight ? `${answers.weight} kg` : "" },
        { prompt: "BMI", answer: answers.bmi || "" },
      ].filter((row) => row.answer);
    }
    if (kind === "text") {
      return [{ prompt: step.prompt, answer: answers[step.id] ?? "" }].filter((row) => row.answer);
    }
    const selectedId = answers[step.id];
    const option = visibleLpWmQuizOptions(step, answers).find((item) => item.id === selectedId);
    return [
      {
        prompt: step.prompt,
        answer: option?.label ?? selectedId ?? "",
      },
    ].filter((row) => row.answer);
  });
}
