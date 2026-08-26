import { redirect } from "next/navigation";

/** Legacy standalone booking checkout, use the assessment funnel instead. */
export default function LegacyWomensHealthBookPage() {
  redirect("/womens-health/assessment");
}
