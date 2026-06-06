import Link from "next/link";
import { ArrowRight, Pill, Sparkles, Heart, Brain } from "lucide-react";

export function CategoryGrid() {
  return (
    <section className="py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {/* Weight Management - Large Card */}
          <Link
            href="/weight-management"
            className="md:col-span-2 lg:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-8 lg:p-10 min-h-[280px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
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
            {/* Decorative pill */}
            <div className="absolute top-8 right-8 w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 lg:w-48 lg:h-48">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-[#cdd8c6]/20 rounded-full flex items-center justify-center animate-float">
                  <Pill className="w-10 h-10 lg:w-12 lg:h-12 text-white/60" />
                </div>
              </div>
            </div>
          </Link>

          {/* Hair Health */}
          <Link
            href="/hair-health"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                Grow fuller <span className="text-[#5c7a52]">hair</span>
              </h3>
              <p className="text-[#4a6243] text-sm mt-2">
                Clinically proven treatments for hair regrowth
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#34412f] mt-4">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#7e9a72]/30 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[#4a6243]" />
            </div>
          </Link>

          {/* Mental Wellness */}
          <Link
            href="/mental-wellness"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                Mental <span className="text-[#c17a58]">wellness</span>
              </h3>
              <p className="text-[#7e9a72] text-sm mt-2">
                Support for anxiety, depression & sleep
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#34412f] mt-4">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#cd8b6a]/20 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-[#c17a58]" />
            </div>
          </Link>

          {/* Skin Care */}
          <Link
            href="/skin-care"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-[#2c3628]">
                Skin <span className="text-[#5c7a52]">care</span>
              </h3>
              <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[#5c7a52] text-sm">Anti-ageing & acne treatments</p>
          </Link>

          {/* Labs */}
          <Link
            href="/labs"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#34412f] to-[#2c3628] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">
                Health <span className="text-[#a8bb9e]">labs</span>
              </h3>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[#7e9a72] text-sm">Test 80+ biomarkers at home</p>
          </Link>

          {/* Menopause */}
          <Link
            href="/menopause"
            className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8] p-6 lg:p-8 min-h-[160px] flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]"
          >
            <div>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                Treat <span className="text-[#c17a58]">menopause</span>
              </h3>
              <p className="text-[#7e9a72] text-sm mt-2">
                Hormone therapy & symptom relief tailored to you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#cd8b6a]/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#c17a58]" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
