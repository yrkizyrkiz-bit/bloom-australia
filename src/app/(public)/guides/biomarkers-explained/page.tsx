import { redirect } from "next/navigation";

/** Retired article. Static segment wins over /guides/[slug]. */
export default function BiomarkersExplainedRedirect() {
  redirect("/labs");
}
