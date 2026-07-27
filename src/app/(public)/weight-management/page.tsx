import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { WeightLossMembershipHero } from "@/components/promo/weight-loss/WeightLossMembershipHero";
import { WeightLossMembershipHowItWorks } from "@/components/promo/weight-loss/WeightLossMembershipHowItWorks";
import { ProgramIncludesSection } from "@/components/promo/weight-loss/ProgramIncludesSection";
import { BiomarkerQuestionsSection } from "@/components/promo/weight-loss/BiomarkerQuestionsSection";
import { BiomarkerHealthSection } from "@/components/promo/weight-loss/BiomarkerHealthSection";
import { ObjectionHandlingSection } from "@/components/promo/weight-loss/ObjectionHandlingSection";
import { WeightLossTeamSection } from "@/components/promo/weight-loss/WeightLossTeamSection";
import { WhyThisWorksSection } from "@/components/promo/weight-loss/WhyThisWorksSection";
import { EligibilitySection } from "@/components/promo/weight-loss/EligibilitySection";
import { PricingSection } from "@/components/promo/weight-loss/PricingSection";

import { TrustSection } from "@/components/promo/weight-loss/TrustSection";
import { FinalCTASection } from "@/components/promo/weight-loss/FinalCTASection";

export default function WeightManagementPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden">
        {/* Green continues under the white frame’s rounded corners */}
        <div
          className="relative"
          style={{
            background:
              "linear-gradient(180deg, #566738 0%, #46542e 55%, #3c4b28 100%)",
          }}
        >
          <WeightLossMembershipHero />
          <WeightLossMembershipHowItWorks />
        </div>

        <ProgramIncludesSection />
        <BiomarkerHealthSection />
        <BiomarkerQuestionsSection />
        <ObjectionHandlingSection />
        <WeightLossTeamSection />
        <WhyThisWorksSection />
        <EligibilitySection />
        <PricingSection />
        <TrustSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
