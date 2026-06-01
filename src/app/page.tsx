import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { BentoHero } from "@/components/promo/sections/BentoHero";
import { LabsSection } from "@/components/promo/sections/LabsSection";
import { QuestionsSection } from "@/components/promo/sections/QuestionsSection";
import { SectionDivider } from "@/components/promo/sections/SectionDivider";
import { DoctorsSection } from "@/components/promo/sections/DoctorsSection";
import { TestimonialsSection } from "@/components/promo/sections/TestimonialsSection";
import { HowItWorksSection } from "@/components/promo/sections/HowItWorksSection";
import { CTASection } from "@/components/promo/sections/CTASection";
import { GPCTABand } from "@/components/promo/sections/GPCTABand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />
      <main>
        <BentoHero />
        <SectionDivider />
        <LabsSection />
        <SectionDivider variant="wave" />
        <HowItWorksSection />
        <SectionDivider />
        <DoctorsSection />
        <GPCTABand />
        <SectionDivider variant="wave" />
        <QuestionsSection />
        <SectionDivider />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
