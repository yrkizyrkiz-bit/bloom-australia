"use client";

import Link from "next/link";
import { ArrowRight, Flame, Pill, Shield, Baby, Heart, Stethoscope } from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  iconBg: string;
  href: string;
}

const services: ServiceCard[] = [
  {
    id: "menopause",
    title: "Menopause Care",
    subtitle: "Comprehensive symptom management",
    description: "Navigate perimenopause and menopause with expert support. Our doctors help manage hot flushes, night sweats, mood changes, and more with personalised treatment plans.",
    features: [
      "Hot flushes & night sweats",
      "Mood & sleep support",
      "Bone health monitoring",
      "Weight management"
    ],
    icon: Flame,
    gradient: "from-[#f8e1e1] via-[#fce4d8] to-[#fef4f0]",
    borderColor: "border-[#e8b4b4]/40",
    iconBg: "bg-[#c17a58]",
    href: "/womens-health/assessment?category=menopause"
  },
  {
    id: "hrt",
    title: "Hormone Replacement Therapy",
    subtitle: "Body-identical hormones",
    description: "Modern HRT options tailored to your needs. Our doctors prescribe TGA-approved bioidentical hormones to help restore hormonal balance safely.",
    features: [
      "Oestrogen therapy",
      "Progesterone options",
      "Testosterone support",
      "Regular monitoring"
    ],
    icon: Pill,
    gradient: "from-[#e8d5e8] via-[#f0e4f0] to-[#f8f4f8]",
    borderColor: "border-[#c9b3c9]/40",
    iconBg: "bg-[#8b6b8b]",
    href: "/womens-health/assessment?category=hrt"
  },
  {
    id: "contraception",
    title: "Contraception",
    subtitle: "Find the right option for you",
    description: "Explore birth control options with a doctor who listens. From the pill to long-acting methods, we help you find what works for your lifestyle.",
    features: [
      "Oral contraceptives",
      "Hormonal IUD referrals",
      "Implant consultations",
      "Emergency contraception"
    ],
    icon: Shield,
    gradient: "from-[#d8e8e8] via-[#e4f0f0] to-[#f0f8f8]",
    borderColor: "border-[#a8c8c8]/40",
    iconBg: "bg-[#5a8b8b]",
    href: "/womens-health/assessment?category=contraception"
  },
  {
    id: "fertility",
    title: "Fertility & Hormonal Support",
    subtitle: "Optimise your hormonal health",
    description: "Whether you're planning for pregnancy or managing hormonal imbalances, our doctors provide supportive care and testing to help you on your journey.",
    features: [
      "Fertility hormone testing",
      "PCOS management",
      "Preconception health",
      "Cycle irregularities"
    ],
    icon: Baby,
    gradient: "from-[#fce4d8] via-[#fef4f0] to-[#fdf8f6]",
    borderColor: "border-[#e8c4b4]/40",
    iconBg: "bg-[#c17a58]",
    href: "/womens-health/assessment?category=fertility"
  }
];

export function WomensHealthServices() {
  return (
    <section id="services" className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f8e1e1]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#e8d5e8]/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f8e1e1]/40 border border-[#e8b4b4]/20 mb-6">
            <Heart className="w-4 h-4 text-[#c17a58]" />
            <span className="text-sm font-medium text-[#8b5a5a]">Our Services</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
            Specialised care for{" "}
            <span className="text-[#c17a58] italic">every stage</span>
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            From reproductive health to menopause, our experienced female health specialists provide compassionate, evidence-based care.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className={`
                group relative rounded-3xl overflow-hidden
                bg-gradient-to-br ${service.gradient}
                border ${service.borderColor}
                p-8 lg:p-10
                transition-all duration-300
                hover:shadow-xl hover:-translate-y-1
              `}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${service.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-serif text-[#2c3628] mb-2">
                {service.title}
              </h3>
              <p className="text-sm font-medium text-[#c17a58] mb-4">
                {service.subtitle}
              </p>
              <p className="text-[#5c7a52] leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[#5c7a52]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c17a58]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={service.href}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white rounded-full text-[#2c3628] font-medium transition-all border border-white/50 shadow-sm group-hover:shadow-md"
              >
                Start Assessment
                <ArrowRight className="w-4 h-4 text-[#c17a58] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg border border-[#f8e1e1]">
            <Stethoscope className="w-6 h-6 text-[#c17a58]" />
            <span className="text-[#2c3628]">Not sure where to start?</span>
            <Link
              href="/womens-health/assessment"
              className="font-medium text-[#c17a58] hover:text-[#a86548] transition-colors flex items-center gap-1"
            >
              Take our general assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
