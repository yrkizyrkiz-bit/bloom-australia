"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ErectileDysfunctionContent } from "@/components/promo/mens-health/ErectileDysfunctionContent";
import { MensHealthMembershipHowItWorks } from "@/components/promo/mens-health/MensHealthMembershipHowItWorks";
import { SanativeJourney } from "@/components/promo/sections/SanativeJourney";
import {
  BiomarkerHoneycomb,
  MENS_HEALTH_PANEL_HONEYCOMB_IDS,
} from "@/components/promo/BiomarkerHoneycomb";
import { PUBLIC_BIOMARKER_COUNT_LABEL } from "@/lib/biomarkers/public-subscription-panels";
import {
  ArrowRight,
  Zap,
  Heart,
  CheckCircle,
  Beaker,
  Scale,
  Stethoscope,
  Sparkles,
  Lock,
  Users,
  HeartHandshake,
} from "lucide-react";

// Treatment Section Component
function TreatmentSection({
  id,
  icon: Icon,
  title,
  subtitle,
  description,
  symptoms,
  focusAreas,
  image,
  link,
  linkText,
  isReversed = false,
  bgColor = "bg-[#fdfbf7]",
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  symptoms: string[];
  focusAreas: string[];
  image: string;
  link: string;
  linkText: string;
  isReversed?: boolean;
  bgColor?: string;
}) {
  return (
    <section id={id} className={`py-20 lg:py-28 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
          {/* Content */}
          <div className={isReversed ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#5c7a52]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">{title}</h2>
                <p className="text-[#7e9a72]">{subtitle}</p>
              </div>
            </div>

            <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
              {description}
            </p>

            {/* Symptoms */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[#2c3628] uppercase tracking-wider mb-4">
                Common symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="px-4 py-2 bg-white border border-[#e6ebe3] text-[#5c7a52] text-sm rounded-full"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            {/* Assessment focus */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[#2c3628] uppercase tracking-wider mb-4">
                Assessment focus
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {focusAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-3 text-[#5c7a52]"
                  >
                    <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={link}
              className="btn-primary inline-flex items-center gap-2"
            >
              {linkText}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Image */}
          <div className={isReversed ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MensHealthPage() {
  // Energy & vitality, sexual health has its own section below
  const treatmentSections = [
    {
      id: "energy",
      icon: Zap,
      title: "Energy & Vitality",
      subtitle: "Doctor-led metabolic wellbeing",
      description:
        "Feeling constantly tired is worth investigating properly. Through health assessment and biomarker testing where clinically appropriate, your doctor reviews factors that may affect energy, recovery, and overall vitality, then discusses a personalised care plan if suitable.",
      symptoms: ["Chronic fatigue", "Poor sleep quality", "Afternoon crashes", "Difficulty concentrating", "Slow recovery", "Brain fog"],
      focusAreas: ["Sleep and stress patterns", "Nutrient and thyroid markers", "Metabolic health", "Lifestyle and recovery habits"],
      image: "/images/mens-health/energy-vitality.webp",
      link: "/mens-health/assessment?concern=energy-vitality",
      linkText: "Start assessment",
      bgColor: "bg-[#fdfbf7]",
    },
  ];

  // Patient testimonials removed for AHPRA/TGA compliance, see PublicComplianceBlock below

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Full-bleed hero */}
        <section className="relative w-full overflow-hidden bg-[#1a2218]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mens-health-hero.webp"
            alt="Man jogging at sunrise with Sanative biomarker health insights overlay"
            width={1536}
            height={1024}
            className="block h-auto w-full max-w-none"
            decoding="async"
            fetchPriority="high"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          <div className="absolute inset-0 z-10 flex items-start justify-end px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 lg:pt-[8%] pb-8">
            <div className="max-w-[min(100%,22rem)] sm:max-w-md lg:max-w-lg text-right animate-fade-in">
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-white leading-[1.15] drop-shadow-lg">
                Better performance starts with better biomarkers
              </h1>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base text-white/85 leading-relaxed ml-auto max-w-sm">
                Doctor-led men&apos;s health assessment guided by the markers that matter.
              </p>
            </div>
          </div>
        </section>

        {/* Program cards */}
        <section id="programs" className="pt-10 pb-8 lg:pt-14 lg:pb-12 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 lg:gap-4">
              <Link
                href="/weight-management?gender=men"
                className="md:col-span-2 group relative rounded-2xl overflow-hidden bg-[#e8efe4] hover:bg-[#34412f] p-5 min-h-[152px] lg:min-h-[168px] flex flex-col justify-between text-left transition-colors duration-300 ease-out"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#c17a58] text-white rounded-full mb-2">
                    Most Popular
                  </span>
                  <h3 className="text-lg font-serif text-[#2c3628] group-hover:text-white transition-colors duration-300">
                    Weight <span className="text-[#5c7a52] group-hover:text-[#cdd8c6]">Management</span>
                  </h3>
                  <p className="text-[#5c7a52] text-sm mt-1.5 group-hover:text-white/80 transition-colors duration-300">
                    Medical weight loss programs with personalised support
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <ArrowRight className="w-4 h-4 text-[#34412f] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  <div className="w-10 h-10 bg-black/5 group-hover:bg-white/15 rounded-full flex items-center justify-center transition-colors duration-300">
                    <Scale className="w-5 h-5 text-[#5c7a52] group-hover:text-white/80 transition-colors duration-300" />
                  </div>
                </div>
              </Link>

              <Link
                href="/labs#from-sample-to-action-plan"
                className="md:col-span-2 group relative rounded-2xl overflow-hidden bg-[#e6ebe3] hover:bg-[#3d4f38] p-5 min-h-[152px] lg:min-h-[168px] flex flex-col justify-between text-left transition-colors duration-300 ease-out"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#5c7a52] text-white rounded-full mb-2">
                    Recommended
                  </span>
                  <h3 className="text-lg font-serif text-[#2c3628] group-hover:text-white transition-colors duration-300">
                    Biomarker <span className="text-[#5c7a52] group-hover:text-[#cdd8c6]">Testing</span>
                  </h3>
                  <p className="text-[#5c7a52] text-sm mt-1.5 group-hover:text-white/80 transition-colors duration-300">
                    Comprehensive blood tests for optimal health
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <ArrowRight className="w-4 h-4 text-[#34412f] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  <div className="w-10 h-10 bg-black/5 group-hover:bg-white/15 rounded-full flex items-center justify-center transition-colors duration-300">
                    <Beaker className="w-5 h-5 text-[#5c7a52] group-hover:text-white/80 transition-colors duration-300" />
                  </div>
                </div>
              </Link>

              <Link
                href="/hair-health?gender=men"
                className="md:col-span-2 group relative rounded-2xl overflow-hidden bg-[#f3e6d8] hover:bg-[#c17a58] p-5 min-h-[152px] lg:min-h-[168px] flex flex-col justify-between text-left transition-colors duration-300 ease-out"
              >
                <div>
                  <h3 className="text-lg font-serif text-[#2c3628] group-hover:text-white transition-colors duration-300">
                    Hair <span className="text-[#c17a58] group-hover:text-[#f8e1e1]">Loss</span>
                  </h3>
                  <p className="text-[#5c7a52] text-sm mt-1.5 group-hover:text-white/85 transition-colors duration-300">
                    Doctor-led hair health assessment and care planning
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <ArrowRight className="w-4 h-4 text-[#34412f] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  <div className="w-10 h-10 bg-black/5 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-300">
                    <Sparkles className="w-5 h-5 text-[#c17a58] group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </Link>

              <Link
                href="/mens-health/erectile-dysfunction"
                className="md:col-span-3 group relative rounded-2xl overflow-hidden bg-[#ece8e0] hover:bg-[#2c3628] p-5 min-h-[152px] lg:min-h-[168px] flex flex-col justify-between text-left transition-colors duration-300 ease-out"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#c17a58] text-white rounded-full mb-2">
                    Confidential care
                  </span>
                  <h3 className="text-lg font-serif text-[#2c3628] group-hover:text-white transition-colors duration-300">
                    Erectile <span className="text-[#5c7a52] group-hover:text-[#a8bb9e]">Dysfunction</span>
                  </h3>
                  <p className="text-[#5c7a52] text-sm mt-1.5 group-hover:text-white/80 transition-colors duration-300">
                    Doctor-led assessment, care options discussed privately if clinically appropriate
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <ArrowRight className="w-4 h-4 text-[#34412f] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  <div className="w-10 h-10 bg-black/5 group-hover:bg-white/15 rounded-full flex items-center justify-center transition-colors duration-300">
                    <Heart className="w-5 h-5 text-[#5c7a52] group-hover:text-[#a8bb9e] transition-colors duration-300" />
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection("energy")}
                className="md:col-span-3 group relative rounded-2xl overflow-hidden bg-[#e4eee6] hover:bg-[#5c7a52] p-5 min-h-[152px] lg:min-h-[168px] flex flex-col justify-between text-left transition-colors duration-300 ease-out"
              >
                <div>
                  <h3 className="text-lg font-serif text-[#2c3628] group-hover:text-white transition-colors duration-300">
                    Energy & <span className="text-[#5c7a52] group-hover:text-[#cdd8c6]">Vitality</span>
                  </h3>
                  <p className="text-[#5c7a52] text-sm mt-1.5 group-hover:text-white/85 transition-colors duration-300">
                    Doctor-led vitality support
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <ArrowRight className="w-4 h-4 text-[#34412f] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  <div className="w-10 h-10 bg-black/5 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-300">
                    <Zap className="w-5 h-5 text-[#5c7a52] group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-6 lg:gap-10 text-sm text-[#5c7a52]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>AHPRA Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>100% Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>Ongoing care team support</span>
              </div>
            </div>
          </div>
        </section>

        <ErectileDysfunctionContent variant="embed" />

        {/* Energy & vitality */}
        {treatmentSections.map((section, index) => (
          <TreatmentSection
            key={section.id}
            {...section}
            isReversed={index % 2 === 1}
          />
        ))}

        {/* Biomarker Testing Section */}
        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-[#a8bb9e] rounded-full mb-4">
                  Biomarker-driven care
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
                  Test. Don&apos;t guess.{" "}
                  <span className="text-[#a8bb9e] italic">Know your numbers.</span>
                </h2>
                <p className="text-lg text-[#a8bb9e] mb-8">
                  Every man&apos;s biology is different. The Essential panel measures thyroid, metabolic,
                  heart, liver, kidney and nutrient markers, giving your doctor the data needed to
                  personalise your care plan where clinically appropriate.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-3xl font-serif text-white">{PUBLIC_BIOMARKER_COUNT_LABEL}</p>
                    <p className="text-sm text-[#a8bb9e]">Biomarkers tested</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-3xl font-serif text-white">NATA</p>
                    <p className="text-sm text-[#a8bb9e]">Accredited Australian labs</p>
                  </div>
                </div>

                <Link
                  href="/labs"
                  className="btn-white inline-flex items-center gap-2"
                >
                  Explore biomarker testing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-1">Key biomarkers we test</h3>
                  <p className="text-sm text-[#a8bb9e] mb-5">Measured on Essential</p>

                  <div className="mx-auto w-fit">
                    <BiomarkerHoneycomb
                      includeIds={MENS_HEALTH_PANEL_HONEYCOMB_IDS}
                      highlightAll
                      showCategoryTabs={false}
                      showCalculatedFooter={false}
                      palette="sage"
                      align="center"
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/15">
                    <p className="text-sm font-medium text-white mb-1">Measured if risk factors exist</p>
                    <p className="text-xs text-[#a8bb9e] mb-4">
                      Your doctor may add these when symptoms, age, or other clinical risk factors
                      warrant them.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { short: "TT", full: "Hormone panel" },
                        { short: "PSA", full: "PSA (prostate)" },
                      ].map((marker) => (
                        <div key={marker.short} className="flex items-center gap-3">
                          <div
                            className="w-12 h-14 flex items-center justify-center text-white text-xs font-medium bg-white/15"
                            style={{
                              clipPath:
                                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            }}
                          >
                            {marker.short}
                          </div>
                          <span className="text-sm text-white/90">{marker.full}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/labs/biomarkers"
                    className="mt-6 inline-flex items-center gap-2 text-sm text-[#a8bb9e] hover:text-white transition-colors"
                  >
                    View all biomarkers
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SanativeJourney
          fullWidth
          heading={
            <>
              Your health at your <em>fingertips</em>
            </>
          }
          subheading="Test before you treat"
        />

        {/* Trust Section */}
        <section className="py-20 lg:py-28 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">AHPRA Registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors are fully registered with AHPRA</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">100% Confidential</h3>
                <p className="text-sm text-[#5c7a52]">Your health information is private and secure</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Ongoing support</h3>
                <p className="text-sm text-[#5c7a52]">Continuous care throughout your journey</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Personalised care</h3>
                <p className="text-sm text-[#5c7a52]">Care plans tailored to your unique biology</p>
              </div>
            </div>
          </div>
        </section>

        <MensHealthMembershipHowItWorks />

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-[#34412f] via-[#3d4f38] to-[#2c3628]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Take control of your health.{" "}
              <span className="text-[#a8bb9e] italic">Start today.</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Become a member and book your doctor consultation, get a health check-up followed by a doctor's recommendations of what is clinically appropriate for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mens-health/assessment"
                className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Start assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/labs"
                className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center px-8 py-4"
              >
                View blood tests
              </Link>
            </div>
            {/* GAP-026: Removed 'No commitment' - payment required */}
            <p className="mt-6 text-sm text-[#7e9a72]">
              Refund if not suitable · Australian doctors · Confidential care
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
