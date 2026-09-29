import { redirect } from "next/navigation";

/** Legacy Weight Management coaching link → Care Comms Messages inbox. */
export default function CoachingRedirectPage() {
  redirect("/admin/care-comms/messages");
}
