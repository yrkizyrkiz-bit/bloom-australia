import { normalizeProgramKey } from "@/lib/membership/keys";
import {
  collectEnrolledPrograms,
  type EnrolledProgram,
} from "@/lib/triage/enrolled-programs";

export type DoctorProgramTab =
  | "WEIGHT_MANAGEMENT"
  | "HAIR_LOSS"
  | "MENS_HEALTH_SEXUAL"
  | "WOMENS_HEALTH_SEXUAL"
  | "MEMBERSHIP";

export type DoctorPrescriptionCategory =
  | "WEIGHT_MANAGEMENT"
  | "HAIR_LOSS"
  | "SEXUAL_HEALTH"
  | "HORMONE_THERAPY";

export const HAIR_LOSS_MEDICATION_SUGGESTIONS = [
  {
    name: "Finasteride",
    generic: "Finasteride",
    strength: "1mg",
    form: "TABLET",
    dosage: "1mg",
    frequency: "Once daily",
  },
  {
    name: "Minoxidil",
    generic: "Minoxidil",
    strength: "5%",
    form: "LIQUID",
    dosage: "1mL",
    frequency: "Twice daily",
  },
  {
    name: "Dutasteride",
    generic: "Dutasteride",
    strength: "0.5mg",
    form: "CAPSULE",
    dosage: "0.5mg",
    frequency: "Once daily",
  },
] as const;

/** Common ED / PE scripts for Men's Sexual Health consults. */
export const MENS_ED_MEDICATION_SUGGESTIONS = [
  {
    name: "Sildenafil",
    generic: "Sildenafil",
    strength: "50mg",
    form: "TABLET",
    dosage: "50mg",
    frequency: "As needed, 30–60 min before activity",
    isPRN: true,
  },
  {
    name: "Sildenafil",
    generic: "Sildenafil",
    strength: "100mg",
    form: "TABLET",
    dosage: "100mg",
    frequency: "As needed, 30–60 min before activity",
    isPRN: true,
  },
  {
    name: "Tadalafil",
    generic: "Tadalafil",
    strength: "5mg",
    form: "TABLET",
    dosage: "5mg",
    frequency: "Once daily",
    isPRN: false,
  },
  {
    name: "Tadalafil",
    generic: "Tadalafil",
    strength: "10mg",
    form: "TABLET",
    dosage: "10mg",
    frequency: "As needed, at least 30 min before activity",
    isPRN: true,
  },
  {
    name: "Tadalafil",
    generic: "Tadalafil",
    strength: "20mg",
    form: "TABLET",
    dosage: "20mg",
    frequency: "As needed, at least 30 min before activity",
    isPRN: true,
  },
] as const;

/** Common Women's Wellness / menopause HRT templates for doctor consults. */
export const WOMENS_WELLNESS_MEDICATION_SUGGESTIONS = [
  {
    name: "Estradiol",
    generic: "Estradiol",
    strength: "50mcg/24h",
    form: "PATCH",
    dosage: "1 patch",
    frequency: "Twice weekly",
  },
  {
    name: "Estradiol",
    generic: "Estradiol",
    strength: "0.06%",
    form: "GEL",
    dosage: "As directed",
    frequency: "Once daily",
  },
  {
    name: "Micronised progesterone",
    generic: "Progesterone",
    strength: "100mg",
    form: "CAPSULE",
    dosage: "100mg",
    frequency: "Once daily at night",
  },
  {
    name: "Estriol cream",
    generic: "Estriol",
    strength: "1mg/g",
    form: "CREAM",
    dosage: "As directed",
    frequency: "As directed for vaginal symptoms",
  },
] as const;

export function isMembershipEnrollmentKey(key?: string | null): boolean {
  const lower = (key || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return lower === "membership" || lower === "sanative_membership";
}

export function hasMembershipEnrollment(programs: EnrolledProgram[] | undefined): boolean {
  return (programs ?? []).some((program) => isMembershipEnrollmentKey(program.key));
}

export function resolveDoctorEnrolledPrograms(
  members: Array<{ program?: string | null; membershipStatus?: string | null }>,
  programEntitlements: Array<{ key?: string | null; status?: string | null }> = [],
  subscriptionTier?: string | null,
  membershipScopeEntitlements: Array<{ key?: string | null; status?: string | null }> = []
): EnrolledProgram[] {
  return collectEnrolledPrograms(
    [
      ...members,
      ...programEntitlements.map((row) => ({
        program: row.key,
        membershipStatus: row.status,
      })),
      ...membershipScopeEntitlements
        .filter((row) => (row.key || "").toUpperCase() === "MEMBERSHIP")
        .map((row) => ({
          program: "membership",
          membershipStatus: row.status,
        })),
    ],
    subscriptionTier
  );
}

export function hasDoctorProgram(
  programs: EnrolledProgram[] | undefined,
  key: Exclude<DoctorProgramTab, "MEMBERSHIP">
): boolean {
  return (programs ?? []).some((program) => normalizeProgramKey(program.key) === key);
}

export function defaultDoctorProgramTab(
  programs: EnrolledProgram[] | undefined,
  hairEnrolled = false,
  sexualEnrolled = false,
  womensEnrolled = false
): DoctorProgramTab {
  const hair = hairEnrolled || hasDoctorProgram(programs, "HAIR_LOSS");
  const sexual =
    sexualEnrolled || hasDoctorProgram(programs, "MENS_HEALTH_SEXUAL");
  const womens =
    womensEnrolled || hasDoctorProgram(programs, "WOMENS_HEALTH_SEXUAL");
  const weight = hasDoctorProgram(programs, "WEIGHT_MANAGEMENT");

  // Women-only (no competing clinical programs) lands on Women's Wellness.
  if (womens && !weight && !hair && !sexual) return "WOMENS_HEALTH_SEXUAL";
  if (sexual && !weight && !hair) return "MENS_HEALTH_SEXUAL";
  if (hair && !weight) return "HAIR_LOSS";
  if (weight) return "WEIGHT_MANAGEMENT";
  // Membership-only (or no clinical program) must not fall through to Weight Management.
  return "MEMBERSHIP";
}

export function resolveDoctorPrescriptionCategory(
  programTab: string | null | undefined
): DoctorPrescriptionCategory {
  if (programTab === "HAIR_LOSS") return "HAIR_LOSS";
  if (programTab === "MENS_HEALTH_SEXUAL") return "SEXUAL_HEALTH";
  if (programTab === "WOMENS_HEALTH_SEXUAL") return "HORMONE_THERAPY";
  return "WEIGHT_MANAGEMENT";
}

export function isNonWeightDoctorApproval(
  category: string | null | undefined
): boolean {
  return (
    category === "HAIR_LOSS" ||
    category === "SEXUAL_HEALTH" ||
    category === "HORMONE_THERAPY"
  );
}
