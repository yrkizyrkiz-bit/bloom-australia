/** Inverse standard normal CDF (Acklam approximation). */
export function invNorm(p: number): number {
  const pp = Math.min(0.999, Math.max(0.001, p));
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577509590705e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  if (pp < pLow) {
    const q = Math.sqrt(-2 * Math.log(pp));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (pp > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - pp));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = pp - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Estimate a normal mean so P(X ≥ threshold) matches a published abnormal %. */
export function bandFromAbnormalHigh(
  threshold: number,
  pctAbove: number,
  sd: number,
  digits = 2
): { mean: number; p25: number; p75: number; absAbnormalPercent: number } {
  const pBelow = Math.min(0.99, Math.max(0.01, 1 - pctAbove / 100));
  const mean = threshold - sd * invNorm(pBelow);
  return {
    mean: round(mean, digits),
    p25: round(mean + sd * invNorm(0.25), digits),
    p75: round(mean + sd * invNorm(0.75), digits),
    absAbnormalPercent: pctAbove,
  };
}

export function bandFromMean(mean: number, sd: number, digits = 2): { mean: number; p25: number; p75: number } {
  return {
    mean: round(mean, digits),
    p25: round(mean + sd * invNorm(0.25), digits),
    p75: round(mean + sd * invNorm(0.75), digits),
  };
}

export function calculatePercentile(
  value: number,
  mean: number,
  p25: number,
  p75: number,
  higherIsBetter: boolean
): number {
  const iqr = Math.max(p75 - p25, 0.01);
  const zScore = (value - mean) / (iqr / 1.35);
  let percentile = 50 + zScore * 15;
  percentile = Math.max(1, Math.min(99, percentile));
  if (!higherIsBetter) percentile = 100 - percentile;
  return Math.round(percentile);
}
