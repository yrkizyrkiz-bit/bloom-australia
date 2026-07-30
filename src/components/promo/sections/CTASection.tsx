import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] rounded-[2.5rem] overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5c7a52]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c17a58]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative px-8 py-16 lg:px-16 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight">
                Total care.
                <br />
                <span className="text-[#cdd8c6] italic">Totally different.</span>
              </h2>

              <p className="mt-6 text-lg lg:text-xl text-[#a8bb9e] max-w-2xl mx-auto">
                Doctor-led assessment and ongoing care from Australian-registered practitioners —
                personalised to your health profile.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/membership/checkout"
                  className="btn-white inline-flex items-center justify-center gap-2 text-lg px-10 py-4"
                >
                  Start your journey
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/biomarker-intake"
                  className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center text-lg px-10 py-4"
                >
                  Take our health quiz
                </Link>
              </div>

              <p className="mt-6 text-sm text-[#7e9a72]">
                Free health assessment. Refund if not clinically suitable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
