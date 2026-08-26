import { redirect } from "next/navigation";

/** Former Action Plan page, content now lives on /labs#roadmap. */
export default function LabsActionPlanPage() {
  redirect("/labs#roadmap");
}
