"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { PublicComplianceBlock } from "@/components/legal/PublicComplianceBlock";
import {
  ArrowRight,
  Zap,
  Shield,
  Heart,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Beaker,
  Stethoscope,
  Sparkles,
  Lock,
  MessageSquare,
  Phone,
  Users,
  HeartHandshake,
} from "lucide-react";

// FAQ Item Component
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#e6ebe3]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-[#2c3628] pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[#5c7a52] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// Treatment Section Component
function TreatmentSection({
  id,
  icon: Icon,
  title,
  subtitle,
  description,
  symptoms,
  focusAreas,
  image,
  link,
  linkText,
  isReversed = false,
  bgColor = "bg-[#fdfbf7]",
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  symptoms: string[];
  focusAreas: string[];
  image: string;
  link: string;
  linkText: string;
  isReversed?: boolean;
  bgColor?: string;
}) {
  return (
    <section id={id} className={`py-20 lg:py-28 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
          {/* Content */}
          <div className={isReversed ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#5c7a52]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">{title}</h2>
                <p className="text-[#7e9a72]">{subtitle}</p>
              </div>
            </div>

            <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
              {description}
            </p>

            {/* Symptoms */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[#2c3628] uppercase tracking-wider mb-4">
                Common symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="px-4 py-2 bg-white border border-[#e6ebe3] text-[#5c7a52] text-sm rounded-full"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            {/* Assessment focus */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[#2c3628] uppercase tracking-wider mb-4">
                Assessment focus
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {focusAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-3 text-[#5c7a52]"
                  >
                    <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={link}
              className="btn-primary inline-flex items-center gap-2"
            >
              {linkText}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Image */}
          <div className={isReversed ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MensHealthPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  // Energy & vitality — sexual health has its own section below
  const treatmentSections = [
    {
      id: "energy",
      icon: Zap,
      title: "Energy & Vitality",
      subtitle: "Doctor-led metabolic wellbeing",
      description:
        "Feeling constantly tired is worth investigating properly. Through health assessment and biomarker testing where clinically appropriate, your doctor reviews factors that may affect energy, recovery, and overall vitality — then discusses a personalised care plan if suitable.",
      symptoms: ["Chronic fatigue", "Poor sleep quality", "Afternoon crashes", "Difficulty concentrating", "Slow recovery", "Brain fog"],
      focusAreas: ["Sleep and stress patterns", "Nutrient and thyroid markers", "Metabolic health", "Lifestyle and recovery habits"],
      image: "https://images.pexels.com/photos/4720309/pexels-photo-4720309.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/mens-health/assessment?concern=energy-vitality",
      linkText: "Start assessment",
      bgColor: "bg-[#fdfbf7]",
    },
  ];

  const sexualHealthSteps = [
    {
      number: "01",
      icon: MessageSquare,
      title: "Clinical assessment",
      description:
        "Complete a confidential health questionnaire covering symptoms, medical history, medications, and lifestyle factors relevant to sexual wellbeing.",
    },
    {
      number: "02",
      icon: Phone,
      title: "Doctor review",
      description:
        "An AHPRA-registered doctor reviews your assessment and evaluates whether a personalised care plan is clinically appropriate for you.",
    },
    {
      number: "03",
      icon: Stethoscope,
      title: "Personalised care planning",
      description:
        "If appropriate, your doctor discusses suitable care options privately in consultation. Care options are never advertised on this website.",
    },
  ];

  const sexualHealthBenefits = [
    {
      icon: Stethoscope,
      title: "AHPRA-registered doctors",
      description:
        "Every consultation is with an Australian-registered doctor who reviews your full health profile before any clinical decisions.",
    },
    {
      icon: Lock,
      title: "Confidential care",
      description:
        "Your health information is protected by Australian privacy laws. Confidential service from assessment through to ongoing support.",
    },
    {
      icon: Beaker,
      title: "Biomarker-guided where appropriate",
      description:
        "Blood tests may be recommended where they help your doctor understand contributing factors — not as a one-size-fits-all requirement.",
    },
    {
      icon: MessageSquare,
      title: "Care team support",
      description:
        "Message your care team with questions between appointments. Ongoing clinical support is part of your program.",
    },
  ];

  const biomarkers = [
    { name: "Hormone Panel", category: "Hormones", importance: "Overall hormone health" },
    { name: "Thyroid Function", category: "Thyroid", importance: "Metabolic rate" },
    { name: "Liver Function", category: "Liver", importance: "Detoxification health" },
    { name: "Kidney Function", category: "Kidney", importance: "Filtration health" },
    { name: "Lipid Panel", category: "Heart", importance: "Cardiovascular risk" },
    { name: "Blood Sugar", category: "Metabolism", importance: "Metabolic health" },
    { name: "Vitamin D", category: "Nutrients", importance: "Bone & immune health" },
    { name: "Iron Studies", category: "Blood", importance: "Energy & oxygen transport" },
    { name: "B12 & Folate", category: "Nutrients", importance: "Nerve & cell health" },
    { name: "Inflammation Markers", category: "Immune", importance: "Systemic inflammation" },
    { name: "PSA", category: "Prostate", importance: "Prostate health" },
    { name: "Full Blood Count", category: "Blood", importance: "Overall blood health" },
  ];

  const processSteps = [
    {
      number: "01",
      title: "Online Health Assessment",
      description: "Complete a comprehensive questionnaire about your symptoms, goals, medical history, and lifestyle. Takes about 10 minutes.",
      details: ["Symptom evaluation", "Medical history review", "Lifestyle assessment", "Goal setting"],
    },
    {
      number: "02",
      title: "Biomarker Testing",
      description: "We recommend targeted blood tests to understand what's happening inside. Blood sample collection at a pathology centre near you.",
      details: ["Comprehensive panels", "Metabolic markers", "Nutrient levels", "Inflammation markers"],
    },
    {
      number: "03",
      title: "Doctor Consultation",
      description: "An Australian-registered doctor reviews your results, explains findings, and determines whether a personalised care plan is clinically appropriate.",
      details: ["AHPRA-registered doctors", "Doctor consultation", "Results interpretation", "Care plan suitability assessment"],
    },
    {
      number: "04",
      title: "Ongoing clinical support",
      description: "Your journey continues with regular check-ins and care plan reviews. Suitable care options are discussed privately with your doctor if clinically appropriate.",
      details: ["Care team messaging", "Progress tracking", "Clinical review", "Biomarker monitoring where indicated"],
    },
  ];

  const faqs = [
    {
      question: "What areas of men's health do you support?",
      answer: "We offer doctor-led programs for sexual health, energy and vitality, hair loss, and weight management. Each pathway starts with clinical assessment. Care options are discussed privately with your doctor if clinically appropriate — they are not advertised on this website.",
    },
    {
      question: "How does the consultation process work?",
      answer: "You start with an online health assessment. Based on your responses, we may recommend blood tests where clinically appropriate. An Australian-registered doctor then reviews everything and discusses whether a personalised care plan is suitable for you via telehealth consultation.",
    },
    {
      question: "Is care provided by real Australian doctors?",
      answer: "Yes. Every Sanative doctor is AHPRA-registered and practising in Australia. Your doctor reviews your health profile, discusses your symptoms, and determines what is clinically appropriate for you individually.",
    },
    {
      question: "What about care options after assessment?",
      answer: "Care options are discussed privately with your doctor if clinically appropriate. Your program fee covers clinical assessment, monitoring, and portal access — not medicine bundles.",
    },
    {
      question: "Is everything confidential?",
      answer: "Absolutely. All consultations, test results, and care plans are confidential. Your health information is protected under Australian privacy laws and stored securely.",
    },
    {
      question: "How much does the program cost?",
      answer: "Costs vary depending on your program. Initial consultations start from $49, and ongoing programs vary depending on clinical support level. Blood testing may be recommended where clinically appropriate. We provide transparent pricing with no hidden fees.",
    },
    {
      question: "What is your refund policy?",
      answer: "If your Sanative doctor determines after assessment that a program is not clinically appropriate for you, your first-month payment will be refunded in accordance with our Refund Policy.",
    },
  ];

  // Patient testimonials removed for AHPRA/TGA compliance — see PublicComplianceBlock below

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Full-bleed hero — native 3:2 image ratio so desktop doesn't crop/zoom */}
        <section className="relative w-full overflow-hidden bg-[#1a2218]">
          <Image
            src="/images/mens-health-hero.png"
            alt="Man jogging at sunrise with Sanative biomarker health insights overlay"
            width={1536}
            height={1024}
            priority
            className="block w-full h-auto"
            sizes="100vw"
            quality={95}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          <div className="absolute inset-0 z-10 flex items-start justify-end px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 lg:pt-[8%] pb-8">
            <div className="max-w-[min(100%,22rem)] sm:max-w-md lg:max-w-lg text-right animate-fade-in">
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-white leading-[1.15] drop-shadow-lg">
                Better performance starts with better biomarkers
              </h1>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base text-white/85 leading-relaxed ml-auto max-w-sm">
                Doctor-led men&apos;s health assessment guided by the markers that matter.
              </p>
            </div>
          </div>
        </section>

        {/* Program cards */}
        <section id="programs" className="pt-10 pb-8 lg:pt-14 lg:pb-12 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {/* Weight Management - Large Card with Image - NOW LINKS TO PAGE */}
              <Link
                href="/weight-management"
                className="md:col-span-2 lg:col-span-2 group relative rounded-3xl overflow-hidden min-h-[280px] lg:min-h-[320px] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl text-left block"
              >
                <Image
                  src="https://images.pexels.com/photos/4720236/pexels-photo-4720236.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Men's health - Weight management"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/90 via-[#34412f]/40 to-transparent transition-opacity duration-300 group-hover:from-[#34412f]/95" />
                <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between">
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-[#c17a58] text-white rounded-full mb-4">
                      Most Popular
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-serif text-white mb-2">
                      Weight<br />
                      <span className="text-[#cdd8c6]">Management</span>
                    </h3>
                    <p className="text-[#a8bb9e] mt-3 max-w-xs">
                      Medical weight loss programs with personalised support
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-white mt-6">
                    <span className="text-sm font-medium">Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Biomarkers - Medium Card */}
              <Link
                href="/labs#from-sample-to-action-plan"
                className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#3d4f38] hover:to-[#34412f] text-left"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#5c7a52] text-white rounded-full mb-2">
                    Recommended
                  </span>
                  <h3 className="text-xl lg:text-2xl font-serif text-white">
                    Biomarker <span className="text-[#cdd8c6]">Testing</span>
                  </h3>
                  <p className="text-[#a8bb9e] text-sm mt-2">
                    Comprehensive blood tests for optimal health
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <Beaker className="w-8 h-8 text-white/60" />
                  </div>
                </div>
              </Link>

              {/* Hair Loss - Medium Card - NOW LINKS TO PAGE */}
              <Link
                href="/hair-health?gender=men"
                className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-6 lg:p-8 min-h-[200px] lg:min-h-[320px] flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#e5d7bf] hover:to-[#dccfb5] text-left"
              >
                <div>
                  <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628]">
                    Hair <span className="text-[#c17a58]">Loss</span>
                  </h3>
                  <p className="text-[#7e9a72] text-sm mt-2">
                    Doctor-led hair health assessment and care planning
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
                  <div className="w-16 h-16 bg-[#cd8b6a]/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#c17a58]" />
                  </div>
                </div>
              </Link>

              {/* Sexual health / ED — wide card */}
              <Link
                href="/mens-health/erectile-dysfunction"
                className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#34412f] to-[#2c3628] p-6 lg:p-8 min-h-[160px] flex items-center justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#2c3628] hover:to-[#1f261c] text-left"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#c17a58] text-white rounded-full mb-2">
                    Confidential care
                  </span>
                  <h3 className="text-xl lg:text-2xl font-serif text-white">
                    Erectile <span className="text-[#a8bb9e]">dysfunction</span>
                  </h3>
                  <p className="text-[#7e9a72] text-sm mt-2">
                    Symptoms, causes, and doctor-led assessment — care options discussed privately if clinically appropriate
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#a8bb9e]" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Energy & Vitality - Small Card */}
              <button
                type="button"
                onClick={() => scrollToSection("energy")}
                className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#cdd8c6] hover:to-[#a8bb9e] text-left"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-[#2c3628]">
                    Energy & <span className="text-[#5c7a52]">Vitality</span>
                  </h3>
                  <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[#5c7a52] text-sm">Doctor-led vitality support</p>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-6 lg:gap-10 text-sm text-[#5c7a52]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>AHPRA Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>100% Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>Ongoing care team support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sexual health */}
        <section id="sexual-health" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#5c7a52]">AHPRA-registered doctors</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-6">
                  Doctor-led{" "}
                  <span className="text-[#5c7a52] italic">sexual health</span>{" "}
                  assessment
                </h2>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  Sanative offers confidential, doctor-led assessment for men's sexual health concerns. Your doctor reviews your health profile and discusses what is clinically appropriate for you — individually, and in private consultation.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Clinical assessment before any care plan</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Care options discussed privately if clinically appropriate</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Ongoing care team support in your portal</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/mens-health/assessment?concern=sexual-health"
                    className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                  >
                    Start assessment
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/mens-health/erectile-dysfunction"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#cdd8c6] text-[#2c3628] hover:bg-[#e6ebe3]/60 transition-colors font-medium"
                  >
                    Learn about ED
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="https://images.pexels.com/photos/5384445/pexels-photo-5384445.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Men's sexual health — doctor-led assessment"
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
                </div>

                <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl p-4 shadow-lg border border-[#e6ebe3]">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-xs text-[#7e9a72]">Assessment</p>
                      <p className="text-sm font-medium text-[#2c3628]">Confidential</p>
                    </div>
                    <div className="w-px h-8 bg-[#e6ebe3]" />
                    <div>
                      <p className="text-xs text-[#7e9a72]">Support</p>
                      <p className="text-sm font-medium text-[#2c3628]">Care team</p>
                    </div>
                    <div className="w-px h-8 bg-[#e6ebe3]" />
                    <div>
                      <p className="text-xs text-[#7e9a72]">Doctors</p>
                      <p className="text-sm font-medium text-[#2c3628]">AHPRA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
              <div className="bg-gradient-to-br from-[#f4f7f2] to-[#e6ebe3] rounded-3xl p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                    A whole-person approach
                  </h3>
                </div>
                <p className="text-[#5c7a52] leading-relaxed mb-6">
                  Sexual wellbeing can be influenced by stress, sleep, hormones, cardiovascular health, medications, and mental health — often in combination. Our doctors review the full picture, not just a single symptom.
                </p>
                <ul className="space-y-3">
                  {[
                    "Stress, anxiety, and relationship factors",
                    "Sleep quality and recovery",
                    "Hormonal and metabolic markers",
                    "Cardiovascular health",
                    "Current medications and medical history",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Individual care
                </span>
                <h3 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  Your doctor reviews{" "}
                  <span className="text-[#5c7a52] italic">what fits you</span>
                </h3>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  People enter Sanative with different health profiles, goals, and medical histories. There is no one-size-fits-all pathway — your doctor determines what is clinically appropriate after reviewing your assessment.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Individual results vary and are not guaranteed. Suitable care options, if any, are discussed privately in consultation — not advertised on this website.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sexual health trust bar */}
        <section className="py-6 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16 text-white">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Confidential assessment</span>
              </div>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Australian doctors</span>
              </div>
              <div className="flex items-center gap-3">
                <Beaker className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Biomarker-guided where appropriate</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Care team support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sexual health — how it works */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                Simple process
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                How it{" "}
                <span className="text-[#5c7a52] italic">works</span>
              </h3>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                A streamlined clinical pathway — thorough medical evaluation at every step.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {sexualHealthSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < sexualHealthSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-[#cdd8c6]" />
                  )}

                  <div className="bg-white rounded-3xl p-8 border border-[#e6ebe3] relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#34412f] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{step.number}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-[#5c7a52]" />
                      </div>
                    </div>
                    <h4 className="text-xl font-serif text-[#2c3628] mb-3">{step.title}</h4>
                    <p className="text-[#5c7a52] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/mens-health/assessment?concern=sexual-health"
                className="btn-primary inline-flex items-center gap-2"
              >
                Start your assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Sexual health — why Sanative */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Why choose us
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Doctor-led care,{" "}
                <span className="text-[#5c7a52] italic">built around you</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sexualHealthBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h4 className="text-lg font-serif text-[#2c3628] mb-2">{benefit.title}</h4>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Energy & vitality */}
        {treatmentSections.map((section, index) => (
          <TreatmentSection
            key={section.id}
            {...section}
            isReversed={index % 2 === 1}
          />
        ))}

        {/* Biomarker Testing Section */}
        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-[#a8bb9e] rounded-full mb-4">
                  Biomarker-driven care
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
                  Test. Don&apos;t guess.{" "}
                  <span className="text-[#a8bb9e] italic">Know your numbers.</span>
                </h2>
                <p className="text-lg text-[#a8bb9e] mb-8">
                  Every man&apos;s biology is different. Our comprehensive blood panels measure the hormones, nutrients, and markers that matter — giving your doctor the data needed to personalise your care plan where clinically appropriate.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-3xl font-serif text-white">40+</p>
                    <p className="text-sm text-[#a8bb9e]">Biomarkers tested</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-3xl font-serif text-white">48hrs</p>
                    <p className="text-sm text-[#a8bb9e]">Results turnaround</p>
                  </div>
                </div>

                <Link
                  href="/labs"
                  className="btn-white inline-flex items-center gap-2"
                >
                  Explore biomarker testing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Key biomarkers we test</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {biomarkers.map((marker) => (
                      <div
                        key={marker.name}
                        className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-sm font-medium text-white">{marker.name}</p>
                        <p className="text-xs text-[#7e9a72]">{marker.importance}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/labs/biomarkers"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[#a8bb9e] hover:text-white transition-colors"
                  >
                    View all biomarkers
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Simple process
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                From assessment to{" "}
                <span className="text-[#5c7a52] italic">care planning</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Our streamlined process gets you from assessment to doctor review quickly, while ensuring thorough clinical evaluation at every step.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step) => (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-[#34412f] flex items-center justify-center mb-4">
                    <span className="text-sm font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed mb-4">
                    {step.description}
                  </p>
                  <div className="space-y-2">
                    {step.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2 text-sm text-[#7e9a72]">
                        <CheckCircle className="w-4 h-4 text-[#5c7a52]" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/mens-health/assessment"
                className="btn-primary inline-flex items-center gap-2"
              >
                Start your assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <PublicComplianceBlock title="Doctor-led men's health care" />

        {/* Trust Section */}
        <section className="py-20 lg:py-28 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">AHPRA Registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors are fully registered with AHPRA</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">100% Confidential</h3>
                <p className="text-sm text-[#5c7a52]">Your health information is private and secure</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Ongoing support</h3>
                <p className="text-sm text-[#5c7a52]">Continuous care throughout your journey</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Personalised care</h3>
                <p className="text-sm text-[#5c7a52]">Care plans tailored to your unique biology</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Common questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-[#34412f] via-[#3d4f38] to-[#2c3628]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Take control of your health.{" "}
              <span className="text-[#a8bb9e] italic">Start today.</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Complete a health assessment and book a doctor consultation. Your Sanative doctor reviews your profile and discusses what is clinically appropriate for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mens-health/assessment"
                className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Start assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/labs"
                className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center px-8 py-4"
              >
                View blood tests
              </Link>
            </div>
            {/* GAP-026: Removed 'No commitment' - payment required */}
            <p className="mt-6 text-sm text-[#7e9a72]">
              Refund if not suitable · Australian doctors · Confidential care
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
