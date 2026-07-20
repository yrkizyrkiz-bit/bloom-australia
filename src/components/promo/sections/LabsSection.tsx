import Link from "next/link";
import { ArrowRight, Beaker, Activity, Heart, Brain, Droplets, Zap } from "lucide-react";
import { LabsConciergeSearch } from "@/components/promo/sections/LabsConciergeSearch";

export function LabsSection() {
  const biomarkerCategories = [
    { name: "Heart", icon: Heart, color: "text-red-500" },
    { name: "Metabolism", icon: Zap, color: "text-amber-500" },
    { name: "Hormones", icon: Activity, color: "text-pink-500" },
    { name: "Thyroid", icon: Brain, color: "text-purple-500" },
    { name: "Liver", icon: Droplets, color: "text-emerald-500" },
    { name: "Nutrients", icon: Beaker, color: "text-sky-500" },
  ];

  const biomarkers = [
    "Cholesterol", "LDL", "HDL", "Triglycerides", "HbA1c", "Fasting Glucose",
    "TSH", "T3", "T4", "Vitamin D", "Vitamin B12", "Iron", "Ferritin",
    "Oestrogen", "Progesterone", "Testosterone", "Cortisol", "DHEA",
    "ALT", "AST", "GGT", "Kidney Function", "Inflammation Markers"
  ];

  return (
    <section className="pt-20 pb-0 lg:pt-28 lg:pb-0 bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-12">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34412f]/20 text-[#34412f] text-sm font-medium mb-6">
          <Beaker className="w-4 h-4" />
          labs by sanative
        </span>

        <h2 className="max-w-5xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#2c3628] leading-tight">
          Monitor early indicators of{" "}
          <span className="text-[#5c7a52] italic">500+ diseases</span>
        </h2>

        <div className="mt-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <div className="max-w-lg">
              <div className="mb-3 text-left">
                <p className="font-serif text-xl sm:text-2xl text-[#2c3628] leading-[1.15] tracking-tight">
                  Catch issues early and{" "}
                  <span className="italic text-[#5c7a52]">stay ahead</span>
                </p>
              </div>
              <LabsConciergeSearch showIntro={false} />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {biomarkerCategories.map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/70 hover:bg-white transition-colors border border-[#e6ebe3]"
                >
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                  <span className="text-sm text-[#2c3628]">{category.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/labs"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Start my labs
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/labs/biomarkers"
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                View all biomarkers
              </Link>
            </div>
          </div>

          {/* Right - Biomarkers Cloud */}
          <div className="relative min-h-[280px] sm:min-h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#cdd8c6] via-transparent to-[#cdd8c6] z-10 pointer-events-none" />

            <div className="relative flex flex-wrap gap-2 justify-center opacity-70">
              {biomarkers.map((marker) => (
                <span
                  key={marker}
                  className="px-4 py-2 rounded-full bg-[#5c7a52]/10 text-[#5c7a52] text-sm whitespace-nowrap border border-[#5c7a52]/20"
                >
                  {marker}
                </span>
              ))}
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-white rounded-3xl p-6 shadow-2xl text-center border border-[#e6ebe3]">
                <p className="text-sm text-[#7e9a72] mb-1">Test up to</p>
                <p className="text-5xl font-serif text-[#34412f]">80+</p>
                <p className="text-[#5c7a52] font-medium">biomarkers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Blood sample collection", desc: "At a centre near you" },
            { title: "NATA accredited", desc: "Australian lab analysis" },
            { title: "Doctor reviewed", desc: "Expert interpretation" },
            { title: "Action plan", desc: "Personalised health insights" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-white/70 border border-[#cdd8c6]"
            >
              <h3 className="text-[#2c3628] font-medium mb-1">{feature.title}</h3>
              <p className="text-[#5c7a52] text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
