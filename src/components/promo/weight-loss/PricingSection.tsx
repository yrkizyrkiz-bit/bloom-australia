"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e6ebe3] via-[#cdd8c6] to-[#a8bb9e]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/20 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            Start your doctor-led weight management program{" "}
            <span className="text-[#34412f] italic">from $249 for your first month</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
            Normally from $349/month. Includes treatment if prescribed, Australian doctor-led care, Sanative portal access, doctor-reviewed biomarker monitoring, Health Age tracking and ongoing clinical check-ins.
          </p>
        </div>

        {/* Two-tier pricing cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* Card 1 — Sanative Core */}
          <div className="rounded-3xl border-2 border-[#5c7a52] bg-white p-6 relative shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5c7a52] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Most popular
            </div>

            <p className="text-xs font-bold text-[#5c7a52] uppercase tracking-wide mb-2">
              Sanative Core
            </p>
            <h3 className="text-lg font-semibold text-[#2c3628] mb-3">
              For most eligible patients starting doctor-led medical weight management.
            </h3>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-[#2c3628]">$249</span>
              <span className="text-sm text-[#7e9a72] line-through">$349</span>
            </div>
            <p className="text-sm text-[#5c7a52] mb-1">first month</p>
            <p className="text-xs text-[#7e9a72] mb-6">Then from $349/month</p>

            <ul className="space-y-3 mb-6 text-sm text-[#2c3628]">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Australian doctor-led assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Treatment if prescribed</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Secure medication delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Ongoing clinical check-ins</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Sanative patient portal access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Metabolic health dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Doctor-reviewed biomarker monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Standard blood tests requested where clinically appropriate</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Health Age / biological-age style score</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Review of key liver, kidney, thyroid, glucose, cholesterol and metabolic markers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span>Progress tracking inside the Sanative portal</span>
              </li>
            </ul>

            <Link
              href="/weight-management/assessment?plan=core"
              className="block w-full py-3.5 bg-[#5c7a52] hover:bg-[#4a6343] text-white text-center text-sm font-semibold rounded-xl transition-colors"
            >
              Start assessment
            </Link>
          </div>

          {/* Card 2 — Sanative Precision */}
          <div className="rounded-3xl border border-[#e6ebe3] bg-white p-6 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c17a58] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
              Enhanced monitoring
            </div>

            <p className="text-xs font-bold text-[#c17a58] uppercase tracking-wide mb-2">
              Sanative Precision
            </p>
            <h3 className="text-lg font-semibold text-[#2c3628] mb-3">
              For patients who may benefit from closer clinical monitoring, additional review or a higher-touch doctor-led plan.
            </h3>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-[#2c3628]">$399</span>
              <span className="text-sm text-[#7e9a72] line-through">$499</span>
            </div>
            <p className="text-sm text-[#5c7a52] mb-1">first month</p>
            <p className="text-xs text-[#7e9a72] mb-6">Then from $499/month</p>

            <ul className="space-y-3 mb-6 text-sm text-[#2c3628]">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span><strong>Everything in Sanative Core</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>More frequent doctor-led follow-ups</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>Enhanced metabolic and organ-function marker review</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>Follow-up biomarker review where clinically appropriate</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>Deeper Health Age trend tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>More personalised program adjustments</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>Priority clinical support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#c17a58] mt-0.5 flex-shrink-0" />
                <span>Advanced progress insights inside the Sanative portal</span>
              </li>
            </ul>

            <Link
              href="/weight-management/assessment?plan=precision"
              className="block w-full py-3.5 bg-[#2c3628] hover:bg-[#1a1f17] text-white text-center text-sm font-semibold rounded-xl transition-colors"
            >
              Start assessment
            </Link>
          </div>
        </div>

        {/* Pricing Explanation */}
        <div className={`max-w-3xl mx-auto mb-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#e6ebe3]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#5c7a52] leading-relaxed">
                <p className="mb-2">
                  <strong>Your first month includes $100 off</strong> if your Sanative doctor confirms the program is clinically suitable. Treatment is only supplied where clinically appropriate following doctor assessment.
                </p>
                <p>
                  If your doctor determines the program is not suitable, your first-month payment will be refunded.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Test Disclaimer */}
        <div className={`max-w-3xl mx-auto mb-8 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-[#f4f7f2]/80 backdrop-blur-sm rounded-2xl p-5 border border-[#e6ebe3]">
            <p className="text-xs text-[#7e9a72] leading-relaxed">
              <strong>Blood tests:</strong> Blood tests are only requested where clinically appropriate by an Australian doctor. Many standard pathology tests are Medicare-rebated or bulk-billed for eligible Medicare card holders, depending on the test, provider and billing arrangements. Some tests may attract an out-of-pocket cost. You will be advised of any known costs before testing.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div
          className={`
            flex flex-wrap justify-center gap-6 text-sm text-[#5c7a52]
            transition-all duration-700 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5c7a52]" />
            <span>Refund if not suitable</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5c7a52]" />
            <span>No lock-in contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5c7a52]" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5c7a52]" />
            <span>Australian doctors</span>
          </div>
        </div>

        {/* Fine Print */}
        <div className={`mt-12 max-w-3xl mx-auto transition-all duration-700 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-xs text-[#7e9a72] text-center leading-relaxed">
            First-month offer applies to eligible new Sanative Weight Management patients only. Treatment is supplied only where clinically appropriate following doctor assessment. If your doctor determines the program is not clinically suitable, your first-month payment will be refunded. Ongoing monthly fees apply after the first month.
          </p>
        </div>
      </div>
    </section>
  );
}
