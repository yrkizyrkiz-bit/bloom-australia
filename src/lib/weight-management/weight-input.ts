/** In-progress scale drafts such as "", "8", "83." and "83.7". */
export function isWeightInputDraft(raw: string): boolean {
  return /^\d{0,3}([.,]\d{0,1})?$/.test(raw.trim());
}

export function parseWeightInput(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "" || cleaned === ".") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatWeightInput(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "";
  return (Math.round(value * 10) / 10).toFixed(1);
}
