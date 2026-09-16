"use client";

import { PopulationDataManager } from "@/components/admin/PopulationDataManager";

export default function PopulationReferencesAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-foreground">Population comparison</h1>
        <p className="text-muted-foreground mt-1">
          Annual update of Australian reference data used on Heart, Liver and Kidney Compare tabs.
        </p>
      </div>
      <PopulationDataManager />
    </div>
  );
}
