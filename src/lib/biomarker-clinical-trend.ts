import { AU_POPULATION_DEFAULTS } from "@/lib/au-population";
import type { BiomarkerRange } from "@/types";

/** Markers not in the AU population set, but with a clear healthier direction. */
const HIGHER_IS_BETTER_EXTRAS: Record<string, boolean> = {
  albumin: true,
  vitamin_d: true,
  vitamin_b12: true,
};

/**
 * true = higher values are healthier, false = lower is healthier,
 * null = aim for the middle of the optimal band (e.g. TSH).
 */
export function getHigherIsBetter(
  biomarkerId: string,
  range?: Pick<BiomarkerRange, "optimal_low">
): boolean | null {
  const au = AU_POPULATION_DEFAULTS.markers.find((m) => m.biomarkerId === biomarkerId);
  if (au) return au.higherIsBetter;
  if (biomarkerId in HIGHER_IS_BETTER_EXTRAS) return HIGHER_IS_BETTER_EXTRAS[biomarkerId];
  if (range && range.optimal_low <= 0) return false;
  return null;
}

function distanceOutsideOptimal(value: number, range: BiomarkerRange): number {
  if (value < range.optimal_low) return range.optimal_low - value;
  if (value > range.optimal_high) return value - range.optimal_high;
  return 0;
}

/** Whether current is clinically better than previous. null = no meaningful change. */
export function isClinicallyImproved(
  current: number,
  previous: number,
  range: BiomarkerRange,
  higherIsBetter: boolean | null
): boolean | null {
  const currOptimal = current >= range.optimal_low && current <= range.optimal_high;
  const prevOptimal = previous >= range.optimal_low && previous <= range.optimal_high;
  if (currOptimal && !prevOptimal) return true;
  if (!currOptimal && prevOptimal) return false;

  if (currOptimal && prevOptimal) {
    if (higherIsBetter === false) {
      if (current < previous) return true;
      if (current > previous) return false;
      return null;
    }
    if (higherIsBetter === true) {
      if (current > previous) return true;
      if (current < previous) return false;
      return null;
    }
    const mid = (range.optimal_low + range.optimal_high) / 2;
    const delta = Math.abs(current - mid) - Math.abs(previous - mid);
    if (Math.abs(delta) < 1e-9) return null;
    return delta < 0;
  }

  const dCurr = distanceOutsideOptimal(current, range);
  const dPrev = distanceOutsideOptimal(previous, range);
  if (Math.abs(dCurr - dPrev) < 1e-9) return null;
  return dCurr < dPrev;
}
