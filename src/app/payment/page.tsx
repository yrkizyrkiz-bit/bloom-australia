import { redirect } from "next/navigation";

/** Legacy $49 consultation payment page, replaced by in-assessment checkout. */
export default function LegacyPaymentPage() {
  redirect("/weight-management/assessment");
}
