"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Stethoscope,
  Pill,
  HeartPulse,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  Shield,
  Users
} from "lucide-react";

interface Step {
  icon: React.ElementType;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
}

const steps: Step[] = [
  {
    icon: ClipboardCheck,
    number: "01",
    title: "Clinical assessment",
    subtitle: "Understanding your unique situation",
    description: "Complete a comprehensive health questionnaire covering your medical history, current medications, lifestyle factors, and weight management goals.",
    details: [
      "Medical history & contraindications",
      "Current symptoms & health concerns",
      "Previous weight loss attempts",
      "Lifestyle & dietary patterns",
    ],
  },
  {
    icon: Stethoscope,
    number: "02",
    title: "Doctor review & diagnosis",
    subtitle: "Evidence-based clinical evaluation",
    description: "An Australian-registered doctor reviews your assessment, evaluates potential contributing factors, and determines if prescription treatment is clinically appropriate.",
    details: [
      "AHPRA-registered practitioners",
      "Contraindication screening",
      "Treatment suitability assessment",
      "Personalised clinical recommendations",
    ],
  },
  {
    icon: Pill,
    number: "03",
    title: "Treatment initiation",
    subtitle: "Starting with the right approach",
    description: "If appropriate, your doctor prescribes evidence-based medication with clear dosing instructions. Treatment is titrated gradually to optimise efficacy and minimise side effects.",
    details: [
      "Doctor-prescribed medications",
      "Gradual dose titration protocol",
      "Side effect management guidance",
      "Discreet delivery to your door",
    ],
  },
  {
    icon: HeartPulse,
    number: "04",
    title: "Ongoing clinical support",
    subtitle: "Continuous care, not just a prescription",
    description: "Your journey doesn't end with a prescription. Regular check-ins, dose adjustments, and clinical monitoring ensure your treatment remains safe and effective over time.",
    details: [
      "Scheduled progress reviews",
      "Dose optimisation as needed",
      "Side effect monitoring",
      "Long-term maintenance planning",
    ],
  },
];

const supportFeatures = [
  {
    icon: MessageCircle,
    title: "Care team messaging",
    description: "Direct access to your clinical support team for questions between appointments",
  },
  {
    icon: RefreshCw,
    title: "Treatment adjustments",
    description: "Regular reviews to optimise dosing based on your response and progress",
  },
  {
    icon: Shield,
    title: "Side effect management",
    description: "We actively manage nausea, fatigue, and other side effects early — so you can stay consistent",
  },
  {
    icon: Users,
    title: "Dietitian support",
    description: "Optional nutrition guidance to complement your medical treatment",
  },
];

export function WeightLossHowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#34412f] to-[#2c3628]" />

      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Decorative Blurs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5c7a52]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#c17a58]/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-[#a8bb9e]">Doctor-led process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight mb-6">
            A clinically rigorous approach
          </h2>
          <p className="text-lg text-[#a8bb9e] max-w-3xl mx-auto">
            From initial assessment through ongoing care, every step is guided by evidence-based medicine and supervised by qualified healthcare professionals.
          </p>
        </div>

        {/* Steps - Vertical Timeline */}
        <div className="max-w-4xl mx-auto mb-20">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`
                relative flex gap-6 lg:gap-10 pb-12 last:pb-0
                transition-all duration-700 ease-out
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Timeline Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[27px] lg:left-[31px] top-16 bottom-0 w-[2px] bg-gradient-to-b from-[#5c7a52] to-[#5c7a52]/20" />
              )}

              {/* Step Number Circle */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-[#5c7a52] flex items-center justify-center shadow-lg shadow-[#5c7a52]/30">
                  <step.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              </div>

              {/* Content Card */}
              <div
                className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => setExpandedStep(expandedStep === index ? null : index)}
              >
                {/* Step Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#5c7a52]/30 text-xs font-medium text-[#a8bb9e]">
                    Step {step.number}
                  </span>
                  <span className="text-xs text-[#7e9a72]">{step.subtitle}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl lg:text-2xl font-serif text-white mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[#a8bb9e] leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Expandable Details */}
                <div className={`
                  overflow-hidden transition-all duration-300
                  ${expandedStep === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}
                `}>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-[#7e9a72] uppercase tracking-wider mb-3">What this includes:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((detail) => (
                        <div key={detail} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5c7a52]" />
                          <span className="text-sm text-[#a8bb9e]">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expand Indicator */}
                <button
                  type="button"
                  className="mt-3 text-xs text-[#5c7a52] hover:text-[#7e9a72] transition-colors"
                >
                  {expandedStep === index ? "Show less" : "Show details"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ongoing Support Section */}
        <div className={`
          bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 mb-16
          transition-all duration-700 delay-500
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}>
          <div className="text-center mb-10">
            <h3 className="text-2xl lg:text-3xl font-serif text-white mb-4">
              Ongoing clinical & program support
            </h3>
            <p className="text-[#a8bb9e] max-w-2xl mx-auto">
              Weight management is a journey, not a one-time prescription. Our clinical team provides continuous support to help you achieve and maintain your results.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="text-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-[#a8bb9e]" />
                </div>
                <h4 className="text-white font-medium mb-2">{feature.title}</h4>
                <p className="text-sm text-[#7e9a72] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Standards Note */}
        <div className={`
          text-center mb-8 transition-all duration-700 delay-600
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <p className="text-sm text-[#7e9a72] max-w-2xl mx-auto">
            All clinical decisions are made by AHPRA-registered medical practitioners in accordance with Australian prescribing guidelines.
          </p>
        </div>

        {/* CTA */}
        <div
          className={`
            text-center transition-all duration-700 delay-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <Link
            href="/weight-management/assessment"
            className="group inline-flex items-center gap-3 btn-white text-lg px-8 py-4"
          >
            Start your clinical assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-[#7e9a72]">
            Takes 5 minutes · Reviewed by a doctor within 24-48 hours
          </p>
        </div>
      </div>
    </section>
  );
}
