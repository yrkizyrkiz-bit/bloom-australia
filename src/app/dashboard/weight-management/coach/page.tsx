import { redirect } from "next/navigation";

/** Legacy route — human support lives under Care team. */
export default function CoachPageRedirect() {
  redirect("/dashboard/weight-management/support");
}
