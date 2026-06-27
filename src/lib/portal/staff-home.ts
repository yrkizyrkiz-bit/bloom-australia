export const ADMIN_PORTAL_HOME = "/admin";
export const DOCTOR_PORTAL_HOME = "/admin/bookings";

const STAFF_ADMIN_ROLES = new Set(["admin", "ADMIN", "CARE_PARTNER", "DOCTOR"]);

export function isStaffAdminRole(role: string | undefined): boolean {
  return Boolean(role && STAFF_ADMIN_ROLES.has(role));
}

export function resolveStaffPortalHome(role: string | undefined): string {
  if (role === "DOCTOR") return DOCTOR_PORTAL_HOME;
  if (isStaffAdminRole(role)) return ADMIN_PORTAL_HOME;
  return "/dashboard/programs";
}
