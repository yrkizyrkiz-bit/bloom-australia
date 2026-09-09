import { redirect } from "next/navigation";

/** Trends was removed from the member portal nav; keep URL from 404ing. */
export default function TrendsPage() {
  redirect("/dashboard");
}
