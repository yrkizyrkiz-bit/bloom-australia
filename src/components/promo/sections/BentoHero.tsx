import Link from "next/link";
import { ArrowRight, Pill, Sparkles, Beaker } from "lucide-react";

export function BentoHero() {
  return (
    <section className="bg-[#fdfbf7]">
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
              <span className="text-sm font-medium">Start assessment</span>
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
                  85+ Biomarkers
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628] leading-tight">
                Check your health
                <br /><span className="text-[#4a6243]">every year</span>
              </h3>
              <p className="text-[#4a6243] text-sm mt-3 leading-relaxed">
                Starting with 85+ lab tests monitoring 500+ conditions. Just $365 per year, {" "}
                <span className="italic font-medium text-[#2c3628]">$1 per day</span>.
              </p>
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
                Doctor-led
                <br /><span className="text-[#c17a58]">hair health</span>
              </h3>
              <p className="text-[#5c4a3d] text-sm mt-3 leading-relaxed">
                Assessment-first care with options discussed privately if clinically appropriate.
              </p>
            </div>

            <div className="relative flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-[#34412f]">
                <span className="text-sm font-medium">Learn more</span>
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
            <p className="text-[#5c7a52] text-sm">Menopause care, symptoms & hormone support</p>
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

          {/* Organ Care - Wide Card */}
          <Link
            href="/organ-care"
            className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8] p-6 lg:p-8 min-h-[160px] flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#5c7a52] text-white rounded-full">
                  Heart · Liver · Kidney
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                Organ Care <span className="text-[#c17a58]">Three organs, one picture</span>
              </h3>
              <p className="text-[#5c7a52] text-sm mt-2">
                Doctor-reviewed markers for heart, liver and kidney
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
            <span>Pharmacy dispensing when prescribed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
            <span>100% Australian</span>
          </div>
        </div>
      </div>
    </section>
  );
}
