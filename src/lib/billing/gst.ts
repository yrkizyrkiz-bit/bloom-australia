/** GST included in an Australian GST-inclusive amount. One-eleventh of the total. */
export function gstIncludedCents(totalCents: number): number {
  return Math.round(totalCents / 11);
}

export function formatAudFromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars.toLocaleString("en-AU")}.${remainder}`;
}
