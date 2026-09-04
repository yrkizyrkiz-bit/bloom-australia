import { normalizeProgramKey, PROGRAM_LABELS, type ProgramKey } from "@/lib/membership/keys";

const ENROLLED_STATUSES = new Set(["ACTIVE", "PENDING", "PAST_DUE"]);

export type EnrolledProgram = {
  key: string;
  label: string;
  status: string;
};

/** Distinctive labels for mixed men's/women's queues (Vitality vs Sexual Health). */
const ADMIN_PROGRAM_LABELS: Record<ProgramKey, string> = {
  WEIGHT_MANAGEMENT: "Weight Management",
  HAIR_LOSS: "Hair",
  MENS_HEALTH_VITALITY: "Men's Vitality",
  MENS_HEALTH_SEXUAL: "Men's Sexual Health",
  WOMENS_HEALTH_VITALITY: "Women's Vitality",
  WOMENS_HEALTH_SEXUAL: "Women's Sexual Health",
};

export function enrolledProgramLabel(program: string): string {
  const key = normalizeProgramKey(program);
  if (key) return ADMIN_PROGRAM_LABELS[key] ?? PROGRAM_LABELS[key];
  return program.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function collectEnrolledPrograms(
  members: Array<{ program?: string | null; membershipStatus?: string | null }>,
  subscriptionTier?: string | null
): EnrolledProgram[] {
  const byKey = new Map<string, EnrolledProgram>();

  for (const member of members) {
    const program = member.program?.trim();
    if (!program) continue;
    const status = (member.membershipStatus || "ACTIVE").toUpperCase();
    if (!ENROLLED_STATUSES.has(status)) continue;
    const key = normalizeProgramKey(program) ?? program;
    if (byKey.has(key)) continue;
    byKey.set(key, { key, label: enrolledProgramLabel(program), status });
  }

  if (subscriptionTier?.trim()) {
    const key = normalizeProgramKey(subscriptionTier) ?? subscriptionTier;
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        label: enrolledProgramLabel(subscriptionTier),
        status: "ACTIVE",
      });
    }
  }

  return [...byKey.values()];
}

export function enrolledProgramBadgeClass(key: string): string {
  const k = key.toUpperCase();
  if (k.includes("WEIGHT")) return "border-green-200 bg-green-50 text-green-800";
  if (k.includes("HAIR")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (k.includes("WOMEN")) return "border-rose-200 bg-rose-50 text-rose-800";
  if (k.includes("MEN")) return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}
