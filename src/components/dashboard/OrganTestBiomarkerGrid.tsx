"use client";

import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { UntestedBiomarkerCard } from "@/components/dashboard/UntestedBiomarkerCard";
import { getBiomarkerById } from "@/data/biomarkers";
import type { BloodPanelBiomarker, Gender } from "@/data/bloodPanelConfig";
import { resolvePanelBiomarker } from "@/lib/organ-test-biomarkers";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";

interface OrganTestBiomarkerGridProps {
  biomarkerIds: string[];
  resultsById: Record<string, BiomarkerResult>;
  gender: Gender;
  categoryColor: string;
  onBiomarkerClick: (
    biomarker: BiomarkerDefinition,
    result: BiomarkerResult | null,
    panelBiomarker?: BloodPanelBiomarker
  ) => void;
}

export function OrganTestBiomarkerGrid({
  biomarkerIds,
  resultsById,
  gender,
  categoryColor,
  onBiomarkerClick,
}: OrganTestBiomarkerGridProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {biomarkerIds.map((biomarkerId) => {
        const biomarkerDef = getBiomarkerById(biomarkerId);
        const panelBiomarker = resolvePanelBiomarker(biomarkerId, biomarkerDef, gender);
        if (!biomarkerDef || !panelBiomarker) return null;

        const result = resultsById[biomarkerId] ?? null;

        if (result) {
          return (
            <BiomarkerCard
              key={biomarkerId}
              biomarker={biomarkerDef}
              result={result}
              gender={gender}
              panelBiomarker={panelBiomarker}
              onClick={() => onBiomarkerClick(biomarkerDef, result, panelBiomarker)}
            />
          );
        }

        return (
          <UntestedBiomarkerCard
            key={biomarkerId}
            biomarker={panelBiomarker}
            gender={gender}
            categoryColor={categoryColor}
            onClick={() => onBiomarkerClick(biomarkerDef, null, panelBiomarker)}
          />
        );
      })}
    </div>
  );
}
