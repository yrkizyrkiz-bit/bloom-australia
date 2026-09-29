import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STAFF_ROLES = new Set(["ADMIN", "admin", "CARE_PARTNER", "DOCTOR", "SUPER_ADMIN"]);

export async function requireCareSupportStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !STAFF_ROLES.has(session.user.role || "")) {
    return null;
  }
  return session;
}
