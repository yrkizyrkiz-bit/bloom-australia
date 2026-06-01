import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export function HairSection() {
  const hairGoals = [
    "Stop thinning or shedding",
    "Regrow thicker, fuller hair",
    "Strengthen & nourish hair",
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
              Thicker, fuller hair
              <br />
              <span className="text-[#5c7a52] italic">is here</span>
            </h2>
            <p className="mt-6 text-lg text-[#5c7a52] max-w-lg">
              Clinically proven treatments to regrow your hair in 3-6 months. Prescribed by doctors, delivered to your door.
            </p>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-medium text-[#34412f] uppercase tracking-wider">
                What are your hair goals?
              </p>
              {hairGoals.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  className="w-full text-left px-5 py-4 rounded-xl bg-[#e6ebe3] hover:bg-[#cdd8c6] transition-colors text-[#34412f] font-medium"
                >
                  {goal}
                </button>
              ))}
            </div>

            <Link
              href="/hair-health"
              className="mt-8 btn-primary inline-flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right - Testimonial Card */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] rounded-3xl p-8 lg:p-10">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#c17a58] text-[#c17a58]" />
                ))}
              </div>

              <blockquote className="text-lg lg:text-xl text-[#2c3628] leading-relaxed">
                &ldquo;Sanative has{" "}
                <strong>changed my life because it has given me my hair back.</strong>{" "}
                I no longer worry about shedding. I{" "}
                <strong>no longer have the stress and fear of losing all my hair.</strong>&rdquo;
              </blockquote>

              <div className="mt-6 pt-6 border-t border-[#7e9a72]/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#5c7a52] flex items-center justify-center text-white font-medium">
                    SL
                  </div>
                  <div>
                    <p className="font-medium text-[#2c3628]">Sarah L., 42</p>
                    <p className="text-sm text-[#5c7a52]">Melbourne, VIC</p>
                    <p className="text-sm text-[#5c7a52]">9 months on Minoxidil</p>
                  </div>
                </div>
              </div>

              {/* Before/After Preview */}
              <div className="mt-6 flex gap-3">
                <div className="flex-1 h-20 rounded-xl bg-[#7e9a72]/30 flex items-center justify-center text-[#34412f] text-sm">
                  Before
                </div>
                <div className="flex-1 h-20 rounded-xl bg-[#5c7a52] flex items-center justify-center text-white text-sm">
                  After
                </div>
              </div>
            </div>

            <Link
              href="/hair-health/results"
              className="mt-4 inline-flex items-center gap-2 text-[#5c7a52] hover:text-[#34412f] transition-colors"
            >
              See more results
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-[#7e9a72]">
          Results have not been independently verified. Individual results will vary.
        </p>
      </div>
    </section>
  );
}
