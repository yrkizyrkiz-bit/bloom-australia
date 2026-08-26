import { redirect } from "next/navigation";

/** Legacy WM plan picker, use the assessment checkout flow instead. */
export default function LegacySelectPlanPage() {
  redirect("/weight-management/assessment");
}
