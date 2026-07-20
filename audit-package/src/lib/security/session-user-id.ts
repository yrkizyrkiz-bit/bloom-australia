import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasClinicalStaffRole } from "@/lib/auth/require-clinical-staff";

/** Reject when a logged-in patient tries to act on another user's ID in the request body. */
export async function rejectMismatchedBodyUserId(bodyUserId: string | undefined | null) {
  if (!bodyUserId) {
    return null;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  if (hasClinicalStaffRole(session.user.role)) {
    return null;
  }

  if (session.user.id !== bodyUserId) {
    return NextResponse.json(
      { error: "Forbidden: userId does not match session" },
      { status: 403 }
    );
  }

  return null;
}
