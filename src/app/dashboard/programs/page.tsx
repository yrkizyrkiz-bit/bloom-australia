"use client";

import { ProgramGridDashboard } from "@/components/dashboard/ProgramGridDashboard";
import { MemberProgramHomeRedirect } from "@/components/dashboard/MemberProgramHomeRedirect";

/** Full-page program grid — default member home. */
export default function ProgramsHubPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <MemberProgramHomeRedirect />
      <ProgramGridDashboard />
    </div>
  );
}
