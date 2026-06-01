"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
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
  Clock,
  Sparkles,
  Star,
  Target,
  Lock,
  Truck,
  MessageSquare,
  Package,
  Phone,
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
  treatments,
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
  treatments: string[];
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

            {/* Treatments */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[#2c3628] uppercase tracking-wider mb-4">
                Treatment options
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {treatments.map((treatment) => (
                  <div
                    key={treatment}
                    className="flex items-center gap-3 text-[#5c7a52]"
                  >
                    <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
                    <span>{treatment}</span>
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

  // Treatment sections - PE and Energy only (ED has its own full section)
  const treatmentSections = [
    {
      id: "premature-ejaculation",
      icon: Clock,
      title: "Premature Ejaculation",
      subtitle: "Evidence-based solutions",
      description: "Premature ejaculation (PE) is characterised by ejaculation that occurs sooner than desired, often with minimal stimulation. Our evidence-based treatments can help you gain better control and enjoy more satisfying intimacy — all prescribed discreetly by Australian-registered doctors.",
      symptoms: ["Ejaculating within 1-2 minutes", "Inability to delay ejaculation", "Feelings of frustration", "Avoiding intimacy", "Relationship tension"],
      treatments: ["Prescription oral medications", "Topical treatments", "Behavioural techniques", "Combination approaches"],
      image: "https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/mens-health/assessment?concern=premature-ejaculation",
      linkText: "Start PE assessment",
      bgColor: "bg-[#f4f7f2]",
    },
    {
      id: "energy",
      icon: Zap,
      title: "Energy & Vitality",
      subtitle: "Optimise your wellbeing",
      description: "Feeling constantly tired isn't normal. Through comprehensive biomarker testing, we identify nutritional deficiencies, hormonal imbalances, and metabolic issues that may be affecting your energy levels — then create a plan to address them.",
      symptoms: ["Chronic fatigue", "Poor sleep quality", "Afternoon crashes", "Difficulty concentrating", "Slow recovery", "Brain fog"],
      treatments: ["Vitamin optimisation", "Sleep support", "Metabolic health protocols", "Stress management"],
      image: "https://images.pexels.com/photos/4720309/pexels-photo-4720309.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/mens-health/assessment?concern=energy",
      linkText: "Start assessment",
      bgColor: "bg-[#fdfbf7]",
    },
  ];

  // ED Process Steps
  const edProcessSteps = [
    {
      number: "01",
      icon: MessageSquare,
      title: "Online Assessment",
      description: "Complete a quick health questionnaire from your phone or computer. It takes about 5 minutes.",
    },
    {
      number: "02",
      icon: Phone,
      title: "Doctor Consultation",
      description: "An AHPRA-registered doctor reviews your assessment and may call to discuss treatment options if appropriate.",
    },
    {
      number: "03",
      icon: Package,
      title: "Discreet Delivery",
      description: "If prescribed, your treatment is delivered in unmarked packaging to your door. Free shipping Australia-wide.",
    },
  ];

  // ED Treatment Info
  const edTreatmentInfo = [
    {
      name: "Short-acting treatment",
      brandName: "As-needed option",
      description: "Works within 30-60 minutes. Effects typically last 4-6 hours. Take as needed before sexual activity.",
    },
    {
      name: "Long-acting treatment",
      brandName: "Flexible option",
      description: "Works within 30-60 minutes. Effects can last up to 36 hours, providing more flexibility and spontaneity.",
    },
  ];

  // ED Benefits
  const edBenefits = [
    {
      icon: Stethoscope,
      title: "Doctor-Prescribed",
      description: "All treatments are prescribed by AHPRA-registered Australian doctors after a thorough health assessment.",
    },
    {
      icon: Lock,
      title: "100% Confidential",
      description: "Your health information is protected by Australian privacy laws. Discreet service from start to finish.",
    },
    {
      icon: Truck,
      title: "Free Delivery",
      description: "Medications shipped in plain, unmarked packaging. No one will know what's inside.",
    },
    {
      icon: MessageSquare,
      title: "Ongoing Support",
      description: "Message your care team anytime with questions. Unlimited support included with your treatment.",
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
      description: "An Australian-registered doctor reviews your results, explains findings, and creates a personalised treatment plan.",
      details: ["AHPRA-registered doctors", "Doctor consultation", "Results interpretation", "Treatment planning"],
    },
    {
      number: "04",
      title: "Treatment & Monitoring",
      description: "Begin your treatment with ongoing clinical support. Regular check-ins ensure optimal results and adjustments as needed.",
      details: ["Discreet home delivery", "Progress tracking", "Dose optimisation", "Unlimited messaging"],
    },
  ];

  const faqs = [
    {
      question: "What conditions do you treat?",
      answer: "We offer treatments for erectile dysfunction, premature ejaculation, hair loss, weight management, and energy/vitality concerns. All treatments are prescribed by AHPRA-registered doctors after a thorough health assessment.",
    },
    {
      question: "How does the consultation process work?",
      answer: "You start with an online health assessment, which takes about 10 minutes. Based on your responses, we may recommend blood tests to understand your health better. An Australian-registered doctor then reviews everything and discusses treatment options with you via telehealth consultation.",
    },
    {
      question: "Are the treatments safe?",
      answer: "All treatments we prescribe are TGA-approved and prescribed by qualified Australian doctors. We conduct thorough health assessments and regular monitoring to ensure safety. Potential risks and side effects are discussed during your consultation.",
    },
    {
      question: "Are the treatments prescription-only?",
      answer: "Yes, most treatments we offer require a prescription from an Australian-registered doctor. This ensures safety and appropriateness for your individual health profile. Our doctors review your health assessment and test results before prescribing any medication.",
    },
    {
      question: "Is everything confidential?",
      answer: "Absolutely. All consultations, test results, and treatments are completely confidential. Medications are delivered in discreet, unmarked packaging. Your health information is protected under Australian privacy laws and stored securely.",
    },
    {
      question: "How much does treatment cost?",
      answer: "Costs vary depending on your treatment plan. Initial consultations start from $49, and ongoing treatment programs vary depending on medications and support level. Blood testing is included for members or available separately. We provide transparent pricing with no hidden fees.",
    },
  ];

  const testimonials = [
    {
      quote: "The whole process was much easier than I expected. The doctors actually take time to explain everything and I felt comfortable discussing my concerns.",
      name: "James M.",
      age: 42,
      location: "Sydney",
      treatment: "Men's Health",
      initials: "JM",
    },
    {
      quote: "I've been using the hair treatment for 6 months now and I'm happy with the progress. The team has been supportive throughout.",
      name: "Michael R.",
      age: 35,
      location: "Melbourne",
      treatment: "Hair Program",
      initials: "MR",
    },
    {
      quote: "Discreet, professional, and effective. I appreciate how confidential the whole service is.",
      name: "David L.",
      age: 48,
      location: "Brisbane",
      treatment: "Sexual Health",
      initials: "DL",
    },
  ];

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
        {/* Hero Section - Bento Grid Layout */}
        <section className="pt-4 pb-8 lg:pt-6 lg:pb-12 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
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
                  priority
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
                href="/labs"
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
                    Clinically proven treatments for regrowth
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
                  <div className="w-16 h-16 bg-[#cd8b6a]/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#c17a58]" />
                  </div>
                </div>
              </Link>

              {/* Premature Ejaculation - Small Card */}
              <button
                type="button"
                onClick={() => scrollToSection("premature-ejaculation")}
                className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] p-6 lg:p-8 min-h-[160px] flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#a8bb9e] hover:to-[#7e9a72] text-left"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-[#2c3628]">
                    Premature <span className="text-[#5c7a52]">Ejaculation</span>
                  </h3>
                  <ArrowRight className="w-5 h-5 text-[#34412f] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[#4a6243] text-sm">Evidence-based solutions</p>
              </button>

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
                <p className="text-[#5c7a52] text-sm">Optimise your wellbeing</p>
              </button>

              {/* Erectile Dysfunction - Wide Card */}
              <button
                type="button"
                onClick={() => scrollToSection("erectile-dysfunction")}
                className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#34412f] to-[#2c3628] p-6 lg:p-8 min-h-[160px] flex items-center justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:from-[#2c3628] hover:to-[#1f261c] text-left"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#c17a58] text-white rounded-full mb-2">
                    Discreet Treatment
                  </span>
                  <h3 className="text-xl lg:text-2xl font-serif text-white">
                    Erectile <span className="text-[#a8bb9e]">Dysfunction</span>
                  </h3>
                  <p className="text-[#7e9a72] text-sm mt-2">
                    Clinically-proven treatments prescribed by Australian doctors
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#a8bb9e]" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                </div>
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
                <span>Discreet Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>Australian Pharmacy</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FULL ERECTILE DYSFUNCTION SECTION ========== */}
        <section id="erectile-dysfunction" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ED Hero */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#5c7a52]">AHPRA-registered doctors</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-6">
                  Erectile dysfunction{" "}
                  <span className="text-[#5c7a52] italic">treatment</span>
                </h2>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  Clinically-proven ED treatments prescribed by Australian doctors and delivered discreetly to your door. Start your online assessment today.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Prescribed by AHPRA-registered doctors</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Free, discreet delivery Australia-wide</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2c3628]">
                    <CheckCircle className="w-5 h-5 text-[#5c7a52]" />
                    <span>Ongoing medical support included</span>
                  </div>
                </div>

                <Link
                  href="/mens-health/assessment?concern=erectile-dysfunction"
                  className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                >
                  Start online assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="https://images.pexels.com/photos/5384445/pexels-photo-5384445.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Happy couple - Erectile dysfunction treatment"
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
                </div>

                {/* Trust badges */}
                <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl p-4 shadow-lg border border-[#e6ebe3]">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-xs text-[#7e9a72]">Delivery</p>
                      <p className="text-sm font-medium text-[#2c3628]">Free & Discreet</p>
                    </div>
                    <div className="w-px h-8 bg-[#e6ebe3]" />
                    <div>
                      <p className="text-xs text-[#7e9a72]">Support</p>
                      <p className="text-sm font-medium text-[#2c3628]">Unlimited</p>
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
          </div>
        </section>

        {/* ED Trust Bar */}
        <section className="py-6 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16 text-white">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Free delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">100% confidential</span>
              </div>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Australian doctors</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#a8bb9e]" />
                <span className="text-sm">Ongoing support</span>
              </div>
            </div>
          </div>
        </section>

        {/* What is ED Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Info Card */}
              <div className="bg-gradient-to-br from-[#f4f7f2] to-[#e6ebe3] rounded-3xl p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                    What is erectile dysfunction?
                  </h3>
                </div>

                <p className="text-[#5c7a52] leading-relaxed mb-6">
                  Erectile Dysfunction (ED) is the inability to get or keep an erection firm enough to have sexual intercourse. It&apos;s a common condition that can affect men at any age, though it becomes more prevalent with age.
                </p>

                <p className="text-[#5c7a52] leading-relaxed mb-6">
                  ED can be caused by various factors including:
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-[#5c7a52]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                    <span>Cardiovascular conditions and blood flow issues</span>
                  </li>
                  <li className="flex items-start gap-3 text-[#5c7a52]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                    <span>Diabetes and metabolic conditions</span>
                  </li>
                  <li className="flex items-start gap-3 text-[#5c7a52]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                    <span>Hormonal imbalances including low testosterone</span>
                  </li>
                  <li className="flex items-start gap-3 text-[#5c7a52]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                    <span>Psychological factors: stress, anxiety, depression</span>
                  </li>
                  <li className="flex items-start gap-3 text-[#5c7a52]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                    <span>Lifestyle factors: smoking, alcohol, lack of exercise</span>
                  </li>
                </ul>

                <p className="text-[#2c3628] font-medium">
                  ED is treatable. Speak with a doctor to understand your options.
                </p>
              </div>

              {/* Content */}
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Evidence-based treatment
                </span>
                <h3 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  How ED medications{" "}
                  <span className="text-[#5c7a52] italic">work</span>
                </h3>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  ED medications like Sildenafil and Tadalafil are known as PDE5 inhibitors. They work by helping to relax blood vessels in the penis, allowing increased blood flow when you&apos;re sexually aroused.
                </p>

                <p className="text-[#5c7a52] leading-relaxed mb-8">
                  These medications don&apos;t cause an automatic erection — sexual arousal is still required. They simply help your body respond naturally to stimulation by improving blood flow to the area.
                </p>

                <div className="space-y-4">
                  {edTreatmentInfo.map((treatment) => (
                    <div
                      key={treatment.name}
                      className="bg-[#fdfbf7] border border-[#e6ebe3] rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-[#2c3628]">{treatment.name}</h4>
                        <span className="text-xs bg-[#e6ebe3] text-[#5c7a52] px-2 py-1 rounded-full">
                          {treatment.brandName}
                        </span>
                      </div>
                      <p className="text-sm text-[#5c7a52]">{treatment.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ED How It Works Section */}
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
                Get started from your phone or computer. No waiting rooms, no awkward conversations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {edProcessSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Connection line */}
                  {index < edProcessSteps.length - 1 && (
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
                    <h4 className="text-xl font-serif text-[#2c3628] mb-3">
                      {step.title}
                    </h4>
                    <p className="text-[#5c7a52] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/mens-health/assessment?concern=erectile-dysfunction"
                className="btn-primary inline-flex items-center gap-2"
              >
                Start your assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ED Benefits Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Why choose us
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Treatment delivered{" "}
                <span className="text-[#5c7a52] italic">discreetly</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {edBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h4 className="text-lg font-serif text-[#2c3628] mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== END OF FULL ED SECTION ========== */}

        {/* Other Treatment Sections (PE and Energy) */}
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
                  Every man&apos;s biology is different. Our comprehensive blood panels measure the hormones, nutrients, and markers that matter — giving your doctor the data needed to create a treatment plan that works for you.
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
                From symptoms to{" "}
                <span className="text-[#5c7a52] italic">solutions</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Our streamlined process gets you from assessment to treatment quickly, while ensuring thorough medical evaluation at every step.
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

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                Patient experiences
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Men who took{" "}
                <span className="text-[#5c7a52] italic">control</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-[#e6ebe3]"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#c17a58] text-[#c17a58]" />
                    ))}
                  </div>
                  <blockquote className="text-[#2c3628] leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#e6ebe3]">
                    <div className="w-10 h-10 rounded-full bg-[#34412f] flex items-center justify-center text-white text-sm font-medium">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-medium text-[#2c3628]">{testimonial.name}, {testimonial.age}</p>
                      <p className="text-sm text-[#7e9a72]">{testimonial.location} · {testimonial.treatment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-[#7e9a72]">
              Individual results may vary. Testimonials are from real patients.
            </p>
          </div>
        </section>

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
                  <Truck className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Discreet Delivery</h3>
                <p className="text-sm text-[#5c7a52]">Unmarked packaging delivered to your door</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Ongoing Support</h3>
                <p className="text-sm text-[#5c7a52]">Unlimited messaging with your care team</p>
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
              Complete a free health assessment and get matched with the right treatment plan. Our doctors are ready to help you feel your best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mens-health/assessment"
                className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Start free assessment
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
              Free assessment · Refund if not suitable · Australian doctors
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
