import { redirect } from "next/navigation";

/** Legacy consultation payment page — replaced by in-assessment membership checkout. */
export default function LegacyPaymentPage() {
  redirect("/weight-management/assessment");
}
