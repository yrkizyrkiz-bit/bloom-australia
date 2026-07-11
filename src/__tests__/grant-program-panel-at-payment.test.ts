import { describe, expect, it } from "vitest";
import { resolvePanelTiersForProgramStart } from "@/lib/portal/grant-program-panel-at-payment";
import { panelIncludesOrganCare } from "@/lib/biomarkers/public-checkout-tier-map";
import { PROGRAM_KEYS } from "@/lib/membership/keys";
import { resolveRequiredPanelTier } from "@/lib/biomarkers/program-panel-requirements";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("resolvePanelTiersForProgramStart", () => {
  it("uses clinical table when no override is provided", () => {
    expect(resolvePanelTiersForProgramStart({ programKey: "WEIGHT_MANAGEMENT" })).toEqual({
      publicPanelTier: "essential",
      billingPanelTier: "essential",
    });
    expect(resolvePanelTiersForProgramStart({ programKey: "HAIR_LOSS" })).toEqual({
      publicPanelTier: "advanced",
      billingPanelTier: "extended",
    });
    expect(resolvePanelTiersForProgramStart({ programKey: null })).toEqual({
      publicPanelTier: "advanced",
      billingPanelTier: "extended",
    });
  });

  it("prefers explicit public / billing overrides from intake", () => {
    expect(
      resolvePanelTiersForProgramStart({
        programKey: "WEIGHT_MANAGEMENT",
        publicPanelTier: "advanced",
      })
    ).toEqual({
      publicPanelTier: "advanced",
      billingPanelTier: "extended",
    });
    expect(
      resolvePanelTiersForProgramStart({
        programKey: "HAIR_LOSS",
        publicPanelTier: "advanced",
        billingPanelTier: "extended",
      })
    ).toEqual({
      publicPanelTier: "advanced",
      billingPanelTier: "extended",
    });
  });

  it("covers every program key via resolveRequiredPanelTier", () => {
    for (const key of PROGRAM_KEYS) {
      const tier = resolveRequiredPanelTier(key);
      expect(["essential", "advanced", "complete"]).toContain(tier);
    }
  });
});

describe("Organ Care bundling at panel grant", () => {
  it("bundles Organ Care for advanced/complete except hair_loss", () => {
    expect(panelIncludesOrganCare("advanced")).toBe(true);
    expect(panelIncludesOrganCare("complete")).toBe(true);
    expect(panelIncludesOrganCare("essential")).toBe(false);
    expect(panelIncludesOrganCare("advanced", { sourceProgram: "hair_loss" })).toBe(false);
  });
});

describe("checkout paths grant panel at payment", () => {
  const root = join(process.cwd(), "src");

  it("bookings/confirm grants program panel entitlements at payment", () => {
    const source = readFileSync(join(root, "app/api/bookings/confirm/route.ts"), "utf8");
    expect(source).toContain("grantProgramPanelEntitlementsAtPayment");
    expect(source).toContain("resolvePanelGrantContext");
  });

  it("public biomarkers enrollment uses the shared panel grant helper", () => {
    const source = readFileSync(
      join(root, "lib/portal/public-biomarkers-purchase.ts"),
      "utf8"
    );
    expect(source).toContain("grantProgramPanelEntitlementsAtPayment");
  });
});
