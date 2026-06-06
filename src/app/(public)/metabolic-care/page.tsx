"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Activity,
  Heart,
  Scale,
  Beaker,
  TrendingUp,
  Zap,
  ShieldCheck,
  Clock,
  Users,
  Stethoscope,
  ChevronRight,
  Brain,
  Droplets,
} from "lucide-react";

// Liver Icon Component
function LiverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12c0-4.5 3-7.5 7.5-7.5 3 0 5.5 1.5 7 4 1 1.5 1.5 3 1.5 4.5 0 3-2 5.5-5 6.5-1.5.5-3 .5-4.5 0-2-.5-3.5-2-4.5-4-.5-1-1-2.5-1-3.5z"/>
      <path d="M12 4.5c-1.5 2-2.5 4.5-2.5 7.5s1 5.5 2.5 7.5"/>
      <path d="M8 8c1.5 1 3.5 2 6 2"/>
    </svg>
  );
}

export default function MetabolicCarePage() {
  const conditions = [
    {
      id: "fatty-liver",
      title: "Fatty Liver Disease",
      subtitle: "MASLD / NAFLD",
      description: "The hidden epidemic affecting 1 in 3 Australian adults. Early detection and treatment can reverse liver fat accumulation before permanent damage occurs.",
      icon: LiverIcon,
      stats: [
        { label: "Prevalence", value: "1 in 3 adults" },
        { label: "Reversible", value: "Yes, in early stages" },
      ],
      symptoms: ["Fatigue", "Abdominal discomfort", "Elevated liver enzymes", "Difficulty losing weight"],
      href: "/metabolic-care/fatty-liver",
      color: "from-[#c17a58] to-[#a9634a]",
      bgColor: "bg-[#c17a58]/10",
      available: true,
    },
    {
      id: "insulin-resistance",
      title: "Insulin Resistance",
      subtitle: "Pre-diabetes & metabolic dysfunction",
      description: "The root cause of most metabolic conditions. When cells stop responding to insulin properly, blood sugar rises and fat accumulation accelerates.",
      icon: Activity,
      stats: [
        { label: "Prevalence", value: "1 in 4 adults" },
        { label: "Reversible", value: "Yes, with intervention" },
      ],
      symptoms: ["Sugar cravings", "Energy crashes", "Belly fat", "Dark skin patches"],
      href: "/metabolic-care/insulin-resistance",
      color: "from-[#5c7a52] to-[#4a6243]",
      bgColor: "bg-[#5c7a52]/10",
      available: false,
    },
    {
      id: "metabolic-syndrome",
      title: "Metabolic Syndrome",
      subtitle: "The cluster effect",
      description: "A combination of conditions — high blood pressure, high blood sugar, excess body fat, and abnormal cholesterol — that dramatically increase disease risk.",
      icon: Heart,
      stats: [
        { label: "Prevalence", value: "1 in 5 adults" },
        { label: "Reversible", value: "Yes, with comprehensive care" },
      ],
      symptoms: ["Central obesity", "High blood pressure", "High triglycerides", "Low HDL cholesterol"],
      href: "/metabolic-care/metabolic-syndrome",
      color: "from-[#34412f] to-[#2c3628]",
      bgColor: "bg-[#34412f]/10",
      available: false,
    },
    {
      id: "pcos-metabolic",
      title: "PCOS & Metabolic Health",
      subtitle: "Hormonal-metabolic connection",
      description: "Polycystic ovary syndrome has deep metabolic roots. Addressing insulin resistance and metabolic dysfunction is key to managing PCOS symptoms.",
      icon: Droplets,
      stats: [
        { label: "Prevalence", value: "1 in 10 women" },
        { label: "Metabolic link", value: "70%+ have insulin resistance" },
      ],
      symptoms: ["Irregular periods", "Weight gain", "Acne", "Hair changes"],
      href: "/metabolic-care/pcos",
      color: "from-[#e879a9] to-[#9333ea]",
      bgColor: "bg-rose-100/50",
      available: true,
    },
  ];

  const metabolicMarkers = [
    { name: "Fasting Glucose", category: "Blood Sugar" },
    { name: "HbA1c", category: "Blood Sugar" },
    { name: "Fasting Insulin", category: "Insulin" },
    { name: "HOMA-IR", category: "Insulin Resistance" },
    { name: "Triglycerides", category: "Lipids" },
    { name: "HDL Cholesterol", category: "Lipids" },
    { name: "LDL Cholesterol", category: "Lipids" },
    { name: "ALT / AST / GGT", category: "Liver" },
    { name: "CRP", category: "Inflammation" },
    { name: "Uric Acid", category: "Metabolism" },
    { name: "Ferritin", category: "Iron/Inflammation" },
    { name: "Vitamin D", category: "Nutrients" },
  ];

  const approach = [
    {
      icon: Beaker,
      title: "Biomarker-First Diagnosis",
      description: "We don't guess. Comprehensive metabolic panels reveal the true state of your metabolism — insulin resistance, liver health, inflammation, and more.",
    },
    {
      icon: Brain,
      title: "Root Cause Focus",
      description: "Most metabolic conditions share common roots: insulin resistance, inflammation, and liver dysfunction. We address these underlying drivers, not just symptoms.",
    },
    {
      icon: TrendingUp,
      title: "Measurable Progress",
      description: "Regular re-testing shows exactly how your body is responding. Objective data guides treatment adjustments for optimal outcomes.",
    },
    {
      icon: Zap,
      title: "Multi-Modal Treatment",
      description: "Evidence-based interventions combining nutrition, lifestyle, supplements, and when appropriate, medications proven to reverse metabolic dysfunction.",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#34412f] via-[#3d4f38] to-[#2c3628]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5c7a52]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#c17a58]/10 rounded-full blur-3xl" />

          {/* Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <LiverIcon className="w-4 h-4 text-[#a8bb9e]" />
                <span className="text-sm font-medium text-[#a8bb9e]">The Scientific Approach</span>
              </div>

              {/* Pre-headline */}
              <p className="text-sm uppercase tracking-widest text-[#c17a58] font-medium mb-4">
                The Hidden Epidemic
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6">
                Metabolic Care{" "}
                <span className="text-[#a8bb9e] italic">Rebuilt from the Liver Up</span>
              </h1>

              <p className="text-lg lg:text-xl text-[#a8bb9e] leading-relaxed mb-8 max-w-3xl mx-auto">
                Metabolic dysfunction is the defining health crisis of our time. We identify it early, treat it systematically, and measure your progress objectively.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/metabolic-care/fatty-liver"
                  className="btn-white inline-flex items-center justify-center gap-2"
                >
                  Start with fatty liver assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/labs"
                  className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center"
                >
                  View metabolic panel
                </Link>
              </div>

              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <p className="text-4xl font-serif text-white">1 in 3</p>
                  <p className="text-sm text-[#a8bb9e]">Adults have fatty liver</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-serif text-white">80%</p>
                  <p className="text-sm text-[#a8bb9e]">Cases go undetected</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-serif text-white">87%</p>
                  <p className="text-sm text-[#a8bb9e]">See improvement with treatment</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions Grid */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Conditions we treat
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Metabolic conditions are{" "}
                <span className="text-[#5c7a52] italic">interconnected</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
                Most metabolic issues share common roots — insulin resistance, chronic inflammation, and liver dysfunction. We address the underlying causes, not just symptoms.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`relative rounded-3xl overflow-hidden border ${
                    condition.available
                      ? "border-[#e6ebe3] hover:border-[#5c7a52] hover:shadow-xl"
                      : "border-[#e6ebe3] opacity-80"
                  } bg-white transition-all group`}
                >
                  {/* Header */}
                  <div className={`p-6 bg-gradient-to-r ${condition.color}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <condition.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif text-white">{condition.title}</h3>
                          <p className="text-sm text-white/70">{condition.subtitle}</p>
                        </div>
                      </div>
                      {!condition.available && (
                        <span className="px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-[#5c7a52] leading-relaxed mb-4">
                      {condition.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-6 mb-4">
                      {condition.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-sm text-[#7e9a72]">{stat.label}</p>
                          <p className="font-medium text-[#2c3628]">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Symptoms */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {condition.symptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className={`text-xs px-3 py-1 rounded-full ${condition.bgColor} text-[#2c3628]`}
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    {condition.available ? (
                      <Link
                        href={condition.href}
                        className="inline-flex items-center gap-2 text-[#5c7a52] font-medium hover:text-[#34412f] transition-colors group"
                      >
                        Learn more & assess your risk
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <p className="text-sm text-[#7e9a72]">
                        Assessment coming soon. Join waitlist for early access.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                  Our approach
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  Medicine with{" "}
                  <span className="text-[#5c7a52] italic">depth and precision</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  We don&apos;t just treat symptoms. Our biomarker-driven approach identifies the root causes of metabolic dysfunction and creates a clear path to reversal.
                </p>

                <div className="space-y-6">
                  {approach.map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-[#5c7a52]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#2c3628] mb-1">{item.title}</h3>
                        <p className="text-sm text-[#5c7a52] leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biomarkers Panel */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#e6ebe3]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#5c7a52] flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-[#2c3628]">Metabolic Panel</h3>
                    <p className="text-sm text-[#7e9a72]">What we measure</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {metabolicMarkers.map((marker) => (
                    <div
                      key={marker.name}
                      className="p-3 rounded-xl bg-[#f4f7f2] border border-[#e6ebe3]"
                    >
                      <p className="text-sm font-medium text-[#2c3628]">{marker.name}</p>
                      <p className="text-xs text-[#7e9a72]">{marker.category}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/labs"
                  className="mt-6 w-full btn-primary inline-flex items-center justify-center gap-2"
                >
                  View full biomarker list
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Metabolic Health Matters */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                The bigger picture
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Why metabolic health{" "}
                <span className="text-[#5c7a52] italic">matters</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-3xl bg-white border border-[#e6ebe3]">
                <div className="w-16 h-16 rounded-2xl bg-[#c17a58]/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-[#c17a58]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Heart Disease Risk</h3>
                <p className="text-[#5c7a52]">
                  Metabolic dysfunction is the leading driver of cardiovascular disease. Addressing it early protects your heart long-term.
                </p>
              </div>

              <div className="text-center p-8 rounded-3xl bg-white border border-[#e6ebe3]">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Type 2 Diabetes</h3>
                <p className="text-[#5c7a52]">
                  Insulin resistance is the precursor to type 2 diabetes. Catching and reversing it early can prevent progression.
                </p>
              </div>

              <div className="text-center p-8 rounded-3xl bg-white border border-[#e6ebe3]">
                <div className="w-16 h-16 rounded-2xl bg-[#34412f]/10 flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-[#34412f]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Weight Management</h3>
                <p className="text-[#5c7a52]">
                  Metabolic dysfunction makes weight loss nearly impossible. Fixing metabolism first makes sustainable weight loss achievable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">AHPRA Registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors fully registered</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">NATA Accredited</h3>
                <p className="text-sm text-[#5c7a52]">Australian lab testing</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">Ongoing Support</h3>
                <p className="text-sm text-[#5c7a52]">Regular monitoring & adjustments</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">Evidence-Based</h3>
                <p className="text-sm text-[#5c7a52]">Research-backed protocols</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-[#5c7a52] via-[#4a6243] to-[#34412f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Ready to understand your{" "}
              <span className="text-[#cdd8c6] italic">metabolic health?</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Start with our fatty liver assessment — the most common and often first sign of metabolic dysfunction.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/metabolic-care/fatty-liver"
                className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Assess fatty liver risk
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/labs"
                className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center px-8 py-4"
              >
                View metabolic panel
              </Link>
            </div>

            {/* GAP-026: Removed 'No commitment' - payment required */}
            <p className="mt-6 text-sm text-[#7e9a72]">
              Free risk assessment · Refund if not suitable · Results explained by a doctor
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
