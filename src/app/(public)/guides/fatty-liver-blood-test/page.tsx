import { redirect } from "next/navigation";

/** Retired article. Static segment wins over /guides/[slug]. */
export default function FattyLiverBloodTestRedirect() {
  redirect("/metabolic-care/fatty-liver");
}
