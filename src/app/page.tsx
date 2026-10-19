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
import { homeMembershipFaqs } from "@/lib/seo/home-faq";
// GP referral band (GPCTABand) is hidden until the GP portal ships in v2.

export const metadata = publicPageMeta.home;

const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeMembershipFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const homePagesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Sanative health check and care programs",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Health check in Australia",
      url: "https://sanative.com.au/guides/health-check-australia",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Biomarker labs",
      url: "https://sanative.com.au/labs",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Organ health check",
      url: "https://sanative.com.au/organ-care",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Weight management",
      url: "https://sanative.com.au/weight-management",
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Men's health",
      url: "https://sanative.com.au/mens-health",
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "Women's health",
      url: "https://sanative.com.au/womens-health",
    },
  ],
};

export default function HomePage() {
  return (
    <MarketingFonts className="min-h-screen bg-[#fdfbf7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePagesJsonLd) }}
      />
      <Header />
      <main>
        <BiomarkersHeroBanner />
        <BentoHero />
        <LabsSection />
        <HomeLifestyleBanner />
        <SanativeJourney showStats={false} />
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
