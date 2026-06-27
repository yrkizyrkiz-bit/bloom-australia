import { redirect } from "next/navigation";

export default async function LegacyDoctorBriefRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/doctor/brief/${id}`);
}
