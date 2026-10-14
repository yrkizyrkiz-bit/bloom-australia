import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { MarketingFonts } from "@/components/promo/MarketingFonts";
import { BentoHero } from "@/components/promo/sections/BentoHero";
import { LabsSection } from "@/components/promo/sections/LabsSection";
import { BiomarkersHeroBanner } from "@/components/promo/sections/BiomarkersHeroBanner";
import { HomeLifestyleBanner } from "@/components/promo/sections/HomeLifestyleBanner";
import { QuestionsSection } from "@/components/promo/sections/QuestionsSection";
import { DoctorsSection } from "@/components/promo/sections/DoctorsSection";
import { TestimonialsSection } from "@/components/promo/sections/TestimonialsSection";
import { SanativeJourney } from "@/components/promo/sections/SanativeJourney";
import { MembershipPricingSection } from "@/components/promo/sections/MembershipPricingSection";
import { MemberProgramsSection } from "@/components/promo/sections/MemberProgramsSection";
import { publicPageMeta } from "@/lib/seo/public-page-meta";
// GP referral band (GPCTABand) is hidden until the GP portal ships in v2.

export const metadata = publicPageMeta.home;

export default function HomePage() {
  return (
    <MarketingFonts className="min-h-screen bg-[#fdfbf7]">
      <Header />
      <main>
        <BiomarkersHeroBanner />
        <BentoHero />
        <LabsSection />
        <HomeLifestyleBanner />
        <SanativeJourney />
        <MembershipPricingSection />
        <DoctorsSection />
        <MemberProgramsSection />
        <QuestionsSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </MarketingFonts>
  );
}
