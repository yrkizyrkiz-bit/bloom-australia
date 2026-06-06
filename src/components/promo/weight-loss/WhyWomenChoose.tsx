"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Heart,
  FlaskConical,
  Stethoscope,
  Pill,
  Smartphone,
  HeartHandshake,
  Gift,
  Users,
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Designed for Australian women",
    description: "Programs built around female biology, hormones, and metabolism.",
  },
  {
    icon: FlaskConical,
    title: "Biomarker-first approach",
    description: "We look at hormones, thyroid, and metabolic markers — not just BMI.",
  },
  {
    // GAP-023: Removed "free" biomarker positioning
    icon: Gift,
    title: "Doctor-reviewed biomarker monitoring",
    description: "Blood tests requested where clinically appropriate to personalise your treatment.",
    highlight: true,
  },
  {
    icon: Stethoscope,
    title: "Doctor-led care",
    description: "AHPRA-registered doctors who specialise in weight management.",
  },
  {
    icon: Pill,
    title: "Premium medications included",
    description: "Evidence-based treatments included in your program fee.",
  },
  {
    icon: Smartphone,
    title: "App-based progress tracking",
    description: "Monitor your weight, biomarkers, and message your care team.",
  },
  {
    icon: HeartHandshake,
    title: "Real clinical support",
    description: "Ongoing guidance — not automated checkboxes.",
  },
];

export function WhyWomenChoose() {
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
    <section ref={sectionRef} className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#34412f]" />

      {/* Decorative Elements */}
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div
            className={`
              space-y-8 transition-all duration-700
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Heart className="w-4 h-4 text-[#a8bb9e]" />
              <span className="text-sm font-medium text-[#a8bb9e]">Why women trust Sanative</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight">
              Why women choose{" "}
              <span className="text-[#a8bb9e] italic">Sanative</span>
            </h2>

            {/* Benefits List */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className={`
                    flex items-start gap-4 p-4 rounded-2xl transition-all duration-500
                    ${benefit.highlight
                      ? "bg-gradient-to-r from-[#c17a58]/20 to-[#c17a58]/10 border border-[#c17a58]/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }
                    ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
                  `}
                  style={{ transitionDelay: `${200 + index * 75}ms` }}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${benefit.highlight ? "bg-[#c17a58]" : "bg-[#5c7a52]/30"}
                  `}>
                    <benefit.icon className={`w-5 h-5 ${benefit.highlight ? "text-white" : "text-[#a8bb9e]"}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium mb-1 ${benefit.highlight ? "text-[#c17a58]" : "text-white"}`}>
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-[#a8bb9e] leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Differentiation Block */}
            <div className="mt-6 p-5 rounded-2xl bg-white/10 border border-white/20">
              <p className="text-white font-medium mb-2">
                Unlike most providers, we don't just prescribe treatment
              </p>
              <p className="text-sm text-[#a8bb9e] leading-relaxed">
                We actively manage side effects and optimise your results over time. Many people stop weight loss treatment due to nausea or fatigue — we address these early so you can stay consistent and achieve better results.
              </p>
            </div>
          </div>

          {/* Right Column - App Screenshots */}
          <div
            className={`
              relative flex justify-center lg:justify-end transition-all duration-700 delay-300
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            {/* Phone Mockup */}
            <div className="relative w-72 lg:w-80">
              <div className="bg-white rounded-[40px] p-3 shadow-2xl">
                {/* Phone Screen */}
                <div className="bg-[#f4f7f2] rounded-[32px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-[#34412f] p-4 pb-8">
                    <div className="flex justify-between items-center text-white text-xs mb-4">
                      <span>9:41</span>
                      <span className="font-medium">sanative</span>
                      <span>100%</span>
                    </div>
                    <div className="text-white">
                      <p className="text-xs text-white/60 mb-1">Your Progress</p>
                      <p className="text-3xl font-serif">-12.5 kg</p>
                      <p className="text-xs text-white/60 mt-1">over 4 months</p>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 -mt-4 space-y-4">
                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#34412f]">Weight Trend</span>
                        <span className="text-xs text-[#5c7a52] bg-[#e6ebe3] px-2 py-0.5 rounded-full">On track</span>
                      </div>
                      {/* Mini Chart */}
                      <div className="h-16 flex items-end gap-1">
                        {[85, 83, 81, 79, 77, 75, 73].map((value, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#5c7a52] to-[#7e9a72] rounded-t"
                            style={{ height: `${(value - 70) * 5}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Biomarker Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-[#5c7a52]" />
                        <span className="text-sm font-medium text-[#34412f]">Latest Biomarkers</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#7e9a72]">Insulin</span>
                          <span className="text-[#5c7a52] font-medium">Optimal</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#7e9a72]">Thyroid (TSH)</span>
                          <span className="text-[#5c7a52] font-medium">Normal</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#7e9a72]">HbA1c</span>
                          <span className="text-[#5c7a52] font-medium">Improved</span>
                        </div>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-[#e6ebe3] rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-[#5c7a52] flex items-center justify-center">
                          <span className="text-white text-xs">Dr</span>
                        </div>
                        <span className="text-xs font-medium text-[#34412f]">Dr. Sarah Chen</span>
                      </div>
                      <p className="text-xs text-[#5c7a52]">
                        Great progress this month! Let's discuss your dose...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -left-4 lg:-left-8 top-20 bg-white rounded-2xl shadow-xl p-4 transform -rotate-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5c7a52]/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#c17a58]" />
                </div>
                <div>
                  <p className="text-xs text-[#7e9a72]">Included free</p>
                  <p className="text-sm font-medium text-[#2c3628]">2 Biomarker Reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
