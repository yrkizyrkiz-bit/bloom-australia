import type { BiomarkerResult } from "@/types";

export interface ApiBiomarkerResultRow {
  id: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: string;
  labReportId?: string | null;
  notes?: string | null;
  previousValue?: number;
  trend?: string;
  biomarker?: {
    unit?: string;
  };
}

export function mapApiBiomarkerResults(
  results: ApiBiomarkerResultRow[] | undefined
): BiomarkerResult[] {
  if (!results) return [];

  return results.map((r) => ({
    id: r.id,
    biomarkerId: r.biomarkerId,
    value: r.value,
    unit: r.biomarker?.unit || "",
    status: (r.status?.toLowerCase() || "normal") as BiomarkerResult["status"],
    testedAt: r.testedAt,
    labReportId: r.labReportId || "",
    notes: r.notes || "",
    previousValue: r.previousValue,
    trend: r.trend?.toLowerCase() as "up" | "down" | "stable" | undefined,
  }));
}
