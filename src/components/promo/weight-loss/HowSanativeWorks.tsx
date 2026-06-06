"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Stethoscope, Package, ArrowRight, Clock } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: ClipboardCheck,
    title: "60-second assessment",
    description: "Tell us about your goals, health, and symptoms. Quick and confidential.",
  },
  {
    number: "2",
    icon: Stethoscope,
    title: "Doctor review",
    description: "An AHPRA-registered doctor reviews your profile and prescribes treatment if appropriate.",
  },
  {
    number: "3",
    icon: Package,
    title: "Medication delivered",
    description: "Your personalised program begins with ongoing clinical support.",
  },
];

export function HowSanativeWorks() {
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
    <section ref={sectionRef} className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] to-white" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`
            text-center mb-10 transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            How Sanative{" "}
            <span className="text-[#5c7a52] italic">works</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Start your doctor-led weight loss journey in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`
                relative transition-all duration-700
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] right-[-40%] h-[2px] bg-gradient-to-r from-[#5c7a52] to-[#5c7a52]/20" />
              )}

              {/* Card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-[#e6ebe3] hover:shadow-xl hover:border-[#cdd8c6] transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="absolute -top-4 left-8">
                  <div className="w-10 h-10 rounded-full bg-[#5c7a52] flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#f4f7f2] flex items-center justify-center mb-6 mt-4">
                  <step.icon className="w-8 h-8 text-[#5c7a52]" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Continuously Guided Note */}
        <div
          className={`
            max-w-2xl mx-auto mt-12 p-4 bg-[#5c7a52]/10 rounded-xl text-center transition-all duration-700 delay-400
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <p className="text-[#5c7a52] font-medium">
            Your plan is continuously guided and adjusted — not a one-time prescription.
          </p>
        </div>

        {/* CTA */}
        <div
          className={`
            text-center mt-8 transition-all duration-700 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <Link
            href="/weight-management/assessment"
            className="group inline-flex items-center gap-3 btn-primary text-lg px-8 py-4"
          >
            Check your eligibility
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-[#7e9a72] flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Takes less than 60 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
