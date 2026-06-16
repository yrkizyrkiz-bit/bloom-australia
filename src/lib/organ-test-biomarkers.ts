import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
  getBiomarkerFromPanel,
  type BloodPanelBiomarker,
  type Gender,
} from "@/data/bloodPanelConfig";

export function buildBiomarkerResultsMap(
  results: BiomarkerResult[]
): Record<string, BiomarkerResult> {
  const map: Record<string, BiomarkerResult> = {};
  for (const result of results) {
    map[result.biomarkerId] = result;
  }
  return map;
}

export function panelBiomarkerFromDefinition(
  def: BiomarkerDefinition,
  gender: Gender
): BloodPanelBiomarker {
  const range = def.ranges[gender];
  return {
    id: def.id,
    name: def.name,
    shortName: def.shortName,
    unit: range.unit,
    optimalLow: range.optimal_low,
    optimalHigh: range.optimal_high,
    normalLow: range.low,
    normalHigh: range.high,
  };
}

export function resolvePanelBiomarker(
  biomarkerId: string,
  biomarkerDef: BiomarkerDefinition | undefined,
  gender: Gender
): BloodPanelBiomarker | undefined {
  const fromPanel = getBiomarkerFromPanel(biomarkerId)?.biomarker;
  if (fromPanel) return fromPanel;
  if (biomarkerDef) return panelBiomarkerFromDefinition(biomarkerDef, gender);
  return undefined;
}
