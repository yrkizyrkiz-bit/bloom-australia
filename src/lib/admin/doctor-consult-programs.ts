import { normalizeProgramKey } from "@/lib/membership/keys";
import {
  collectEnrolledPrograms,
  type EnrolledProgram,
} from "@/lib/triage/enrolled-programs";

export type DoctorProgramTab = "WEIGHT_MANAGEMENT" | "HAIR_LOSS";

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

export function resolveDoctorEnrolledPrograms(
  members: Array<{ program?: string | null; membershipStatus?: string | null }>,
  programEntitlements: Array<{ key?: string | null; status?: string | null }> = []
): EnrolledProgram[] {
  return collectEnrolledPrograms([
    ...members,
    ...programEntitlements.map((row) => ({
      program: row.key,
      membershipStatus: row.status,
    })),
  ]);
}

export function hasDoctorProgram(programs: EnrolledProgram[] | undefined, key: DoctorProgramTab): boolean {
  return (programs ?? []).some((program) => normalizeProgramKey(program.key) === key);
}

export function defaultDoctorProgramTab(
  programs: EnrolledProgram[] | undefined,
  hairEnrolled = false
): DoctorProgramTab {
  const hair = hairEnrolled || hasDoctorProgram(programs, "HAIR_LOSS");
  const weight = hasDoctorProgram(programs, "WEIGHT_MANAGEMENT");
  if (hair && !weight) return "HAIR_LOSS";
  return "WEIGHT_MANAGEMENT";
}

export function resolveDoctorPrescriptionCategory(
  programTab: string | null | undefined
): "HAIR_LOSS" | "WEIGHT_MANAGEMENT" {
  return programTab === "HAIR_LOSS" ? "HAIR_LOSS" : "WEIGHT_MANAGEMENT";
}
