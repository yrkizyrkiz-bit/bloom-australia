"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PROGRAMS = [
  {
    id: "weight-management",
    title: "Weight Management",
    subtitle: "Doctor-Led Program",
    description: "Doctor-led weight management programs may include treatment if prescribed following clinical assessment.",
    href: "/weight-management/assessment",
    color: "#5c7a52",
    bgColor: "bg-[#e6ebe3]",
    features: ["AHPRA-registered doctors", "Clinical assessment", "Personalised care", "Ongoing support"],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: "womens-health",
    title: "Women's Health",
    subtitle: "Hormonal & Reproductive Care",
    description: "Contraception, menopause, PCOS, and fertility support. Expert women's health specialists.",
    href: "/womens-health/assessment",
    color: "#c17a58",
    bgColor: "bg-[#fef4f0]",
    features: ["Female specialists", "HRT & contraception", "PCOS management", "Fertility support"],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "mens-health",
    title: "Men's Health",
    subtitle: "Performance & Vitality",
    description: "Doctor-led men's health programs may include treatment if prescribed following clinical assessment.",
    href: "/mens-health/assessment",
    color: "#5c7a52",
    bgColor: "bg-[#e6ebe3]",
    features: ["100% confidential", "Clinical assessment", "Treatment if prescribed", "Discreet delivery"],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "hair-loss",
    title: "Hair Loss",
    subtitle: "Regrowth Treatments",
    description: "Doctor-led hair loss programs may include treatment if prescribed following clinical assessment.",
    href: "/hair-assessment",
    color: "#5c7a52",
    bgColor: "bg-[#e6ebe3]",
    features: ["Clinical assessment", "Treatment if prescribed", "Discreet delivery", "Progress tracking"],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "fatty-liver",
    title: "Fatty Liver Health",
    subtitle: "Metabolic Liver Care",
    description: "NAFLD and NASH management. Reverse fatty liver disease with evidence-based treatment.",
    href: "/metabolic-care/fatty-liver/assessment",
    color: "#c17a32",
    bgColor: "bg-[#fef7ed]",
    features: ["Liver specialists", "Reversible condition", "Diet & medication", "Regular monitoring"],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif text-[#34412f]">
            Sanative
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[#5c7a52] hover:text-[#34412f] transition-colors"
          >
            Member Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-serif text-[#2c3628] leading-tight">
            Healthcare that works <span className="text-[#5c7a52] italic">for you</span>
          </h1>
          <p className="mt-6 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Australian-registered doctors, evidence-based treatments, and personalised care delivered to your door.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((program) => (
              <Link
                key={program.id}
                href={program.href}
                className="group bg-white rounded-2xl border border-[#e6ebe3] p-6 hover:shadow-lg hover:border-[#5c7a52]/30 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${program.color}15`, color: program.color }}
                >
                  {program.icon}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: program.color }}>
                    {program.subtitle}
                  </p>
                  <h2 className="text-xl font-serif text-[#2c3628] group-hover:text-[#5c7a52] transition-colors">
                    {program.title}
                  </h2>
                  <p className="text-sm text-[#5c7a52]">
                    {program.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-2">
                  {program.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[#5c7a52]">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: program.color }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-6 flex items-center gap-2 text-sm font-medium" style={{ color: program.color }}>
                  Start assessment
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Biomarker Testing Card */}
          <div className="mt-8">
            <Link
              href="/labs"
              className="block bg-gradient-to-r from-[#34412f] to-[#5c7a52] rounded-2xl p-8 text-white hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                    Diagnostic Testing
                  </p>
                  <h2 className="text-2xl font-serif">Biomarker Blood Tests</h2>
                  <p className="text-white/80 max-w-lg">
                    Comprehensive blood panels with 80+ biomarkers. Track your health with detailed reports and AI-powered insights.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  View tests
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-[#e6ebe3]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif text-[#2c3628] mb-8">
            Trusted by thousands of Australians
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-bold text-[#5c7a52]">10,000+</p>
              <p className="text-sm text-[#5c7a52] mt-1">Patients treated</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#5c7a52]">100%</p>
              <p className="text-sm text-[#5c7a52] mt-1">AHPRA-registered doctors</p>
            </div>
            {/* GAP-019: Removed star rating - health service advertising risk */}
            <div>
              <p className="text-3xl font-bold text-[#5c7a52]">24/7</p>
              <p className="text-sm text-[#5c7a52] mt-1">Care partner support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#e6ebe3]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <Link href="/" className="text-xl font-serif text-[#34412f]">
                Sanative
              </Link>
              <p className="text-sm text-[#5c7a52] mt-1">
                Australian telehealth made simple
              </p>
            </div>
            <div className="flex gap-6 text-sm text-[#5c7a52]">
              <Link href="/privacy" className="hover:text-[#34412f] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[#34412f] transition-colors">
                Terms
              </Link>
              <a href="mailto:support@sanative.com.au" className="hover:text-[#34412f] transition-colors">
                Contact
              </a>
            </div>
          </div>
          <p className="text-xs text-[#7e9a72] mt-8 text-center">
            Sanative Pty Ltd. All consultations are with AHPRA-registered practitioners.
          </p>
        </div>
      </footer>
    </div>
  );
}
