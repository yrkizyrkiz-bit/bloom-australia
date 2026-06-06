import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { WomensHealthHero } from "@/components/promo/womens-health/WomensHealthHero";
import { WomensHealthServices } from "@/components/promo/womens-health/WomensHealthServices";
import { WomensHealthHowItWorks } from "@/components/promo/womens-health/WomensHealthHowItWorks";
import { WomensHealthFAQ } from "@/components/promo/womens-health/WomensHealthFAQ";
import { WomensHealthCTA } from "@/components/promo/womens-health/WomensHealthCTA";

export default function WomensHealthPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <WomensHealthHero />
        <WomensHealthServices />
        <WomensHealthHowItWorks />
        <WomensHealthFAQ />
        <WomensHealthCTA />
      </main>
      <Footer />
    </>
  );
}
