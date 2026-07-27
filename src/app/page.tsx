import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { BentoHero } from "@/components/promo/sections/BentoHero";
import { LabsSection } from "@/components/promo/sections/LabsSection";
import { BiomarkersHeroBanner } from "@/components/promo/sections/BiomarkersHeroBanner";
import { QuestionsSection } from "@/components/promo/sections/QuestionsSection";
import { DoctorsSection } from "@/components/promo/sections/DoctorsSection";
import { TestimonialsSection } from "@/components/promo/sections/TestimonialsSection";
import { HowItWorksSection } from "@/components/promo/sections/HowItWorksSection";
import { MembershipPricingSection } from "@/components/promo/sections/MembershipPricingSection";
import { MemberProgramsSection } from "@/components/promo/sections/MemberProgramsSection";
import { CTASection } from "@/components/promo/sections/CTASection";
import { HomeFAQSection } from "@/components/promo/sections/HomeFAQSection";
import { GPCTABand } from "@/components/promo/sections/GPCTABand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />
      <main>
        <BentoHero />
        <LabsSection />
        <BiomarkersHeroBanner />
        <HowItWorksSection />
        <MembershipPricingSection />
        <MemberProgramsSection />
        <DoctorsSection />
        <GPCTABand />
        <QuestionsSection />
        <TestimonialsSection />
        <CTASection />
        <HomeFAQSection />
      </main>
      <Footer />
    </div>
  );
}
