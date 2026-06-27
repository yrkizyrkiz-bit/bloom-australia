import type { BiomarkerStatus } from "@prisma/client";

export interface BiomarkerRangeJson {
  low: number;
  optimal_low: number;
  optimal_high: number;
  high: number;
  unit?: string;
}

export type BiomarkerDefForStatus = {
  maleRanges: unknown;
  femaleRanges: unknown;
};

/** Classify a lab value against Sanative reference ranges (Australian SI units). */
export function calculateBiomarkerStatus(
  value: number,
  biomarkerDef: BiomarkerDefForStatus | null | undefined,
  gender: string
): BiomarkerStatus {
  if (!biomarkerDef) return "NORMAL";

  const ranges =
    gender === "FEMALE" ? biomarkerDef.femaleRanges : biomarkerDef.maleRanges;
  if (!ranges) return "NORMAL";

  let rangeData: BiomarkerRangeJson;
  try {
    rangeData =
      typeof ranges === "string"
        ? (JSON.parse(ranges) as BiomarkerRangeJson)
        : (ranges as BiomarkerRangeJson);
  } catch {
    return "NORMAL";
  }

  const { low, optimal_low, optimal_high, high } = rangeData;
  if (
    [low, optimal_low, optimal_high, high].some(
      (n) => typeof n !== "number" || Number.isNaN(n)
    )
  ) {
    return "NORMAL";
  }

  if (value >= optimal_low && value <= optimal_high) return "OPTIMAL";
  if (value >= low && value <= high) return "NORMAL";
  if (value < low * 0.8 || value > high * 1.2) return "CRITICAL";
  return "OUT_OF_RANGE";
}

/** Human-readable label — matches member dashboard BiomarkerCard. */
export function getBiomarkerStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "OPTIMAL":
      return "Optimal";
    case "NORMAL":
      return "Normal";
    case "OUT_OF_RANGE":
      return "Attention";
    case "CRITICAL":
      return "Critical";
    default:
      return status;
  }
}

/** Badge classes from globals.css — same as member biomarker section. */
export function getBiomarkerStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "OPTIMAL":
      return "status-optimal";
    case "NORMAL":
      return "status-normal";
    case "OUT_OF_RANGE":
      return "status-out-of-range";
    case "CRITICAL":
      return "status-critical";
    default:
      return "";
  }
}

export function getBiomarkerStatusDotClass(status: string): string {
  switch (status.toUpperCase()) {
    case "OPTIMAL":
      return "status-dot-optimal";
    case "NORMAL":
      return "status-dot-normal";
    case "OUT_OF_RANGE":
      return "status-dot-out-of-range";
    case "CRITICAL":
      return "status-dot-critical";
    default:
      return "bg-gray-400";
  }
}

export function getBiomarkerStatusRowClass(status: string): string {
  switch (status.toUpperCase()) {
    case "OPTIMAL":
      return "border-green-500/30 bg-green-500/5";
    case "NORMAL":
      return "border-yellow-500/30 bg-yellow-500/5";
    case "OUT_OF_RANGE":
      return "border-orange-500/30 bg-orange-500/5";
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/5";
    default:
      return "border-border bg-card";
  }
}
