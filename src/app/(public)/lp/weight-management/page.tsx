import { FaqSection } from "@/components/lp/weight-management/faq-section";
import { PrefetchFunnel } from "@/components/lp/weight-management/prefetch-funnel";
import { FinalCta } from "@/components/lp/weight-management/final-cta";
import { Hero } from "@/components/lp/weight-management/hero";
import { MarkersSection } from "@/components/lp/weight-management/markers-section";
import { SiteFooter } from "@/components/lp/weight-management/site-footer";
import { SiteHeader } from "@/components/lp/weight-management/site-header";
import { StickyCta } from "@/components/lp/weight-management/sticky-cta";
import { TeamSection } from "@/components/lp/weight-management/team-section";
import { PricingSlider } from "@/components/lp/weight-management/pricing-slider";
import { ValueSection } from "@/components/lp/weight-management/value-section";
import { WhatsIncluded } from "@/components/lp/weight-management/whats-included";

export default function WeightManagementLandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <MarkersSection />
        <WhatsIncluded />
        <PricingSlider />
        <ValueSection />
        <TeamSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta />
      <PrefetchFunnel />
    </>
  );
}
