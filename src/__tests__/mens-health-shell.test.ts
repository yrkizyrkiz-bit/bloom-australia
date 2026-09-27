import { describe, expect, it } from "bun:test";
import {
  mensHealthShellFromPathname,
  mensHealthShellHome,
  resolveMensHealthShell,
} from "@/lib/portal/mens-health-shell";

describe("mens health shell", () => {
  it("detects shell from program paths", () => {
    expect(mensHealthShellFromPathname("/dashboard/mens-health/sexual-health")).toBe("sexual");
    expect(mensHealthShellFromPathname("/dashboard/mens-health/sexual-health/check-in")).toBe(
      "sexual"
    );
    expect(mensHealthShellFromPathname("/dashboard/mens-health/hair-loss")).toBe("hair");
    expect(mensHealthShellFromPathname("/dashboard/mens-health/support")).toBeNull();
  });

  it("keeps sexual shell on Care Team after visiting sexual health", () => {
    expect(
      resolveMensHealthShell({
        pathname: "/dashboard/mens-health/support",
        hasSexual: true,
        hasHair: false,
        stored: "sexual",
      })
    ).toBe("sexual");
    expect(mensHealthShellHome("sexual")).toBe("/dashboard/mens-health/sexual-health");
  });

  it("does not fall back to hair for sexual-only members on shared routes", () => {
    expect(
      resolveMensHealthShell({
        pathname: "/dashboard/mens-health/support",
        hasSexual: true,
        hasHair: false,
        stored: null,
      })
    ).toBe("sexual");
  });

  it("keeps hair shell on Care Team after visiting hair", () => {
    expect(
      resolveMensHealthShell({
        pathname: "/dashboard/mens-health/support",
        hasSexual: true,
        hasHair: true,
        stored: "hair",
      })
    ).toBe("hair");
  });
});
