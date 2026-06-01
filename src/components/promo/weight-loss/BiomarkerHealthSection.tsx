"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Heart,
  FlaskConical,
  Droplet,
  Zap,
  ThermometerSun,
  Flame,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const biomarkerCategories = [
  {
    icon: Droplet,
    title: "Blood sugar and metabolic health",
    description: "HbA1c, fasting glucose, insulin markers",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Heart,
    title: "Cholesterol and cardiovascular risk markers",
    description: "Total cholesterol, LDL, HDL, triglycerides",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    icon: FlaskConical,
    title: "Liver function markers",
    description: "ALT, AST, GGT, bilirubin",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: Zap,
    title: "Kidney function markers",
    description: "Creatinine, eGFR, urea",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: ThermometerSun,
    title: "Thyroid function markers",
    description: "TSH, free T4, free T3",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    icon: Flame,
    title: "Inflammation and nutritional markers",
    description: "Where clinically appropriate",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: Activity,
    title: "Health Age / biological-age style score",
    description: "Based on your metabolic health profile",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: TrendingUp,
    title: "Progress trends over time",
    description: "Track improvement across all markers",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

export function BiomarkerHealthSection() {
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
    <section ref={sectionRef} className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f4f7f2]" />

      {/* Decorative Elements */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#5c7a52]/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`
            text-center mb-12 transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            More than weight loss.{" "}
            <span className="text-[#5c7a52] italic">A clearer picture of your health.</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
            Your Sanative program may include doctor-reviewed biomarker monitoring to help assess key areas linked with weight and metabolic health.
          </p>
        </div>

        {/* Biomarker Categories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-10">
          {biomarkerCategories.map((item, index) => (
            <div
              key={item.title}
              className={`
                flex flex-col items-center text-center rounded-2xl p-5 transition-all duration-500
                bg-white border border-[#e6ebe3] hover:border-[#cdd8c6] hover:shadow-lg
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
              style={{ transitionDelay: `${index * 75}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>

              <h3 className="font-medium text-[#2c3628] mb-1 text-sm">
                {item.title}
              </h3>
              <p className="text-xs text-[#7e9a72] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Safety Note */}
        <div
          className={`
            max-w-3xl mx-auto transition-all duration-700 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="bg-[#5c7a52]/5 border border-[#5c7a52]/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#5c7a52] leading-relaxed">
                  <strong>Reviewed in context by your doctor.</strong> Your results are reviewed by your Sanative doctor and used to support safe, personalised care. Blood tests are only requested where clinically appropriate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
