"use client";

import { BiomarkerHistoryView } from "@/components/dashboard/BiomarkerHistoryView";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <BiomarkerHistoryView pageTitle="Reports & History" />
    </div>
  );
}
