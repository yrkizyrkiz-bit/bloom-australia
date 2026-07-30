import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { WeightLossMembershipHero } from "@/components/promo/weight-loss/WeightLossMembershipHero";
import { WeightLossMembershipHowItWorks } from "@/components/promo/weight-loss/WeightLossMembershipHowItWorks";
import { CascadingHealthCards } from "@/components/promo/weight-loss/CascadingHealthCards";
import { BiomarkerQuestionsSection } from "@/components/promo/weight-loss/BiomarkerQuestionsSection";
import { BiomarkerHealthSection } from "@/components/promo/weight-loss/BiomarkerHealthSection";
import { ObjectionHandlingSection } from "@/components/promo/weight-loss/ObjectionHandlingSection";
import { WeightLossTeamSection } from "@/components/promo/weight-loss/WeightLossTeamSection";
import { WhyThisWorksSection } from "@/components/promo/weight-loss/WhyThisWorksSection";
import { EligibilitySection } from "@/components/promo/weight-loss/EligibilitySection";
import { PricingSection } from "@/components/promo/weight-loss/PricingSection";

import { TrustSection } from "@/components/promo/weight-loss/TrustSection";

export default function WeightManagementPage() {
  return (
    <>
      <Header />
      <main>
        {/* Green continues under the white frame’s rounded corners.
            Keep overflow clipping here only — not on <main> — so sticky cascade works. */}
        <div
          className="relative overflow-x-clip"
          style={{
            background:
              "linear-gradient(180deg, #566738 0%, #46542e 55%, #3c4b28 100%)",
          }}
        >
          <WeightLossMembershipHero />
          <WeightLossMembershipHowItWorks />
        </div>

        <CascadingHealthCards />
        <div className="overflow-x-clip">
          <BiomarkerHealthSection />
          <BiomarkerQuestionsSection />
          <ObjectionHandlingSection />
          <WeightLossTeamSection />
          <WhyThisWorksSection />
          <EligibilitySection />
          <PricingSection />
          <TrustSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
