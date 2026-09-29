/** Which men's-health program chrome (nav + shared pages) should show. */

export type MensHealthShell = "sexual" | "hair";

export const MENS_HEALTH_SHELL_STORAGE_KEY = "sanative.mens-health.shell";

export function mensHealthShellFromPathname(pathname: string): MensHealthShell | null {
  if (pathname.startsWith("/dashboard/mens-health/sexual-health")) return "sexual";
  if (pathname.startsWith("/dashboard/mens-health/hair-loss")) return "hair";
  return null;
}

export function readStoredMensHealthShell(): MensHealthShell | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(MENS_HEALTH_SHELL_STORAGE_KEY);
    if (value === "sexual" || value === "hair") return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredMensHealthShell(shell: MensHealthShell): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MENS_HEALTH_SHELL_STORAGE_KEY, shell);
  } catch {
    /* ignore */
  }
}

/**
 * Prefer path-derived shell, then last-visited program on shared routes
 * (support / settings / treatment), then entitlements.
 */
export function resolveMensHealthShell(options: {
  pathname: string;
  hasSexual: boolean;
  hasHair: boolean;
  stored?: MensHealthShell | null;
}): MensHealthShell {
  const fromPath = mensHealthShellFromPathname(options.pathname);
  if (fromPath) return fromPath;

  const stored = options.stored ?? null;
  // Shared routes: keep the program the member was just using.
  if (stored === "sexual" && (!options.hasHair || options.hasSexual)) return "sexual";
  if (stored === "hair" && (!options.hasSexual || options.hasHair)) return "hair";
  if (stored) return stored;

  if (options.hasSexual && !options.hasHair) return "sexual";
  if (options.hasHair && !options.hasSexual) return "hair";
  if (options.hasSexual) return "sexual";
  return "hair";
}

export function mensHealthShellHome(shell: MensHealthShell): string {
  return shell === "sexual"
    ? "/dashboard/mens-health/sexual-health"
    : "/dashboard/mens-health/hair-loss";
}

export function mensHealthShellLabel(shell: MensHealthShell): string {
  return shell === "sexual" ? "Men's Health" : "Hair Restoration";
}
