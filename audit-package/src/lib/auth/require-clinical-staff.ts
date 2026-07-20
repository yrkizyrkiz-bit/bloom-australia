import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const CLINICAL_STAFF_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "DOCTOR",
  "CARE_PARTNER",
  "admin",
]);

export const DOCTOR_ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "DOCTOR", "admin"]);

export function hasClinicalStaffRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return CLINICAL_STAFF_ROLES.has(role) || CLINICAL_STAFF_ROLES.has(role.toUpperCase());
}

export function hasDoctorAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return DOCTOR_ADMIN_ROLES.has(role) || DOCTOR_ADMIN_ROLES.has(role.toUpperCase());
}

/** Require an authenticated clinical staff session (doctor, care partner, or admin). */
export async function requireClinicalStaff() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  if (!hasClinicalStaffRole(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return {
    session,
    userId: session.user.id,
    role: session.user.role,
  } as const;
}

/** Require doctor or admin (for subscription creation and similar clinical actions). */
export async function requireDoctorOrAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  if (!hasDoctorAdminRole(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return {
    session,
    userId: session.user.id,
    role: session.user.role,
  } as const;
}
