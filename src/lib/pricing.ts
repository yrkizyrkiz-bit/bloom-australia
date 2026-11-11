// Sanative plan pricing: single source of truth for the pricing slider.
// Change BASE_MONTHLY_PRICE or the discounts here; the UI updates automatically.

export const BASE_MONTHLY_PRICE = 330; // AUD per month on the flexible monthly plan

export type PlanId = "monthly" | "3m" | "6m" | "12m";

export interface Plan {
  id: PlanId;
  label: string;
  months: number;
  discountPct: number; // % off the base monthly price
}

export const PLANS: Plan[] = [
  { id: "monthly", label: "Monthly", months: 1, discountPct: 0 },
  { id: "3m", label: "3 months", months: 3, discountPct: 10 },
  { id: "6m", label: "6 months", months: 6, discountPct: 15 },
  { id: "12m", label: "12 months", months: 12, discountPct: 25 },
];

export interface PlanQuote {
  plan: Plan;
  monthly: number; // price per month after discount
  total: number; // monthly x months
  saving: number; // vs paying the base price for the same months
  perDay: number; // monthly x 12 / 365
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function quote(plan: Plan, base: number = BASE_MONTHLY_PRICE): PlanQuote {
  const monthly = round2(base * (1 - plan.discountPct / 100));
  const total = round2(monthly * plan.months);
  const saving = round2(base * plan.months - total);
  const perDay = round2((monthly * 12) / 365);
  return { plan, monthly, total, saving, perDay };
}

export const formatAUD = (n: number) =>
  "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
