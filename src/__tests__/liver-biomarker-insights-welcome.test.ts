import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isLiverBiomarkerInsightsWelcomePurchase,
  LIVER_BIOMARKER_INSIGHTS_WELCOME_SUBJECT,
  renderLiverBiomarkerInsightsWelcomeEmail,
} from "@/lib/funnel/liver-biomarker-insights-welcome";
import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const MAGIC_LINK =
  "https://sanative.com.au/auth/magic?token=liver-token&redirect=%2Fdashboard%2Fliver-test";

const WELCOME_STEPS = [
  "Meet your doctor – Your Sanative doctor will review your health and arrange a pathology request if clinically appropriate.",
  "Get your blood tests – Visit a convenient pathology collection centre near you.",
  "Discover your health insights – Explore your biomarker results in the Sanative app, including your liver health insights and FIB-4 score, where available.",
  "Understand your results – Have a follow-up consultation with your doctor to discuss your findings and develop a personalised goal plan.",
];

describe("liver biomarker insights welcome email", () => {
  it("is only for the $79 liver product", () => {
    expect(isLiverBiomarkerInsightsWelcomePurchase(LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG)).toBe(
      true
    );
    expect(isLiverBiomarkerInsightsWelcomePurchase("sanative_membership")).toBe(false);
    expect(isLiverBiomarkerInsightsWelcomePurchase("weight_management")).toBe(false);
    expect(isLiverBiomarkerInsightsWelcomePurchase("hair_loss")).toBe(false);
    expect(isLiverBiomarkerInsightsWelcomePurchase(null)).toBe(false);
  });

  it("uses the Sanative welcome copy and includes the magic link plus new follow-up points", () => {
    const rendered = renderLiverBiomarkerInsightsWelcomeEmail({
      firstName: "Frodo",
      magicLink: MAGIC_LINK,
      needsPassword: true,
    });

    expect(rendered.subject).toBe(LIVER_BIOMARKER_INSIGHTS_WELCOME_SUBJECT);
    expect(rendered.subject).toBe("Welcome to Sanative");
    expect(rendered.subject).not.toMatch(/membership|\$365|auto-renew/i);

    expect(rendered.html).toContain("Hi Frodo,");
    expect(rendered.text).toContain("Hi Frodo,");
    expect(rendered.html).toContain("Welcome to Sanative! 💚");
    expect(rendered.text).toContain("Welcome to Sanative!");
    expect(rendered.html).not.toContain("Welcome to Sanative Health");
    expect(rendered.text).not.toContain("Welcome to Sanative Health");
    expect(rendered.html).toContain("Your Sanative membership is now active.");
    expect(rendered.html).toContain(
      "Simply use the secure link below to access your personal health portal."
    );
    expect(rendered.html).toContain(
      "https://sanative.com.au/auth/magic?token=liver-token&amp;redirect=%2Fdashboard%2Fliver-test"
    );
    expect(rendered.html).toContain("Set your password &amp; open your portal");
    expect(rendered.html).toMatch(
      /personal health portal\.<\/p>\s*<p[^>]*>\s*<a href="https:\/\/sanative\.com\.au\/auth\/magic/
    );
    expect(rendered.text).toContain(MAGIC_LINK);
    expect(rendered.text).toContain("Set your password & open your portal");
    expect(rendered.text).toContain(
      "Simply use the secure link below to access your personal health portal."
    );

    for (const step of WELCOME_STEPS) {
      const [title, body] = step.split(" – ");
      expect(rendered.html).toContain(`<strong>${title}</strong> – ${body}`);
      expect(rendered.text).toContain(step);
    }

    expect(rendered.html).toContain("<em>We're with you all the way.</em>");
    expect(rendered.html).toContain("<strong>What happens next?</strong>");
    expect(rendered.html).toContain("Preventative medicine. Precise care.");
    expect(rendered.html).toContain("Longevity built for Australians.");
    expect(rendered.html).toContain("www.sanative.com.au");

    expect(rendered.html).not.toMatch(/auto-renew/i);
    expect(rendered.text).not.toMatch(/auto-renew/i);
    expect(rendered.html).not.toContain("Sanative Membership");
    expect(rendered.text).not.toContain("Sanative Membership");
    expect(rendered.html).not.toContain("$365");
    expect(rendered.text).not.toContain("$365");
    expect(rendered.html).not.toMatch(/Medicare/i);
    expect(rendered.text).not.toMatch(/Medicare/i);
    expect(rendered.html).not.toContain("TEST");
    expect(rendered.subject).not.toContain("TEST");
  });

  it("addresses the member by first name and falls back to Hi, when missing", () => {
    const withName = renderLiverBiomarkerInsightsWelcomeEmail({
      firstName: "Frodo",
      magicLink: MAGIC_LINK,
      needsPassword: false,
    });
    expect(withName.html).toContain("<p>Hi Frodo,</p>");
    expect(withName.text.startsWith("Hi Frodo,\n")).toBe(true);

    const missing = renderLiverBiomarkerInsightsWelcomeEmail({
      firstName: "   ",
      magicLink: MAGIC_LINK,
      needsPassword: false,
    });
    expect(missing.html).toContain("<p>Hi,</p>");
    expect(missing.html).not.toContain("Hi ,");
    expect(missing.text.startsWith("Hi,\n")).toBe(true);
    expect(missing.text).not.toContain("Hi ,");
  });

  it("sends the liver welcome from checkout complete and keeps membership on the existing welcome", () => {
    const complete = readSource("app/api/public/membership-checkout/complete/route.ts");
    const checkoutPage = readSource("app/(public)/membership/checkout/page.tsx");
    const sender = readSource("lib/funnel/liver-biomarker-insights-welcome.ts");
    const membershipEmail = readSource("lib/email.ts");

    expect(complete).toContain("sendLiverBiomarkerInsightsWelcomeEmail");
    expect(complete).toContain("firstName: userForLink.firstName || firstName || \"\"");
    expect(complete).toContain("sendMembershipWelcomeEmail");
    expect(complete).toMatch(
      /if \(isLiverInsights\) \{[\s\S]*sendLiverBiomarkerInsightsWelcomeEmail/
    );
    expect(complete).toMatch(
      /else if \(!result\.alreadyProcessed\) \{[\s\S]*sendMembershipWelcomeEmail/
    );
    expect(complete).not.toMatch(
      /if \(!result\.alreadyProcessed && !isLiverInsights\)/
    );

    expect(sender).toContain("sendEmail({");
    expect(sender).not.toContain("createEmailDraft");
    expect(sender).not.toContain("sendMembershipWelcomeEmail");
    expect(sender).toContain("sendLiverBiomarkerInsightsWelcomeEmail");

    expect(membershipEmail).toContain(
      'const subject = "Welcome to Sanative: your membership is active"'
    );
    expect(membershipEmail).toContain("auto-renews annually");

    expect(checkoutPage).toContain(
      'liverInsightsCheckout ? "Welcome to Liver Biomarker Insights" : "Welcome to Sanative!"'
    );
    expect(checkoutPage).toContain(
      "We&apos;ve emailed you a secure sign-in link to finish setup."
    );
    expect(checkoutPage).toContain(
      "Your membership is active. We&apos;ve emailed you a secure sign-in link."
    );
  });
});
