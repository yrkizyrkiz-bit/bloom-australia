import { describe, expect, it } from "vitest";
import {
  isPublicProgramFunnelPayment,
  programFunnelWelcomeCopy,
  renderProgramFunnelWelcomeEmail,
} from "@/lib/funnel/program-funnel-welcome";

const OTHER_PROGRAMS: Record<string, string[]> = {
  weight_management: ["Hair Loss", "Men's Health", "Women's Wellness"],
  hair_loss: ["Weight Management", "Men's Health", "Women's Wellness"],
  mens_health: ["Weight Management", "Hair Loss", "Women's Wellness"],
  womens_health: ["Weight Management", "Hair Loss", "Men's Health"],
};

describe("program funnel welcome email", () => {
  it.each([
    ["weight_management", "Weight Management", "/dashboard/weight-management?onboarding=post-checkout", "medical weight loss"],
    ["hair_loss", "Hair Loss", "/dashboard/mens-health/hair-loss?onboarding=post-checkout", "hair loss care"],
    ["mens_health_sexual", "Men's Health", "/dashboard/mens-health/sexual-health?onboarding=post-checkout", "men's health care"],
    ["womens_health_sexual", "Women's Wellness", "/dashboard/womens-health?onboarding=post-checkout", "women's wellness care"],
  ] as const)(
    "names %s in the subject and body",
    (intent, label, path, included) => {
      const copy = programFunnelWelcomeCopy(intent);
      expect(copy).not.toBeNull();
      expect(copy!.programLabel).toBe(label);
      expect(copy!.subject).toBe(`Welcome to Sanative: your ${label} program is active`);
      expect(copy!.postCheckoutPath).toBe(path);
      expect(copy!.includedLine.toLowerCase()).toContain(included);

      const rendered = renderProgramFunnelWelcomeEmail({
        firstName: "Alex",
        copy: copy!,
        magicLink: `https://sanative.com.au/auth/magic?token=abc&redirect=${encodeURIComponent(path)}`,
        needsPassword: true,
      });

      expect(rendered.subject).toBe(copy!.subject);
      expect(rendered.html).toContain(label);
      expect(rendered.html).toContain("Your Sanative Membership is active");
      expect(rendered.html).toContain(included);
      expect(rendered.text).toContain(label);
      expect(rendered.html).toContain(encodeURIComponent(path));
      expect(rendered.html).toContain("your blood test");
      expect(rendered.html).toContain(
        "A second consultation with the doctor to talk through your results and health report."
      );
      expect(rendered.text).toContain("your blood test");
      expect(rendered.text).toContain(
        "4. A second consultation with the doctor to talk through your results and health report."
      );

      const others = OTHER_PROGRAMS[copy!.programId];
      for (const other of others) {
        expect(rendered.subject).not.toContain(other);
        expect(rendered.html).not.toContain(other);
        expect(rendered.text).not.toContain(other);
      }
    }
  );

  it("does not build a program welcome for membership-only checkout", () => {
    expect(programFunnelWelcomeCopy("biomarkers")).toBeNull();
    expect(programFunnelWelcomeCopy(null)).toBeNull();
    expect(programFunnelWelcomeCopy("")).toBeNull();
  });

  it("treats assessment payments as program funnels and membership checkout as not", () => {
    expect(isPublicProgramFunnelPayment({ source: "hair_assessment" })).toBe(true);
    expect(isPublicProgramFunnelPayment({ source: "womens_health_assessment" })).toBe(true);
    expect(isPublicProgramFunnelPayment({ source: "weight_management_assessment" })).toBe(true);
    expect(isPublicProgramFunnelPayment({ source: "" })).toBe(false);
    expect(isPublicProgramFunnelPayment(null)).toBe(false);
  });
});
