"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  Lock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FlaskConical,
  Heart,
  Activity,
  Droplets,
  Sparkles,
  Shield,
  BookOpen,
  TrendingUp
} from "lucide-react";

interface PreviewBiomarker {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  categoryColor: string;
  unit: string;
  optimalLow: number;
  optimalHigh: number;
  rangeLow: number;
  rangeHigh: number;
  sampleValue: number;
}

// Only show 6 preview biomarkers
const previewBiomarkers: PreviewBiomarker[] = [
  {
    id: "LDL", name: "LDL", fullName: "LDL Cholesterol",
    description: "Low-density lipoprotein cholesterol, often called 'bad' cholesterol.",
    category: "Heart", categoryColor: "bg-red-500",
    unit: "mmol/L", rangeLow: 0.5, rangeHigh: 5.0, optimalLow: 0.5, optimalHigh: 2.6, sampleValue: 2.1
  },
  {
    id: "HbA1c", name: "HbA1c", fullName: "Glycated Haemoglobin",
    description: "Shows your average blood sugar levels over the past 2-3 months.",
    category: "Metabolism", categoryColor: "bg-amber-500",
    unit: "%", rangeLow: 4.0, rangeHigh: 10.0, optimalLow: 4.0, optimalHigh: 5.6, sampleValue: 5.2
  },
  {
    id: "TSH", name: "TSH", fullName: "Thyroid Stimulating Hormone",
    description: "Controls thyroid function. Abnormal levels may indicate thyroid issues.",
    category: "Thyroid", categoryColor: "bg-purple-500",
    unit: "mIU/L", rangeLow: 0.1, rangeHigh: 8.0, optimalLow: 0.4, optimalHigh: 4.0, sampleValue: 2.1
  },
  {
    id: "VitD", name: "VitD", fullName: "Vitamin D",
    description: "Essential for bone health, immune function, and mood.",
    category: "Nutrients", categoryColor: "bg-teal-500",
    unit: "nmol/L", rangeLow: 10, rangeHigh: 200, optimalLow: 75, optimalHigh: 150, sampleValue: 82
  },
  {
    id: "ALT", name: "ALT", fullName: "Alanine Transaminase",
    description: "Liver enzyme. Elevated levels may indicate liver damage.",
    category: "Liver", categoryColor: "bg-emerald-500",
    unit: "U/L", rangeLow: 5, rangeHigh: 80, optimalLow: 7, optimalHigh: 35, sampleValue: 22
  },
  {
    id: "Fer", name: "Fer", fullName: "Ferritin",
    description: "Protein that stores iron. Best indicator of total body iron stores.",
    category: "Blood", categoryColor: "bg-rose-500",
    unit: "µg/L", rangeLow: 10, rangeHigh: 300, optimalLow: 30, optimalHigh: 150, sampleValue: 65
  },
];

// Blurred/locked biomarkers to show there's more content
const lockedBiomarkerPreviews = [
  { name: "HDL Cholesterol", category: "Heart" },
  { name: "Triglycerides", category: "Heart" },
  { name: "Fasting Glucose", category: "Metabolism" },
  { name: "Fasting Insulin", category: "Metabolism" },
  { name: "Free T4", category: "Thyroid" },
  { name: "Free T3", category: "Thyroid" },
  { name: "Vitamin B12", category: "Nutrients" },
  { name: "Folate", category: "Nutrients" },
  { name: "Cortisol", category: "Hormones" },
  { name: "Oestradiol", category: "Hormones" },
  { name: "Creatinine", category: "Kidney" },
  { name: "eGFR", category: "Kidney" },
];

const categories = [
  { name: "Heart", icon: Heart, color: "bg-red-500", count: 8 },
  { name: "Metabolism", icon: Activity, color: "bg-amber-500", count: 6 },
  { name: "Hormones", icon: Sparkles, color: "bg-pink-500", count: 8 },
  { name: "Thyroid", icon: Activity, color: "bg-purple-500", count: 4 },
  { name: "Nutrients", icon: Droplets, color: "bg-teal-500", count: 10 },
  { name: "Liver", icon: FlaskConical, color: "bg-emerald-500", count: 4 },
  { name: "Kidney", icon: Droplets, color: "bg-sky-500", count: 3 },
  { name: "Blood", icon: Heart, color: "bg-rose-500", count: 6 },
];

function getStatus(biomarker: PreviewBiomarker): "low" | "optimal" | "high" {
  if (biomarker.sampleValue < biomarker.optimalLow) return "low";
  if (biomarker.sampleValue > biomarker.optimalHigh) return "high";
  return "optimal";
}

function getStatusColor(status: "low" | "optimal" | "high") {
  switch (status) {
    case "low": return "text-amber-600 bg-amber-50 border-amber-200";
    case "optimal": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "high": return "text-red-600 bg-red-50 border-red-200";
  }
}

function getStatusIcon(status: "low" | "optimal" | "high") {
  switch (status) {
    case "low": return <AlertTriangle className="w-4 h-4" />;
    case "optimal": return <CheckCircle className="w-4 h-4" />;
    case "high": return <AlertCircle className="w-4 h-4" />;
  }
}

