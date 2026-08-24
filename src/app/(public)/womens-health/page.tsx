import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { WomensHealthHero } from "@/components/promo/womens-health/WomensHealthHero";
import { WomensHealthMenopauseContent } from "@/components/promo/womens-health/WomensHealthMenopauseContent";

export default function WomensHealthPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <WomensHealthHero />
        <WomensHealthMenopauseContent />
      </main>
      <Footer />
    </>
  );
}
