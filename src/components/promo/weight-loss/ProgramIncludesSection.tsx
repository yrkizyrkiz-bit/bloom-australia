"use client";

import { useEffect, useRef, useState } from "react";
import {
  Stethoscope,
  Smartphone,
  TrendingUp,
  FlaskConical,
  MessageCircle,
  Heart,
  ClipboardList,
  Truck,
  Activity,
  LineChart,
} from "lucide-react";

const portalFeatures = [
  {
    icon: ClipboardList,
    title: "View your treatment plan",
    description: "Access your personalised program details and medication schedule",
  },
  {
    icon: MessageCircle,
    title: "Complete check-ins",
    description: "Regular health check-ins with your clinical care team",
  },
  {
    icon: TrendingUp,
    title: "Track weight and progress",
    description: "Log your weight and see your progress over time",
  },
  {
    icon: FlaskConical,
    title: "Access your metabolic health report",
    description: "View doctor-reviewed biomarker insights and recommendations",
  },
  {
    icon: LineChart,
    title: "View biomarker trends over time",
    description: "Track how your key health markers improve with treatment",
  },
  {
    icon: Heart,
    title: "See your Health Age score",
    description: "Your estimated biological age based on metabolic health markers",
  },
  {
    icon: MessageCircle,
    title: "Message the care team",
    description: "Direct access to clinical support when you need it",
  },
  {
    icon: Truck,
    title: "Manage deliveries and program updates",
    description: "Track medication deliveries and program communications",
  },
  {
    icon: Activity,
    title: "Receive personalised lifestyle guidance",
    description: "Evidence-based nutrition and activity recommendations",
  },
];

const programInclusions = [
  {
    icon: Stethoscope,
    title: "Doctor consultations",
    description: "Regular reviews with AHPRA-registered doctors",
  },
  {
    icon: Smartphone,
    title: "Treatment if prescribed",
    description: "Evidence-based medication where clinically appropriate",
  },
  {
    icon: FlaskConical,
    title: "Doctor-reviewed biomarker monitoring",
    description: "Key metabolic and organ-function markers reviewed by your doctor",
  },
  {
    icon: Heart,
    title: "Health Age tracking",
    description: "Biological-age style score based on your metabolic health",
  },
  {
    icon: Truck,
    title: "Secure delivery",
    description: "Discreet medication delivery to your door",
  },
  {
    icon: MessageCircle,
    title: "Ongoing care",
    description: "Clinical support and check-ins throughout your program",
  },
];

export function ProgramIncludesSection() {
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
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#5c7a52]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Program Inclusions Header */}
        <div
          className={`
            text-center mb-12 transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            What&apos;s included in{" "}
            <span className="text-[#5c7a52] italic">your program</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
            A comprehensive, doctor-led program designed to support your metabolic health journey.
          </p>
        </div>

        {/* Program Inclusions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-20">
          {programInclusions.map((item, index) => (
            <div
              key={item.title}
              className={`
                relative flex items-start gap-4 rounded-2xl p-6 transition-all duration-500
                bg-white border border-[#e6ebe3] hover:border-[#cdd8c6] hover:shadow-lg
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
              style={{ transitionDelay: `${index * 75}ms` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#5c7a52]/10">
                <item.icon className="w-6 h-6 text-[#5c7a52]" />
              </div>

              <div>
                <h3 className="font-medium mb-1 text-[#2c3628]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#5c7a52] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sanative Health Portal Section */}
        <div
          className={`
            text-center mb-12 transition-all duration-700 delay-300
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5c7a52]/10 rounded-full mb-4">
            <Smartphone className="w-4 h-4 text-[#5c7a52]" />
            <span className="text-sm font-semibold text-[#5c7a52]">Your Sanative Health Portal</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#2c3628] leading-tight mb-4">
            Track your program in one secure place
          </h3>
          <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Doctor-reviewed insights designed to support your weight and metabolic health journey.
          </p>
        </div>

        {/* Portal Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {portalFeatures.map((item, index) => (
            <div
              key={item.title}
              className={`
                flex items-start gap-3 rounded-xl p-4 transition-all duration-500
                bg-[#f4f7f2] border border-[#e6ebe3]
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
              style={{ transitionDelay: `${(index + 6) * 75}ms` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#5c7a52]/10">
                <item.icon className="w-4 h-4 text-[#5c7a52]" />
              </div>

              <div>
                <h4 className="font-medium text-sm text-[#2c3628] mb-0.5">
                  {item.title}
                </h4>
                <p className="text-xs text-[#7e9a72] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div
          className={`
            mt-10 text-center transition-all duration-700 delay-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <p className="text-sm text-[#7e9a72]">
            All features available in the Sanative patient portal, accessible on mobile and desktop.
          </p>
        </div>
      </div>
    </section>
  );
}
