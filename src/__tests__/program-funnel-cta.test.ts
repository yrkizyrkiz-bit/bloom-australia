import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLINICAL_FUNNEL_ASSESSMENT_PATHS,
  getClinicalProgramFunnelConfig,
} from "@/lib/funnel/clinical-program-funnel";

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("program landing CTAs go to the matching funnel", () => {
  it("exposes the public assessment path for each clinical program", () => {
    expect(getClinicalProgramFunnelConfig("weight_management").assessmentPath).toBe(
      CLINICAL_FUNNEL_ASSESSMENT_PATHS.weight_management
    );
    expect(getClinicalProgramFunnelConfig("mens_health").assessmentPath).toBe(
      CLINICAL_FUNNEL_ASSESSMENT_PATHS.mens_health
    );
    expect(getClinicalProgramFunnelConfig("hair_loss").assessmentPath).toBe(
      CLINICAL_FUNNEL_ASSESSMENT_PATHS.hair_loss
    );
    expect(getClinicalProgramFunnelConfig("womens_health").assessmentPath).toBe(
      CLINICAL_FUNNEL_ASSESSMENT_PATHS.womens_health
    );
    expect(CLINICAL_FUNNEL_ASSESSMENT_PATHS.womens_health).toContain("category=menopause");
  });

  it("sends weight-management hero and how-it-works CTAs to the weight loss funnel", () => {
    const hero = readSource("components/promo/weight-loss/WeightLossMembershipHero.tsx");
    const howItWorks = readSource(
      "components/promo/weight-loss/WeightLossMembershipHowItWorks.tsx"
    );
    expect(hero).toContain('href="/weight-management/assessment"');
    expect(hero).not.toContain("/membership/checkout?intent=weight_management");
    expect(howItWorks).toContain('href="/weight-management/assessment"');
    expect(howItWorks).not.toContain("/membership/checkout?intent=weight_management");
  });

  it("sends men's health membership CTA to the men's health funnel", () => {
    const howItWorks = readSource(
      "components/promo/mens-health/MensHealthMembershipHowItWorks.tsx"
    );
    const page = readSource("app/(public)/mens-health/page.tsx");
    expect(howItWorks).toContain('href="/mens-health/assessment"');
    expect(howItWorks).not.toContain("/membership/checkout?intent=mens_health");
    expect(page).toContain('href="/mens-health/assessment"');
  });

  it("sends hair loss page CTAs to the hair assessment funnel", () => {
    const hero = readSource("components/promo/hair-health/HairHealthHero.tsx");
    const howItWorks = readSource(
      "components/promo/hair-health/HairHealthMembershipHowItWorks.tsx"
    );
    const page = readSource("app/(public)/hair-health/page.tsx");
    expect(hero).toContain("/hair-assessment");
    expect(hero).not.toContain("/membership/checkout?intent=hair_loss");
    expect(howItWorks).toContain('href="/hair-assessment"');
    expect(howItWorks).not.toContain("/membership/checkout?intent=hair_loss");
    expect(page).toContain("/hair-assessment");
  });

  it("sends the women's page CTA to the menopause funnel", () => {
    const content = readSource(
      "components/promo/womens-health/WomensHealthMenopauseContent.tsx"
    );
    expect(content).toContain('href="/womens-health/assessment?category=menopause"');
    expect(content).toContain('checkoutHref="/womens-health/assessment?category=menopause"');
    expect(content).not.toContain('href="/membership/checkout"');
  });
});

describe("clinical funnel step progress", () => {
  it("uses the four-step header bar on men's, hair, menopause, and post-quiz steps", () => {
    const stepper = readSource("components/funnel/FunnelStepProgress.tsx");
    const backbone = readSource("components/funnel/ProgramMembershipBackbone.tsx");
    const mens = readSource("app/(public)/mens-health/assessment/page.tsx");
    const hair = readSource("app/(public)/hair-assessment/page.tsx");
    const womens = readSource("app/(public)/womens-health/assessment/page.tsx");

    expect(stepper).toContain('label: "Your Details"');
    expect(stepper).toContain('label: "Health Assessment"');
    expect(stepper).toContain('label: "Review"');
    expect(stepper).toContain('label: "Submit & Pay"');

    expect(mens).toContain("FunnelStepProgress");
    expect(hair).toContain("FunnelStepProgress");
    expect(womens).toContain("FunnelStepProgress");
    expect(womens).toContain('accent="terracotta"');
    expect(backbone).toContain("FunnelStepProgress");
    expect(backbone).toContain("backboneProgressPhase");
  });
});
