"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X, AlertCircle, Pill, Sparkles, Heart, Beaker } from "lucide-react";

export function BentoHero() {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCardClick = (category: string, requiresBiomarker: boolean) => {
    if (requiresBiomarker && (category === "weight-loss" || category === "hormones" || category === "menopause")) {
      setSelectedCategory(category);
      setShowTriageModal(true);
    }
  };

  return (
    <section className="py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        {/* Main Heading */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
            Australia&apos;s finest doctors. One <span className="text-gradient italic">complete</span> care ecosystem.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {/* Weight Management - Large Card */}
          <Link
            href="/weight-management"
            className="md:col-span-2 lg:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-8 lg:p-10 min-h-[280px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02] text-left"
          >
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-[#c17a58] text-white rounded-full mb-4">
                Most Popular
              </span>
              <h3 className="text-2xl lg:text-3xl font-serif text-white mb-2">
                Start your
                <br />
                <span className="text-[#cdd8c6]">weight loss journey</span>
              </h3>
              <p className="text-[#a8bb9e] mt-3 max-w-xs">
                Doctor-led weight loss programs with personalised medical support
              </p>
            </div>
            <div className="flex items-center gap-2 text-white mt-6">
              <span className="text-sm font-medium">Find your treatment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            {/* Decorative */}
            <div className="absolute top-8 right-8 w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-20 h-20 lg:w-24 lg:h-24 bg-[#cdd8c6]/20 rounded-full flex items-center justify-center">
              <Pill className="w-10 h-10 lg:w-12 lg:h-12 text-white/40" />
            </div>
          </Link>

          {/* Biomarker Labs - Medium Card */}
          <Link
            href="/labs"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#4a6243] text-white rounded-full">
                  <Beaker className="w-3 h-3" />
                  80+ Biomarkers
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628] leading-tight">
                Biomarker
                <br /><span className="text-[#4a6243]">Labs</span>
              </h3>
              <p className="text-[#4a6243] text-sm mt-3 leading-relaxed">
                Comprehensive blood testing with AI-powered insights and personalised health reports.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">L</div>
                  <div className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">K</div>
                  <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">H</div>
                </div>
                <span className="text-[#4a6243] text-xs">Liver, Kidney, Heart & more</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-[#34412f]">
                <span className="text-sm font-medium">Explore tests</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="w-14 h-14 bg-[#7e9a72]/30 rounded-full flex items-center justify-center">
                <Beaker className="w-7 h-7 text-[#4a6243]" />
              </div>
            </div>
          </Link>

          {/* Grow Fuller Hair - Medium Card */}
          <Link
            href="/hair-health"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#c17a58] text-white rounded-full">
                  Men & Women
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628] leading-tight">
                Grow fuller
                <br /><span className="text-[#c17a58]">hair</span>
              </h3>
              <p className="text-[#5c4a3d] text-sm mt-3 leading-relaxed">
                Clinically proven treatments to regrow thicker, healthier hair.
              </p>
            </div>

            <div className="relative flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-[#34412f]">
                <span className="text-sm font-medium">Start treatment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="w-14 h-14 bg-[#c17a58]/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#c17a58]" />
              </div>
            </div>
          </Link>

          {/* Women's Health - Small Card (light sage like Skin Care was) */}
          <Link
            href="/womens-health"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-[#2c3628]">
                Women&apos;s <span className="text-[#5c7a52]">Health</span>
              </h3>
              <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[#5c7a52] text-sm">Contraception, fertility & hormonal support</p>
          </Link>

          {/* Men's Health - Small Card (dark like Labs was) */}
          <Link
            href="/mens-health"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#34412f] to-[#2c3628] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">
                Men&apos;s <span className="text-[#a8bb9e]">Health</span>
              </h3>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[#7e9a72] text-sm">Testosterone, hair loss & vitality</p>
          </Link>

          {/* Metabolic Care - Wide Card */}
          <Link
            href="/metabolic-care/fatty-liver"
            className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8] p-6 lg:p-8 min-h-[160px] flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#5c7a52] text-white rounded-full">
                  The Scientific Approach
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                Metabolic Care <span className="text-[#c17a58]">Rebuilt from the Liver Up</span>
              </h3>
              <p className="text-[#7e9a72] text-sm mt-2 uppercase tracking-wide font-medium">
                The Hidden Epidemic
              </p>
              <p className="text-[#5c7a52] text-sm">
                Metabolic dysfunction
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#cd8b6a]/20 flex items-center justify-center">
                {/* Liver Icon */}
                <svg className="w-6 h-6 text-[#c17a58]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 12c0-4.5 3-7.5 7.5-7.5 3 0 5.5 1.5 7 4 1 1.5 1.5 3 1.5 4.5 0 3-2 5.5-5 6.5-1.5.5-3 .5-4.5 0-2-.5-3.5-2-4.5-4-.5-1-1-2.5-1-3.5z"/>
                  <path d="M12 4.5c-1.5 2-2.5 4.5-2.5 7.5s1 5.5 2.5 7.5"/>
                  <path d="M8 8c1.5 1 3.5 2 6 2"/>
                </svg>
              </div>
              <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-6 lg:gap-10 text-sm text-[#5c7a52]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
            <span>AHPRA Doctors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
            <span>NATA-Accredited Labs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
            <span>Discreet Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
            <span>100% Australian</span>
          </div>
        </div>
      </div>

      {/* Triage Modal */}
      {showTriageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-fade-in">
            <button
              type="button"
              onClick={() => setShowTriageModal(false)}
              className="absolute top-4 right-4 p-2 text-[#5c7a52] hover:bg-[#e6ebe3] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#c17a58]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#c17a58]" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                  Clinical Safety First
                </h3>
                <p className="text-[#5c7a52] text-sm leading-relaxed">
                  To ensure clinical safety, we require a <strong>Biomarker Audit</strong> before prescribing any treatments for{" "}
                  {selectedCategory === "weight-loss" ? "weight loss" : selectedCategory === "menopause" ? "menopause" : "hormone-related concerns"}.
                </p>
              </div>
            </div>

            <div className="bg-[#f4f7f2] rounded-2xl p-5 mb-6">
              <h4 className="font-medium text-[#2c3628] mb-3">Start your diagnostic journey below</h4>
              <ul className="space-y-2 text-sm text-[#5c7a52]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Identify underlying conditions that may affect treatment
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Ensure medications are safe for your specific health profile
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Create a baseline to track your progress over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Personalise your treatment plan based on your unique biology
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href={`/biomarker-intake?concern=${selectedCategory}`}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Start your diagnostic journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowTriageModal(false)}
                className="w-full py-3 text-[#5c7a52] hover:text-[#34412f] transition-colors text-sm"
              >
                I&apos;ll come back later
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
