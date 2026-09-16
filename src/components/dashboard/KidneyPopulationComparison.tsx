"use client";

import type { BiomarkerResult } from "@/types";
import { OrganPopulationComparison } from "@/components/dashboard/OrganPopulationComparison";

export function KidneyPopulationComparison({
  results,
  gender,
  dateOfBirth,
}: {
  results: BiomarkerResult[];
  gender: "male" | "female";
  dateOfBirth?: string | null;
}) {
  return (
    <OrganPopulationComparison
      results={results}
      gender={gender}
      dateOfBirth={dateOfBirth}
      category="kidney"
      accent="cyan"
    />
  );
}