export default function BiomarkersPreviewPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white">
        {/* Hero */}
        <section className="py-12 lg:py-20 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 rounded-full bg-[#5c7a52]/30 border border-[#5c7a52]/50">
                <span className="text-sm font-medium text-[#a8bb9e]">Member Resource</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white">
              Learn about Biomarkers
            </h1>
            <p className="mt-4 text-lg text-[#a8bb9e] max-w-2xl">
              Explore 80+ biomarkers we test. Members get access to detailed reference ranges,
              sample results, and personalised health insights.
            </p>

            {/* Category Overview */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.slice(0, 4).map((category) => (
                <div key={category.name} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">{category.name}</span>
                  </div>
                  <p className="text-sm text-[#a8bb9e]">{category.count} biomarkers</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-[#7e9a72]">
              + {categories.slice(4).reduce((acc, c) => acc + c.count, 0)} more biomarkers across{" "}
              {categories.length - 4} additional categories
            </p>
          </div>
        </section>

        {/* Preview Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                <CheckCircle className="w-4 h-4" />
                Optimal Range
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
                Below Optimal
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm border border-red-200">
                <AlertCircle className="w-4 h-4" />
                Above Optimal
              </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-[#2c3628]">Preview: Sample Biomarkers</h2>
              <span className="text-sm text-[#7e9a72]">Showing 6 of 80+ biomarkers</span>
            </div>

            {/* Preview Biomarkers Grid */}
            <div className="grid lg:grid-cols-2 gap-4 mb-8">
              {previewBiomarkers.map((biomarker) => {
                const status = getStatus(biomarker);
                const statusColor = getStatusColor(status);
                const percentage = ((biomarker.sampleValue - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100;
                const optimalStartPercent = ((biomarker.optimalLow - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100;
                const optimalEndPercent = ((biomarker.optimalHigh - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100;

                return (
                  <div key={biomarker.id} className="bg-white rounded-2xl border border-[#e6ebe3] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Biomarker Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${biomarker.categoryColor}`}>
                        {biomarker.name}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-[#2c3628]">{biomarker.fullName}</h3>
                            <p className="text-sm text-[#7e9a72] mt-0.5">
                              {biomarker.category} • {biomarker.optimalLow} - {biomarker.optimalHigh} {biomarker.unit}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${statusColor}`}>
                            {getStatusIcon(status)}
                            {biomarker.sampleValue} {biomarker.unit}
                          </div>
                        </div>

                        {/* Range Visualization */}
                        <div className="mt-4">
                          <div className="relative h-3 bg-gradient-to-r from-amber-200 via-emerald-200 to-red-200 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 bottom-0 bg-emerald-400/50"
                              style={{
                                left: `${optimalStartPercent}%`,
                                width: `${optimalEndPercent - optimalStartPercent}%`,
                              }}
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#34412f] shadow-md"
                              style={{
                                left: `calc(${Math.min(Math.max(percentage, 2), 98)}% - 8px)`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-[#7e9a72]">
                            <span>{biomarker.rangeLow}</span>
                            <span className="text-emerald-600 font-medium">Optimal</span>
                            <span>{biomarker.rangeHigh}</span>
                          </div>
                        </div>

                        <p className="text-sm text-[#5c7a52] mt-3 line-clamp-2">{biomarker.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Locked Content Section */}
            <div className="relative">
              {/* Blurred locked biomarkers */}
              <div className="grid lg:grid-cols-2 gap-4 blur-sm pointer-events-none select-none">
                {lockedBiomarkerPreviews.slice(0, 4).map((biomarker, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-[#e6ebe3] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
                        ???
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-400">{biomarker.name}</h3>
                        <p className="text-sm text-gray-300 mt-0.5">{biomarker.category}</p>
                        <div className="mt-4 h-3 bg-gray-200 rounded-full" />
                        <div className="h-4 w-3/4 bg-gray-100 rounded mt-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white via-white/95 to-white/80">
                <div className="text-center max-w-lg px-6">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#2c3628] mb-3">
                    Unlock 74+ More Biomarkers
                  </h3>
                  <p className="text-[#5c7a52] mb-6">
                    Become a Sanative member to access detailed information on all biomarkers,
                    including reference ranges, health insights, and what your results mean.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors"
                    >
                      <BookOpen className="w-5 h-5" />
                      Sign In to Access
                    </Link>
                    <Link
                      href="/biomarker-intake"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#5c7a52] text-[#5c7a52] font-medium rounded-xl hover:bg-[#5c7a52]/5 transition-colors"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Members Get Section */}
        <section className="py-16 bg-[#f4f7f2]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-[#2c3628]">
                What Members Get Access To
              </h2>
              <p className="mt-3 text-[#5c7a52]">
                Join thousands of Australians taking control of their health
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <FlaskConical className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">80+ Biomarkers</h3>
                <p className="text-sm text-[#5c7a52]">
                  Comprehensive database covering heart, metabolism, hormones, thyroid, nutrients, and more.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">Reference Ranges</h3>
                <p className="text-sm text-[#5c7a52]">
                  Optimal vs normal ranges with visual indicators to understand exactly where you stand.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">Health Insights</h3>
                <p className="text-sm text-[#5c7a52]">
                  Learn what high, low, and optimal levels mean for each biomarker and your health.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">Category Filtering</h3>
                <p className="text-sm text-[#5c7a52]">
                  Browse by category — heart, hormones, liver, kidney, nutrients, and more.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">Personal Dashboard</h3>
                <p className="text-sm text-[#5c7a52]">
                  Track your own biomarker results over time with trend analysis and insights.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2c3628] mb-2">Expert Support</h3>
                <p className="text-sm text-[#5c7a52]">
                  Access to AHPRA-registered practitioners who can help interpret your results.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#34412f]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-serif text-white">
              Ready to understand your health?
            </h2>
            <p className="mt-4 text-[#a8bb9e]">
              Get comprehensive insights with our biomarker panels, analysed by Australian NATA-accredited laboratories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                href="/biomarker-intake"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#34412f] font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                Start Your Biomarker Test
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Already a Member? Sign In
              </Link>
            </div>
            <p className="mt-8 text-xs text-[#7e9a72] max-w-xl mx-auto leading-relaxed">
              Biomarker information is indicative only. Results should be interpreted by a qualified healthcare professional.
              This service does not constitute medical advice, diagnosis, or treatment.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
