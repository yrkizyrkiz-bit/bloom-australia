import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSexualHealthPublicStepBounds,
  isSexualHealthConcern,
  normalizeSexualHealthConcern,
} from "@/lib/funnel/mens-sexual-health-public-flow";

describe("mens sexual health public flow", () => {
  it("detects sexual health concern params", () => {
    expect(isSexualHealthConcern("sexual-health")).toBe(true);
    expect(isSexualHealthConcern("erectile-dysfunction")).toBe(true);
    expect(isSexualHealthConcern("energy-vitality")).toBe(false);
  });

  it("normalizes legacy concern slugs", () => {
    expect(normalizeSexualHealthConcern("premature-ejaculation")).toBe("sexual-health");
    expect(normalizeSexualHealthConcern("energy-vitality")).toBe("energy-vitality");
  });

  it("maps ED branch to checkout via analyse, without biomarker snapshot step", () => {
    const edSteps = 7; // treatmentFocus + 4 ED + 2 tail
    const bounds = getSexualHealthPublicStepBounds(edSteps);
    expect(bounds.contact).toBe(12);
    expect(bounds.consent).toBe(13);
    expect(bounds.analyse).toBe(14);
    expect(bounds.checkout).toBe(15);
    expect(bounds.thankYou).toBe(16);
  });

  it("does not render a Contact details step on the public assessment page", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(public)/mens-health/assessment/page.tsx"),
      "utf8"
    );
    expect(page).not.toContain(">Contact details<");
    expect(page).not.toContain("Mobile number");
    expect(page).toContain("setStep(sexualBounds.consent)");
    expect(page).toContain("setStep(17)");
  });
});
