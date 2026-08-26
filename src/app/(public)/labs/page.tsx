"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { BiomarkerHoneycomb } from "@/components/promo/BiomarkerHoneycomb";
import { MembershipPricingCard } from "@/components/promo/sections/MembershipPricingCard";
import { ConditionScrollMarquee } from "@/components/promo/labs/ConditionScrollMarquee";
import { LabsRoadmapCascade } from "@/components/promo/labs/LabsRoadmapCascade";
import { LabsFAQSection } from "@/components/promo/labs/LabsFAQSection";
import "@/components/promo/sage-atmosphere.css";
import {
  ArrowRight,
  Check,
  MapPin,
  Sparkles,
  Beaker,
  BadgeCheck,
  MessageCircle,
  BarChart3,
  Route,
  RefreshCw,
  Calendar,
} from "lucide-react";



const comparisonFeatures = [
  { feature: "Biomarkers analysed", sanative: "85+", routine: "~20" },
  { feature: "Doctor review of every result", sanative: true, routine: false },
  { feature: "Clear results in app", sanative: true, routine: false },
  { feature: "Personalised Action Plan", sanative: true, routine: false },
  { feature: "Biological Age (Biological Clock)", sanative: true, routine: false },
  { feature: "Organ Care dashboards", sanative: true, routine: false },
  { feature: "Thyroid panel (TSH, free T3 & T4)", sanative: true, routine: "Sometimes TSH only" },
  { feature: "Inflammation marker (hs-CRP)", sanative: true, routine: false },
  { feature: "Metabolic health (glucose, HbA1c, insulin, lipids)", sanative: true, routine: "Partial" },
  { feature: "Iron, B12 & electrolytes", sanative: true, routine: "Partial" },
  { feature: "Follow-up support, 100% online", sanative: true, routine: false },
];

const doctors: {
  name: string;
  title: string;
  specialty: string;
  description: string;
  initials: string;
  color: string;
  image?: string;
}[] = [
  {
    name: "Dr Phillip Seeley",
    title: "Chief Medical Officer",
    specialty: "Preventative Medicine | Weight Management",
    description:
      "Experienced GP with expertise in Preventative Medicine and Weight Management. Dr Seeley has worked across Neonatal, Geriatric, and Emergency care settings.",
    initials: "PS",
    color: "from-[#5c7a52] to-[#4a6243]",
  },
  {
    name: "Mia Davies",
    title: "Head of Metabolic Health | Care Partner",
    specialty: "Patient Care Journey",
    description:
      "With years of experience in health and wellbeing support, Mia ensures you feel cared for at every step of your health action plan.",
    initials: "MD",
    color: "from-[#5d6a4d] to-[#313630]",
    image: "/images/team/mia.webp",
  },
  {
    name: "Olfat Zekry",
    title: "Clinical Pharmacist",
    specialty: "BPharm | Clinical Safety",
    description:
      "Olly brings clinical pharmacy expertise to support safe, effective care. She helps ensure your care plan is clinically sound and answers questions about your program.",
    initials: "OZ",
    color: "from-[#b4cdc4] to-[#7b8967]",
    image: "/images/team/olfat-zekry.webp",
  },
];

function LabsPageContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "heart";

  return (
    <>
      <Header announcementMessage="85+ health signals, from $1/day" />
      {/* No overflow on main, any overflow (incl. overflow-x-hidden) creates a
          scroll container and breaks position:sticky on the roadmap cascade. */}
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden max-lg:bg-[#fdfbf7] max-lg:px-3 max-lg:pb-3 max-lg:pt-2 lg:min-h-[700px]">
          {/* Mobile: inset rounded card. Desktop: full-bleed. */}
          <div className="relative overflow-hidden max-lg:min-h-[calc(100svh-7.5rem)] max-lg:rounded-[1.75rem] lg:absolute lg:inset-0 lg:min-h-[700px]">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/images/labs-hero.webp"
                alt="Woman overlooking the coast with biomarker health markers"
                fill
                className="object-cover object-center max-lg:object-[center_22%]"
                priority
                sizes="100vw"
                quality={95}
              />
              {/* Desktop: soft left scrim. Mobile: fuller dark overlay for top copy + bottom cloud */}
              <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#1a2218]/55 via-[#1a2218]/25 to-transparent lg:via-[#1a2218]/15" />
              <div className="absolute inset-0 hidden lg:block bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div
                className="absolute inset-0 lg:hidden"
                style={{
                  background:
                    "linear-gradient(180deg, rgb(12 18 16 / 58%) 0%, rgb(12 18 16 / 28%) 32%, rgb(12 18 16 / 18%) 48%, rgb(12 18 16 / 42%) 72%, rgb(12 18 16 / 68%) 100%)",
                }}
              />
            </div>

            {/* Desktop content */}
            <div className="relative hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6">
                  <TrendingUp className="w-4 h-4 text-[#a8bb9e]" />
                  <span>5%</span>
                  <span className="text-white/70">Back in range</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight">
                  Know your numbers.{" "}
                  <span className="text-[#a8bb9e]">Own your health.</span>
                </h1>

                <div className="mt-8">
                  <Link
                    href="/biomarker-intake"
                    className="btn-white inline-flex items-center gap-2 text-lg px-10 py-4"
                  >
                    Start testing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile content, left copy stack, atmosphere cloud, bottom CTA */}
            <div className="relative z-10 flex h-full min-h-[calc(100svh-7.5rem)] flex-col lg:hidden">
              <div className="relative z-20 px-6 pt-[21px] pr-10">
                <h1 className="promo-body text-[32px] font-normal leading-[1.05] tracking-[-0.06em] text-white">
                  Know your numbers.
                  <br />
                  Own your health.
                </h1>
                <p className="promo-body mt-3.5 max-w-[22ch] text-[16px] font-normal leading-[1.4] tracking-[-0.01em] text-white/85">
                  Monitor early indicators of 500+ diseases
                </p>
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 bottom-[5.75rem] top-[38%] z-0 flex flex-wrap content-end items-center justify-center gap-x-2.5 gap-y-2 overflow-hidden px-2.5"
                aria-hidden
                style={{
                  maskImage:
                    "linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 40%) 22%, rgb(0 0 0 / 75%) 55%, rgb(0 0 0 / 35%) 88%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 40%) 22%, rgb(0 0 0 / 75%) 55%, rgb(0 0 0 / 35%) 88%, transparent 100%)",
                }}
              >
                {(
                  [
                    { label: "Cholesterol" },
                    { label: "Heart", pill: true },
                    { label: "LDL Cholesterol" },
                    { label: "HDL Cholesterol" },
                    { label: "Apolipoprotein B" },
                    { label: "Hemoglobin A1c" },
                    { label: "Fasting Insulin" },
                    { label: "Metabolism", pill: true },
                    { label: "Uric Acid" },
                    { label: "Glucose" },
                    { label: "Estradiol" },
                    { label: "Hormones", pill: true },
                    { label: "Follicle Stimulating Hormone" },
                    { label: "DHEA-Sulfate" },
                    { label: "Cortisol" },
                    { label: "Thyroid-Stimulating Hormone" },
                    { label: "Inflammation & Stress", pill: true },
                    { label: "Vitamin D" },
                    { label: "Ferritin" },
                    { label: "Triglycerides" },
                    { label: "Free T4" },
                    { label: "hs-CRP" },
                  ] as { label: string; pill?: boolean }[]
                ).map((item, i) => (
                  <span
                    key={item.label}
                    className={
                      item.pill
                        ? "shrink-0 whitespace-nowrap rounded-full border border-white/55 px-3 py-1.5 text-[clamp(11px,3.1vw,13px)] font-medium tracking-tight text-white/82"
                        : `shrink-0 whitespace-nowrap text-[clamp(11px,3.1vw,13px)] font-medium tracking-tight ${
                            i % 3 === 0
                              ? "text-white/55 font-normal"
                              : i % 4 === 0
                                ? "text-[clamp(12px,3.4vw,15px)] text-white/80"
                                : "text-white/72"
                          }`
                    }
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="relative z-20 mt-auto flex w-full justify-center px-6 pb-14 pt-4">
                <Link
                  href="/biomarker-intake"
                  className="inline-flex min-h-[52px] w-full max-w-[320px] items-center justify-center rounded-full bg-white px-6 text-base font-semibold text-[#111111] shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
                >
                  Start testing
                </Link>
              </div>
            </div>

            {/* Stats Bar, desktop only inside hero; mobile shows below */}
            <div className="absolute bottom-0 left-0 right-0 hidden bg-white/95 backdrop-blur-sm lg:block">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-wrap justify-between gap-y-4 gap-x-4 w-full">
                  <div className="flex items-center gap-3 flex-1 min-w-[140px] justify-center lg:justify-start">
                    <div className="w-2 h-2 rounded-full bg-[#5c7a52] shrink-0" />
                    <span className="text-[#34412f]">
                      <strong>Simple</strong> blood test
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[140px] justify-center lg:justify-start">
                    <div className="w-2 h-2 rounded-full bg-[#5c7a52] shrink-0" />
                    <span className="text-[#34412f]">
                      <strong>85+</strong> health signals tested
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[140px] justify-center lg:justify-start">
                    <div className="w-2 h-2 rounded-full bg-[#5c7a52] shrink-0" />
                    <span className="text-[#34412f]">
                      <strong>Indicators</strong> of 500+ diseases
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[140px] justify-center lg:justify-start">
                    <div className="w-2 h-2 rounded-full bg-[#5c7a52] shrink-0" />
                    <span className="text-[#34412f]">
                      <strong>$1</strong>/day
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile stats, symmetric 2×2 under rounded hero card */}
        <div className="bg-[#fdfbf7] lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-3 py-7">
            {(
              [
                { lead: "Simple", support: "blood test" },
                { lead: "85+", support: "health signals tested" },
                { lead: "500+", support: "disease indicators" },
                { lead: "$1", support: "per day" },
              ] as const
            ).map((item) => (
              <div key={item.lead} className="flex min-h-[3.25rem] items-start gap-2.5">
                <div className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#5c7a52]" />
                <div className="min-w-0">
                  <p className="font-serif text-[15px] font-normal leading-snug tracking-[-0.01em] text-[#34412f]">
                    {item.lead}
                  </p>
                  <p className="font-serif mt-0.5 text-[13px] font-normal leading-snug text-[#5c7a52]">
                    {item.support}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#f4f7f2] py-3 text-center">
          <p className="text-xs text-[#5c7a52] max-w-4xl mx-auto px-4">
            Eligibility and practitioner order required. Lab results alone are not intended to diagnose, treat, or cure any condition. Doctor-developed insights and action plans include recommendations that encourage you to take action that may help improve your health.
          </p>
        </div>

        {/* Get Insights Section */}
        <section id="from-sample-to-action-plan" className="pt-10 lg:pt-14 pb-20 lg:pb-28 bg-white scroll-mt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                <span className="text-[#5c7a52] italic">From sample</span>
                <br />
                to action plan
              </h2>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Step 1 */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-6 lg:p-8">
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#e6ebe3] flex items-center justify-center text-[#5c7a52] text-sm font-medium">
                  1
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mt-8 mb-2">
                  Initial doctor Consultation
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  Join Sanative membership and book your initial doctor consultation plus your blood tests organised near you
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5c7a52] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2c3628]">Appointment confirmed</p>
                      <p className="text-xs text-[#7e9a72]">Friday, 11:00am</p>
                    </div>
                    <Check className="w-5 h-5 text-[#5c7a52] ml-auto" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-6 lg:p-8">
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#e6ebe3] flex items-center justify-center text-[#5c7a52] text-sm font-medium">
                  2
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mt-8 mb-2">
                  Get clear Insights
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  Clear results appear in the app with insights. Monitor early indicators of 500+ diseases, catch issues early and stay ahead, tracking your health changes over time.
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#2c3628]">Cholesterol/HDL Ratio</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Optimal</span>
                  </div>
                  <div className="relative h-2 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full mb-2">
                    <div className="absolute left-0 top-0 h-full w-1/4 bg-emerald-500 rounded-full" />
                    <div
                      className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-sm"
                      aria-hidden
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#7e9a72]">
                    <span>Jan 2026</span>
                    <span>Jun 2026</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-6 lg:p-8">
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#e6ebe3] flex items-center justify-center text-[#5c7a52] text-sm font-medium">
                  3
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mt-8 mb-2">
                  Turn your results into Action
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  On your second consultation, your doctor will review the results and develop a personalised health action plan.
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-center gap-4 mb-3">
                    {["Habits", "Exercise", "Medication", "Nutrition", "Sleep"].map((item) => (
                      <div key={item} className="text-center">
                        <div className="w-8 h-8 rounded-full bg-[#e6ebe3] flex items-center justify-center mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#5c7a52]" />
                        </div>
                        <span className="text-[10px] text-[#7e9a72]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-[#5c7a52]">8 Insights</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/biomarker-intake"
                className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4"
              >
                Start testing
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Biomarkers Section */}
        <section
          id="biomarkers"
          className="sage-atmosphere pt-10 lg:pt-14 pb-10 lg:pb-14 scroll-mt-28"
        >
          <div className="sage-atmosphere__bg" aria-hidden />
          <div className="sage-atmosphere__glow" aria-hidden />
          <div className="sage-atmosphere__noise" aria-hidden />

          <div className="sage-atmosphere__inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#173c32]">
                85+ biomarkers across
                <br />
                <span className="text-[#173c32]/80 italic">10 vital health areas</span>
              </h2>
              <p className="mt-4 text-[#173c32]/78 max-w-2xl mx-auto">
                Select a category to explore the biomarkers we test. Hover over any marker to learn what it measures.
              </p>
            </div>

            <BiomarkerHoneycomb defaultCategory={categoryFromUrl} />

            <div className="mt-6 text-center">
              <Link
                href="/labs/biomarkers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#173c32] text-white rounded-full hover:bg-[#2c3628] transition-colors"
              >
                Learn more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Results Unlock Treatment Section */}
        <section className="pt-10 lg:pt-14 pb-4 lg:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
                Your results unlock{" "}
                <span className="text-[#5c7a52] italic">your treatment plan</span>
              </h2>
            </div>

            {/* Three Columns */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Column 1 - See what's out of range */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-8 hover:shadow-xl hover:border-[#cdd8c6] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
                  <BarChart3 className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">
                  See what&apos;s out of range
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  Your doctor reviews every marker and flags what needs attention, not just the ones that are critically out of range.
                </p>
              </div>

              {/* Column 2 - Get matched to a program */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-8 hover:shadow-xl hover:border-[#cdd8c6] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
                  <Route className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">
                  Get matched to a program
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  If your results point to insulin resistance, thyroid issues, or metabolic dysfunction, we recommend the right Sanative program for you.
                </p>
              </div>

              {/* Column 3 - Retest and track progress */}
              <div className="relative bg-[#f4f7f2] rounded-3xl p-8 hover:shadow-xl hover:border-[#cdd8c6] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">
                  Retest and track progress
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  Retest after 3–6 months on a Sanative program to track biomarker changes with your doctor.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link
                href="/biomarker-intake"
                className="group inline-flex items-center gap-3 btn-primary text-lg px-8 py-4"
              >
                Start with a lab test
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Conditions Section */}
        <section className="pt-12 lg:pt-14 pb-20 lg:pb-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center lg:max-w-3xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
                Spot imbalances{" "}
                <span className="text-[#5c7a52] italic">before they become problems</span>
              </h2>
              <p className="mt-5 text-lg text-[#5c7a52]">
                Our tests can flag early warning signs across hundreds of conditions, often before you feel a thing.
              </p>
            </div>
          </div>
          <div className="mt-10 lg:mt-14">
            <ConditionScrollMarquee />
          </div>
        </section>

        {/* Action Plan / roadmap, cascading cards (replaces /labs/action-plan) */}
        <LabsRoadmapCascade />

        {/* Comparison Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                Why settle for a snapshot
                <br />
                <span className="text-[#5c7a52] italic">when you can see the full picture?</span>
              </h2>
            </div>

            {/* Comparison Table */}
            <div className="bg-[#f4f7f2] rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-[#e6ebe3]">
                <div className="p-4 lg:p-6" />
                <div className="p-4 lg:p-6 text-center bg-[#e6ebe3]">
                  <div className="w-10 h-10 rounded-full bg-[#5c7a52] flex items-center justify-center mx-auto mb-2">
                    <Beaker className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-[#2c3628] text-sm">Labs by Sanative</p>
                </div>
                <div className="p-4 lg:p-6 text-center">
                  <p className="text-[#5c7a52] text-sm">Routine blood test</p>
                </div>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 ${
                    i < comparisonFeatures.length - 1 ? "border-b border-[#e6ebe3]" : ""
                  }`}
                >
                  <div className="p-4 lg:p-6 text-sm text-[#2c3628]">{row.feature}</div>
                  <div className="p-4 lg:p-6 text-center bg-[#e6ebe3]/50">
                    {typeof row.sanative === "boolean" ? (
                      row.sanative ? (
                        <Check className="w-5 h-5 text-[#5c7a52] mx-auto" />
                      ) : (
                        <span className="w-5 h-1 bg-[#cdd8c6] rounded-full block mx-auto" />
                      )
                    ) : (
                      <span className="font-medium text-[#2c3628]">{row.sanative}</span>
                    )}
                  </div>
                  <div className="p-4 lg:p-6 text-center">
                    {typeof row.routine === "boolean" ? (
                      row.routine ? (
                        <Check className="w-5 h-5 text-[#5c7a52] mx-auto" />
                      ) : (
                        <span className="w-5 h-1 bg-[#cdd8c6] rounded-full block mx-auto" />
                      )
                    ) : (
                      <span className="text-[#7e9a72]">{row.routine}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/biomarker-intake" className="btn-primary">
                Start testing
              </Link>
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                  <span className="text-[#5c7a52] italic">Guided by</span> Australia&apos;s leading practitioners
                </h2>
                <p className="mt-6 text-lg text-[#5c7a52]">
                  Our medical advisory team designed every panel and reviews every result, so your care is always backed by expertise.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/biomarker-intake" className="btn-primary">
                    Start testing
                  </Link>
                </div>
              </div>

              {doctors[0] ? (
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
                  <div className={`bg-gradient-to-r ${doctors[0].color} p-6`}>
                    <div className="flex items-start gap-4">
                      {doctors[0].image ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm relative">
                          <Image
                            src={doctors[0].image}
                            alt={doctors[0].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                          {doctors[0].initials}
                        </div>
                      )}
                      <div>
                        <p className="text-white/80 text-sm">{doctors[0].title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1 h-4 bg-white/40 rounded-full" />
                          <span className="text-white text-sm">{doctors[0].specialty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif text-[#2c3628] mb-2">{doctors[0].name}</h3>
                    <p className="text-sm text-[#5c7a52]">{doctors[0].description}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Mia + Olly side by side for desktop balance */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {doctors.slice(1).map((doctor) => (
                <div
                  key={doctor.name}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm"
                >
                  <div className={`bg-gradient-to-r ${doctor.color} p-6`}>
                    <div className="flex items-start gap-4">
                      {doctor.image ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm relative">
                          <Image
                            src={doctor.image}
                            alt={doctor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                          {doctor.initials}
                        </div>
                      )}
                      <div>
                        <p className="text-white/80 text-sm">{doctor.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1 h-4 bg-white/40 rounded-full" />
                          <span className="text-white text-sm">{doctor.specialty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif text-[#2c3628] mb-2">{doctor.name}</h3>
                    <p className="text-sm text-[#5c7a52]">{doctor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Everything You Need Section */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                <span className="text-[#5c7a52] italic">More than a test.</span>
                <br />
                A complete care ecosystem.
              </h2>
              <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Your results unlock ongoing support, personalised treatment plans, and direct access to practitioners who actually know your numbers.
              </p>
            </div>

            {/* Features Bento */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#5c7a52] to-[#4a6243] rounded-3xl p-8 text-white">
                <p className="text-5xl lg:text-6xl font-serif">85+</p>
                <p className="mt-2 text-white/80">Biomarkers available through NATA-accredited labs</p>
              </div>

              <div className="bg-[#e6ebe3] rounded-3xl p-6 flex flex-col justify-between min-h-[200px]">
                <div>
                  <p className="text-[#5c7a52] italic font-serif text-lg">Doctor-reviewed</p>
                  <p className="text-2xl font-serif text-[#2c3628]">results</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-[#5c7a52]" />
                </div>
              </div>

              <div className="bg-[#f4f7f2] rounded-3xl p-6 flex flex-col justify-between min-h-[200px]">
                <p className="text-5xl font-serif text-[#2c3628]">100%</p>
                <div>
                  <p className="text-sm text-[#5c7a52]">AHPRA-registered doctors review your results</p>
                </div>
              </div>

              <div className="md:col-span-2 relative rounded-3xl overflow-hidden min-h-[200px] bg-gradient-to-br from-[#34412f] to-[#2c3628] p-8 text-white">
                <p className="text-5xl lg:text-6xl font-serif">NATA</p>
                <p className="mt-2 text-white/80">Accredited Australian pathology partners</p>
              </div>

              {/* Provider follow-ups */}
              <div className="bg-[#5c7a52] rounded-3xl p-6 text-white">
                <p className="text-[#a8bb9e] italic font-serif text-lg">Practitioner</p>
                <p className="text-2xl font-serif">follow-ups</p>
                <div className="mt-4 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
              </div>

              {/* In-app content */}
              <div className="bg-[#34412f] rounded-3xl p-6 text-white">
                <p className="text-[#7e9a72] italic font-serif text-lg">In-app</p>
                <p className="text-2xl font-serif">content</p>
                <div className="mt-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-[#7e9a72]">
              Individual results vary. Your doctor interprets results in the context of your health profile.
            </p>

            <div className="mt-10 text-center">
              <Link href="/biomarker-intake" className="btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </section>

        {/* Organ care, Sanative membership */}
        <section id="specialized-panels" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 lg:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                Organ care dashboard, <span className="text-[#5c7a52] italic">one membership</span>
              </h2>
            </div>

            <MembershipPricingCard />
          </div>
        </section>

        <LabsFAQSection />

        {/* Final CTA Section */}
        <section className="relative min-h-[500px] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/remote/unsplash/photo-1518495973542-4542c06a5843.webp"
              alt="Nature wellness"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#34412f]/90 via-[#34412f]/70 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight">
                Know yourself
                <br />
                <span className="text-[#a8bb9e]">from the inside out</span>
              </h2>

              {/* Mini chart visual */}
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block">
                <div className="flex items-end gap-2 h-16">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-white/60 mb-1">Optimal</span>
                    <div className="w-8 h-12 bg-[#5c7a52] rounded-t" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-white/60 mb-1">50</span>
                    <div className="w-8 h-10 bg-[#a8bb9e] rounded-t" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-[#c17a58] mb-1">Out of range</span>
                    <div className="w-8 h-6 bg-[#c17a58] rounded-t" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-white/60 mb-1">10</span>
                    <div className="w-8 h-4 bg-[#7e9a72] rounded-t" />
                  </div>
                </div>
                <p className="text-xs text-white/60 mt-2">85+ lab tests</p>
              </div>

              <div className="mt-8">
                <Link
                  href="/biomarker-intake"
                  className="btn-white inline-flex items-center gap-2"
                >
                  Start testing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Footer */}
        <section className="bg-[#f4f7f2] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-[#7e9a72] leading-relaxed">
              <sup>1</sup>Biomarkers track core biological pathways and while not diagnostic on their own, testing can help inform a practitioner about the underlying physiologic shifts that are associated with a very wide range of conditions.
            </p>
            <p className="text-xs text-[#7e9a72] leading-relaxed mt-3">
              <sup>2</sup>Routine bloodwork may typically only include a complete blood count, a basic metabolic panel, a lipid panel, glycated haemoglobin, and thyroid-stimulating hormone.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function LabsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LabsPageContent />
    </Suspense>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
