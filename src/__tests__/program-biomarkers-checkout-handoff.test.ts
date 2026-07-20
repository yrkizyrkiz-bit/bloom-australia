import { describe, expect, it } from "vitest";
import {
  buildProgramBiomarkersCheckoutUrl,
  isProgramBiomarkersCheckoutSource,
  shouldSkipBiomarkersQuiz,
} from "@/lib/funnel/program-biomarkers-checkout-handoff";
import {
  consultRiskFlagsForSource,
  resolveConsultProgramType,
} from "@/lib/funnel/resolve-consult-program-type";

describe("program biomarkers checkout handoff", () => {
  it("builds Architecture A checkout URLs for program sources", () => {
    expect(buildProgramBiomarkersCheckoutUrl("advanced", "hair_loss")).toBe(
      "/biomarkers/checkout?package=advanced&source=hair_loss&skipQuiz=1"
    );
    expect(buildProgramBiomarkersCheckoutUrl("advanced", "mens_health")).toContain(
      "source=mens_health"
    );
  });

  it("recognizes program funnel sources for skip-quiz checkout", () => {
    expect(isProgramBiomarkersCheckoutSource("hair_loss")).toBe(true);
    expect(isProgramBiomarkersCheckoutSource("mens_health")).toBe(true);
    expect(isProgramBiomarkersCheckoutSource("womens_health")).toBe(true);
    expect(shouldSkipBiomarkersQuiz("mens_health")).toBe(true);
    expect(shouldSkipBiomarkersQuiz(null)).toBe(false);
  });
});

describe("resolveConsultProgramType", () => {
  it("maps program checkout sources to clinical consult types", () => {
    expect(resolveConsultProgramType("hair_loss")).toBe("HAIR_LOSS");
    expect(resolveConsultProgramType("womens_health")).toBe("WOMENS_HEALTH");
    expect(resolveConsultProgramType("mens_health")).toBe("MENS_HEALTH");
    expect(resolveConsultProgramType(undefined)).toBe("BIOLOGICAL_CLOCK");
  });

  it("includes program risk flags for doctor booking", () => {
    expect(consultRiskFlagsForSource("mens_health")).toContain("MENS_HEALTH_PROGRAM");
    expect(consultRiskFlagsForSource("hair_loss")).toContain("HAIR_LOSS_PROGRAM");
  });
});
