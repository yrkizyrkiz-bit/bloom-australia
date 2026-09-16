"use client";

import { useApi } from "@/hooks/useApi";
import type { AuPopulationDataset } from "@/lib/au-population";

export function usePopulationDataset() {
  return useApi<{
    dataset: AuPopulationDataset;
    updatedAt: string | null;
    usingOverride: boolean;
  }>("/api/population-references");
}
