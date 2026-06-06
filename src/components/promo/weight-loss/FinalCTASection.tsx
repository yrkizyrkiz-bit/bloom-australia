"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle, Gift } from "lucide-react";

export function FinalCTASection() {
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
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Main CTA Area */}
      <div className="relative py-16 lg:py-24">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5c7a52] via-[#4a6243] to-[#34412f]" />

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#c17a58]/10 rounded-full blur-3xl" />

        {/* Animated Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/10 animate-pulse"
              style={{
                width: `${200 + i * 150}px`,
                height: `${200 + i * 150}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}
            />
          ))}
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`
              text-center transition-all duration-700
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
            `}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Gift className="w-4 h-4 text-[#c17a58]" />
              <span className="text-sm text-white/90">Limited time offer</span>
            </div>

            {/* Updated heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
              Ready to start? Choose your plan
            </h2>
            <p className="text-white/70 text-center text-sm mb-8">
              Both plans include medication if prescribed, doctor consultations, and full portal access.
            </p>

            {/* Two CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/weight-management/assessment"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-900 font-semibold rounded-xl text-sm hover:bg-green-50 transition-colors"
              >
                Start your assessment
              </a>
              <a
                href="/weight-management/assessment"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                Learn about our plans
              </a>
            </div>

            {/* Steps */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">1</div>
                <span className="text-white/90">Answer a few questions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="text-white/90">Doctor reviews your case</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">3</div>
                <span className="text-white/90">Treatment delivered to your door</span>
              </div>
            </div>

            {/* Value Highlight */}
            {/* GAP-023: Removed "free" biomarker positioning - now doctor-led */}
            <div className="inline-flex items-center gap-2 bg-[#c17a58]/20 backdrop-blur-sm rounded-full px-5 py-2 mb-10">
              <span className="text-[#c17a58] font-medium">Doctor-reviewed biomarker monitoring</span>
              <span className="text-white/60">where clinically appropriate</span>
            </div>

            {/* Trust Badges */}
            {/* GAP-026: Removed 'No commitment upfront' - contradicts required payment flow */}
            <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Takes 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Refund if not clinically suitable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Trust Strip */}
      {/* GAP-027: Removed 'TGA-compliant medications' - may imply regulatory endorsement */}
      <div className="bg-[#2c3628] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#7e9a72]">
            <span>AHPRA-registered doctors</span>
            <span>Treatment if clinically appropriate</span>
            <span>Australian owned</span>
            <span>Secure & confidential</span>
          </div>
        </div>
      </div>

      {/* Disclaimers and Citations Section */}
      <div className="bg-[#2c3628] py-8 px-4 sm:px-6 lg:px-8 border-t border-[#3d4f38]">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 text-[10px] leading-relaxed text-[#7e9a72]">
            {/* Citation for weight loss claim */}
            {/* GAP-017: Removed public medication names for TGA compliance */}
            <p>
              <span className="text-[#a8bb9e]">*</span> Average weight loss of approximately 12-15% of initial body weight observed in clinical trials of prescription weight management medications when combined with lifestyle modifications including reduced-calorie diet and increased physical activity. Results from peer-reviewed clinical studies published in <em>N Engl J Med</em>. Individual results may vary significantly. Weight loss is not guaranteed and depends on multiple factors including adherence to treatment, diet, exercise, and individual metabolic response. Specific treatment options are discussed privately with your Sanative doctor.
            </p>

            {/* General medical disclaimer */}
            <p className="pt-2 border-t border-[#3d4f38]">
              <span className="text-[#a8bb9e] font-medium">Medical Disclaimer:</span> This website provides general health information only and does not constitute medical advice. All treatments are prescribed by AHPRA-registered medical practitioners following clinical assessment. Treatment is only prescribed when clinically appropriate. Results vary between individuals and are not guaranteed. Weight management medications are prescription-only medicines and are subject to availability. Always read the label and follow directions for use. If symptoms persist, consult your healthcare professional. Sanative Health Pty Ltd complies with the Therapeutic Goods Advertising Code and operates under Australian telehealth regulations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
