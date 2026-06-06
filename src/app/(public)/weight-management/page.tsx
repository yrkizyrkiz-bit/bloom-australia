import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { WeightLossHero } from "@/components/promo/weight-loss/WeightLossHero";
import { ProgramIncludesSection } from "@/components/promo/weight-loss/ProgramIncludesSection";
import { ProblemSection } from "@/components/promo/weight-loss/ProblemSection";
import { BiomarkerQuestionsSection } from "@/components/promo/weight-loss/BiomarkerQuestionsSection";
import { BiomarkerHealthSection } from "@/components/promo/weight-loss/BiomarkerHealthSection";
import { ObjectionHandlingSection } from "@/components/promo/weight-loss/ObjectionHandlingSection";
import { WeightLossTeamSection } from "@/components/promo/weight-loss/WeightLossTeamSection";
import { WhyThisWorksSection } from "@/components/promo/weight-loss/WhyThisWorksSection";
import { WeightLossHowItWorks } from "@/components/promo/weight-loss/WeightLossHowItWorks";
import { EligibilitySection } from "@/components/promo/weight-loss/EligibilitySection";
import { PricingSection } from "@/components/promo/weight-loss/PricingSection";

import { AppSection } from "@/components/promo/weight-loss/AppSection";
import { TrustSection } from "@/components/promo/weight-loss/TrustSection";
import { VideoTestimonialsSection } from "@/components/promo/weight-loss/VideoTestimonialsSection";
import { FAQSection } from "@/components/promo/weight-loss/FAQSection";
import { FinalCTASection } from "@/components/promo/weight-loss/FinalCTASection";

export default function WeightManagementPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <WeightLossHero />

        <ProgramIncludesSection />
        <BiomarkerHealthSection />
        <ProblemSection />
        <BiomarkerQuestionsSection />
        <ObjectionHandlingSection />
        <WeightLossTeamSection />
        <VideoTestimonialsSection />
        <WhyThisWorksSection />
        <WeightLossHowItWorks />
        <EligibilitySection />
        <PricingSection />
        <AppSection />
        <TrustSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
