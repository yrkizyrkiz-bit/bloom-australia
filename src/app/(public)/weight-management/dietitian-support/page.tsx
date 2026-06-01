import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { DietitianHero } from "@/components/promo/dietitian/DietitianHero";
import { MealRecommendations } from "@/components/promo/dietitian/MealRecommendations";
import { DietitianCTA } from "@/components/promo/dietitian/DietitianCTA";

export default function DietitianSupportPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <DietitianHero />
        <MealRecommendations />
        <DietitianCTA />
      </main>
      <Footer />
    </>
  );
}
