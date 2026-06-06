"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { BiomarkerHoneycomb } from "@/components/promo/BiomarkerHoneycomb";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Sparkles,
  Beaker,
  BadgeCheck,
  MessageCircle,
  Star,
  BarChart3,
  Route,
  RefreshCw,
  Heart,
  Brain,
  Zap,
  Droplets,
  Activity,
  Flame,
  Calendar,
} from "lucide-react";



const conditions = [
  "Metabolic syndrome", "Type 2 diabetes", "Gout", "Chronic kidney disease",
  "Hypothyroidism", "Anaemia", "Growth hormone deficiency", "Metabolic dysfunction",
  "Folate deficiency", "Vitamin B12 deficiency", "MASLD", "Thrombocytosis",
  "Addison's disease", "Coronary artery disease", "PCOS", "Hashimoto's thyroiditis",
  "Insulin resistance", "Fatty liver disease", "Iron deficiency", "Hyperthyroidism",
];

const comparisonFeatures = [
  { feature: "Lab tests per year", sanative: "80+", routine: "~20" },
  { feature: "Retest every 6 months", sanative: true, routine: false },
  { feature: "Personalised Action Plan", sanative: true, routine: false },
  { feature: "No Medicare required", sanative: true, routine: false },
  { feature: "Clear results in app", sanative: true, routine: false },
  { feature: "Doctor follow-ups, 100% online", sanative: true, routine: false },
  { feature: "Biological Age assessment", sanative: true, routine: false },
  { feature: "Inflammation and stress markers", sanative: true, routine: false },
  { feature: "Enhanced hormone and thyroid testing", sanative: true, routine: false },
  { feature: "Nutrient and electrolyte testing", sanative: true, routine: false },
];

const faqs = [
  {
    question: "Who is Labs recommended for?",
    answer: "Labs by Sanative is ideal for anyone looking for a holistic picture of their health that goes beyond a traditional GP visit — and provides a clear path forward with personalised action plans. You must be 18 or older to purchase a Labs plan.",
  },
  {
    question: "How does the lab testing process work?",
    answer: "After purchasing your Labs plan, you'll book an appointment at one of our partner pathology centres across Australia. Your blood sample is analysed by NATA-accredited laboratories, and results are delivered to your app within 5-7 business days with expert interpretation.",
  },
  {
    question: "Do I need to visit a lab in person?",
    answer: "Simply visit one of hundreds of partner pathology centres across Australia for a quick blood sample collection. We have centres conveniently located nationwide, making it easy to find one near you.",
  },
  {
    question: "What do the plans test for?",
    answer: "Our comprehensive panels include 80+ tests and markers across 8 vital health areas: heart health, hormones, metabolism, inflammation, stress, liver function, kidney function, and nutrients. Results help identify early indicators of 1,000+ health conditions.",
  },
  {
    question: "How do you count the number of tests?",
    answer: "Our count includes both individual biomarkers (like Vitamin D or cortisol) and panel tests that measure multiple values at once. For example, a lipid panel measures LDL, HDL, total cholesterol, and triglycerides — that's 4 markers from one panel. A complete blood count (CBC) measures over 10 values. This is standard practice in pathology and gives you more insight per test.",
  },
  {
    question: "Are video consultations with a doctor required?",
    answer: "No, a video consultation isn't required for Labs. However, all results are reviewed by AHPRA-registered doctors, and you have access to unlimited messaging with your care team for any questions about your results.",
  },
  {
    question: "Is private health insurance required?",
    answer: "No insurance is required. Labs by Sanative is a private service with transparent, upfront pricing. No Medicare billing, no hidden costs.",
  },
];

const doctors = [
  {
    name: "Dr. Sarah Chen",
    title: "Chief Medical Officer",
    specialty: "Women's Health | Hormone Health",
    description: "A board-certified GP with 15+ years experience in women's health. Dr. Chen leads our medical team with a focus on personalised, evidence-based care.",
    initials: "SC",
    color: "from-[#c17a58] to-[#a9634a]",
  },
  {
    name: "Dr. Emma Thompson",
    title: "Head of Metabolic Health",
    specialty: "Metabolic Health",
    description: "Specialist in metabolic medicine and obesity treatment. Dr. Thompson ensures our metabolic panels meet the highest clinical standards.",
    initials: "ET",
    color: "from-[#5c7a52] to-[#4a6243]",
  },
];

function LabsPageContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "heart";

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80"
              alt="Woman in nature"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#34412f]/90 via-[#34412f]/70 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="max-w-2xl">
              {/* Floating Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6">
                <TrendingUp className="w-4 h-4 text-[#a8bb9e]" />
                <span>5%</span>
                <span className="text-white/70">Back in range</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight">
                Know your numbers.{" "}
                <span className="text-[#a8bb9e]">Own your health.</span>
              </h1>

              <p className="mt-6 text-lg lg:text-xl text-white/80 max-w-lg">
                80+ biomarkers tested at NATA-accredited Australian labs. Results reviewed by an AHPRA-registered doctor. Understand what&apos;s driving your weight, fatigue, hormones, and more — before starting any treatment.
              </p>

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

          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-16">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#5c7a52]" />
                  <span className="text-[#34412f]">
                    <strong>80+</strong> health signals tested
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#5c7a52]" />
                  <span className="text-[#34412f]">
                    <strong>Simple</strong> blood test 2x per year
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#5c7a52]" />
                  <span className="text-[#34412f]">
                    <strong>Less than</strong> $1/day
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-[#f4f7f2] py-3 text-center">
          <p className="text-xs text-[#5c7a52] max-w-4xl mx-auto px-4">
            Eligibility and practitioner order required. Lab results alone are not intended to diagnose, treat, or cure any condition. Doctor-developed insights and action plans include recommendations that encourage you to take action that may help improve your health.
          </p>
        </div>

        {/* Get Insights Section */}
        <section className="py-20 lg:py-28 bg-white">
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
                  Book your collection
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  Visit one of our 500+ partner pathology centres across Australia for convenient blood sample collection.
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
                  Get clear results
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  Identify signals of health conditions early, and track changes over time.
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#2c3628]">Cholesterol/HDL Ratio</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Optimal</span>
                  </div>
                  <div className="h-2 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full mb-2">
                    <div className="w-1/4 h-full bg-emerald-500 rounded-full" />
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
                  Unlock your Action Plan
                </h3>
                <p className="text-[#5c7a52] text-sm mb-6">
                  With a doctor-developed program based on your results.
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

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/biomarker-intake" className="btn-primary">
                Start testing
              </Link>
              <Link href="/labs/how-it-works" className="btn-secondary">
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* Biomarkers Section */}
        <section id="biomarkers" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                80+ biomarkers across
                <br />
                <span className="text-[#5c7a52] italic">10 vital health areas</span>
              </h2>
              <p className="mt-4 text-[#5c7a52] max-w-2xl mx-auto">
                Select a category to explore the biomarkers we test. Hover over any marker to learn what it measures.
              </p>
            </div>

            <BiomarkerHoneycomb defaultCategory={categoryFromUrl} />

            <div className="mt-10 text-center">
              <Link
                href="/labs/biomarkers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#34412f] text-white rounded-full hover:bg-[#2c3628] transition-colors"
              >
                See full biomarker list
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Results Unlock Treatment Section */}
        <section className="py-20 lg:py-28 bg-white">
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
                  Your doctor reviews every marker and flags what needs attention — not just the ones that are critically abnormal.
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
                  Retest after 3–6 months on a Sanative program to see objective proof your treatment is working.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
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
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Conditions Cloud */}
              <div className="relative">
                <div className="relative flex flex-wrap gap-2 justify-center p-8">
                  {conditions.map((condition, i) => (
                    <span
                      key={condition}
                      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                        i % 5 === 0
                          ? "bg-[#c17a58]/10 text-[#c17a58] font-medium"
                          : "bg-[#e6ebe3] text-[#5c7a52]"
                      } ${i % 3 === 0 ? "opacity-100" : i % 3 === 1 ? "opacity-80" : "opacity-60"}`}
                    >
                      {condition}
                    </span>
                  ))}
                  {/* Out of range badge */}
                  <div className="absolute top-1/3 left-1/4 px-3 py-1.5 rounded-full bg-[#c17a58] text-white text-sm font-medium shadow-lg">
                    Out of range
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
                  Spot imbalances{" "}
                  <span className="text-[#5c7a52] italic">before they become problems</span>
                </h2>
                <p className="mt-6 text-lg text-[#5c7a52]">
                  Our tests can flag early warning signs across hundreds of conditions — often before you feel a thing.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/biomarker-intake" className="btn-primary">
                    Start testing
                  </Link>
                  <Link href="/labs/biomarkers" className="btn-secondary">
                    What&apos;s in your test
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Plan Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
                  Results that come with
                  <br />
                  <span className="text-[#5c7a52]">a roadmap</span>
                </h2>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#2c3628]">Customised based on your results</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#2c3628]">Habit building, nutrition plans, and, if eligible, medication</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#2c3628]">Unlimited messaging with licensed practitioners for ongoing support</span>
                  </li>
                </ul>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/biomarker-intake" className="btn-primary">
                    Start testing
                  </Link>
                  <Link href="/labs/action-plan" className="btn-secondary">
                    See Action Plan
                  </Link>
                </div>
              </div>

              {/* Visual */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"
                    alt="Woman wellness"
                    width={600}
                    height={500}
                    className="object-cover w-full h-[400px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/80 to-transparent" />

                  {/* Floating tabs */}
                  <div className="absolute top-4 left-0 right-0 flex justify-center gap-3">
                    {["Exercise", "Nutrition", "Sleep", "Habits"].map((tab) => (
                      <span
                        key={tab}
                        className="px-3 py-1.5 rounded-full bg-white/90 text-[#34412f] text-sm flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#5c7a52]" />
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4">
                      <p className="text-sm text-[#5c7a52] mb-2">Nutrition tip</p>
                      <p className="text-[#2c3628] text-sm">
                        Eat plants and fibre-rich foods, like vegetables, fruits, beans, whole grains, oats, and greens.
                      </p>
                      <p className="text-xs text-[#7e9a72] mt-2">Improves 9 biomarkers</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#34412f] text-white px-6 py-3 rounded-2xl text-center">
                  <p className="font-serif text-lg">Doctor-developed guidance</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  <p className="text-[#5c7a52] text-sm">Routine labwork</p>
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
                  Our medical advisory team designed every panel and reviews every result — so your care is always backed by expertise.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/biomarker-intake" className="btn-primary">
                    Start testing
                  </Link>
                  <Link href="/doctors" className="btn-secondary">
                    Meet the experts
                  </Link>
                </div>
              </div>

              <div className="grid gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.name}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className={`bg-gradient-to-r ${doctor.color} p-6`}>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                          {doctor.initials}
                        </div>
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
          </div>
        </section>

        {/* Everything You Need Section */}
        <section className="py-20 lg:py-28 bg-white">
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
              {/* Large stat card */}
              <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#5c7a52] to-[#4a6243] rounded-3xl p-8 text-white">
                <p className="text-5xl lg:text-6xl font-serif">50,000+</p>
                <p className="mt-2 text-white/80">Australians trust care through Sanative</p>
              </div>

              {/* Treatment plans */}
              <div className="bg-[#e6ebe3] rounded-3xl p-6 flex flex-col justify-between min-h-[200px]">
                <div>
                  <p className="text-[#5c7a52] italic font-serif text-lg">Doctor-trusted</p>
                  <p className="text-2xl font-serif text-[#2c3628]">treatment plans</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-[#5c7a52]" />
                </div>
              </div>

              {/* Rating card */}
              <div className="bg-[#f4f7f2] rounded-3xl p-6 flex flex-col justify-between min-h-[200px]">
                <p className="text-5xl font-serif text-[#2c3628]">4.9</p>
                <div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#c17a58] text-[#c17a58]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#5c7a52]">Average customer rating</p>
                </div>
              </div>

              {/* Wide stat card */}
              <div className="md:col-span-2 relative rounded-3xl overflow-hidden min-h-[200px]">
                <Image
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
                  alt="Wellness"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#34412f]/90 to-transparent" />
                <div className="relative p-8 text-white">
                  <p className="text-5xl lg:text-6xl font-serif">94%</p>
                  <p className="mt-2 text-white/80">rate Sanative equal to or better than in-person care</p>
                </div>
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
              Based on data from nearly 2,400 surveyed customers.
            </p>

            <div className="mt-10 text-center">
              <Link href="/biomarker-intake" className="btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </section>

        {/* Specialized Panels Section */}
        <section id="specialized-panels" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628]">
                Specialized <span className="text-[#5c7a52] italic">health panels</span>
              </h2>
              <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Targeted testing for specific health concerns. Each panel is designed by specialists to give you the most relevant insights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* PCOS Panel - Featured */}
              <div className="lg:col-span-1 bg-gradient-to-br from-rose-50 to-purple-50 rounded-3xl p-6 border-2 border-rose-200 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-rose-500 text-white text-xs font-semibold rounded-full">Popular</span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">PCOS & Hormone Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete hormonal and metabolic assessment for PCOS and insulin resistance.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-rose-500" />
                    <span>Fasting Insulin & HOMA-IR</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-rose-500" />
                    <span>Testosterone (Free & Total)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-rose-500" />
                    <span>DHEA-S, LH, FSH, SHBG</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-rose-500" />
                    <span>HbA1c & Glucose</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-rose-500" />
                    <span>Thyroid Function (TSH, T4)</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$199</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/metabolic-care/pcos/book?panel=pcos"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
                >
                  Book PCOS Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Heart Health Panel */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">Heart Health Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Advanced cardiovascular risk assessment including ApoB and Lp(a).
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Complete Lipid Profile</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>ApoB & Lp(a)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>hs-CRP Inflammation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>HbA1c & Blood Pressure</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$179</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/biomarker-intake?panel=heart"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#34412f] text-white rounded-xl font-semibold hover:bg-[#2c3628] transition-colors"
                >
                  Book Heart Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Metabolic Panel */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <Flame className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">Metabolic Health Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Insulin resistance, blood sugar control, and weight management markers.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Fasting Glucose & HbA1c</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Fasting Insulin & HOMA-IR</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Lipid Panel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Liver Function Tests</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$149</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/biomarker-intake?panel=metabolic"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#34412f] text-white rounded-xl font-semibold hover:bg-[#2c3628] transition-colors"
                >
                  Book Metabolic Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Thyroid Panel */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">Thyroid Function Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete thyroid assessment for energy, weight, and metabolism.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>TSH, Free T4, Free T3</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Thyroid Antibodies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Reverse T3</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$129</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/biomarker-intake?panel=thyroid"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#34412f] text-white rounded-xl font-semibold hover:bg-[#2c3628] transition-colors"
                >
                  Book Thyroid Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Hormone Balance Panel */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-pink-500" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">Hormone Balance Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sex hormones, stress markers, and overall hormonal health.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Testosterone & Estrogen</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Cortisol & DHEA-S</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Progesterone & LH/FSH</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$169</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/biomarker-intake?panel=hormones"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#34412f] text-white rounded-xl font-semibold hover:bg-[#2c3628] transition-colors"
                >
                  Book Hormone Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Liver Health Panel */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-2">Liver Health Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fatty liver screening and liver function assessment.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>ALT, AST, GGT</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Albumin & Bilirubin</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>FIB-4 Score</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-gray-900">$119</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
                <Link
                  href="/biomarker-intake?panel=liver"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#34412f] text-white rounded-xl font-semibold hover:bg-[#2c3628] transition-colors"
                >
                  Book Liver Panel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Not sure which panel is right for you?</p>
              <Link
                href="/biomarker-intake"
                className="inline-flex items-center gap-2 text-[#5c7a52] font-semibold hover:text-[#4a6243]"
              >
                Take our assessment quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Labs Pricing Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-[#e6ebe3] via-[#cdd8c6] to-[#a8bb9e]">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Pricing Card */}
            <div className="relative bg-white rounded-[32px] shadow-2xl overflow-hidden">
              <div className="p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <p className="text-sm text-[#5c7a52] mb-2">Or get the complete picture</p>
                  <h3 className="text-2xl font-serif text-[#2c3628] mb-2">Full biomarker panel</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl lg:text-6xl font-serif text-[#2c3628]">$299</span>
                  </div>
                  <p className="mt-2 text-sm text-[#7e9a72]">One-time payment</p>
                </div>

                {/* What's Included */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f7f2]">
                    <div className="w-5 h-5 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[#34412f] text-sm">80+ biomarkers across heart, metabolism, hormones, thyroid, liver, and nutrients</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f7f2]">
                    <div className="w-5 h-5 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[#34412f] text-sm">NATA-accredited Australian lab analysis</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f7f2]">
                    <div className="w-5 h-5 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[#34412f] text-sm">Doctor-reviewed results within 48 hours</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f7f2]">
                    <div className="w-5 h-5 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[#34412f] text-sm">Personalised action plan</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f7f2]">
                    <div className="w-5 h-5 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[#34412f] text-sm">Sample collected at a centre near you</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/biomarker-intake"
                  className="group flex items-center justify-center gap-3 btn-primary text-lg w-full py-4"
                >
                  Book my test
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Fine Print */}
                <p className="mt-6 text-center text-xs text-[#7e9a72]">
                  No prescription required. No commitment to any program.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-[#e6ebe3] last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <span className="font-medium text-[#2c3628] pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#5c7a52] flex-shrink-0 transition-transform ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="pb-5 text-[#5c7a52] text-sm leading-relaxed animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/labs/faqs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#34412f] text-white rounded-full hover:bg-[#2c3628] transition-colors"
              >
                See all FAQs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative min-h-[500px] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&q=80"
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
                <p className="text-xs text-white/60 mt-2">80+ lab tests</p>
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
            <p className="text-xs text-[#7e9a72] leading-relaxed mt-3">
              <sup>3</sup>Costs can exceed $2,500 for direct-to-consumer tests that screen similar biomarkers.
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
