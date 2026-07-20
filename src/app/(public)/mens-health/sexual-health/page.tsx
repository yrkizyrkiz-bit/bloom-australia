"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { PublicComplianceBlock } from "@/components/legal/PublicComplianceBlock";
import {
  ArrowRight,
  Shield,
  Heart,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Beaker,
  Stethoscope,
  Lock,
  MessageSquare,
  Phone,
  Users,
  HeartHandshake,
} from "lucide-react";

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
    <div className="border-b border-[#e6ebe3] last:border-b-0">
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
          isOpen ? "max-h-[500px] pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[#5c7a52] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

const processSteps = [
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

const benefits = [
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

const faqs = [
  {
    question: "What does the sexual health program include?",
    answer:
      "You start with an online health assessment. Based on your responses, we may recommend blood tests where clinically appropriate. An Australian-registered doctor then reviews everything and discusses whether a personalised care plan is suitable for you via telehealth consultation.",
  },
  {
    question: "Is care provided by real Australian doctors?",
    answer:
      "Yes. Every Sanative doctor is AHPRA-registered and practising in Australia. Your doctor reviews your health profile, discusses your symptoms, and determines what is clinically appropriate for you individually.",
  },
  {
    question: "Are care options included in the program fee?",
    answer:
      "Care options are discussed privately with your doctor if clinically appropriate. Your program fee covers clinical assessment, monitoring, and portal access — not medicine bundles.",
  },
  {
    question: "Is my information confidential?",
    answer:
      "Absolutely. All consultations, test results, and care plans are confidential. Your health information is protected under Australian privacy laws and stored securely.",
  },
  {
    question: "What if the program isn't suitable for me?",
    answer:
      "If your Sanative doctor determines after assessment that a program is not clinically appropriate for you, your first-month payment will be refunded in accordance with our Refund Policy.",
  },
];

export default function SexualHealthPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />

      <main>
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f4f7f2] via-[#fdfbf7] to-[#e6ebe3]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#5c7a52]">AHPRA-registered doctors</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight mb-6">
                  Doctor-led{" "}
                  <span className="text-[#5c7a52] italic">sexual health</span>{" "}
                  assessment
                </h1>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  Sanative offers confidential, doctor-led assessment for men&apos;s sexual health concerns. Your doctor reviews your health profile and discusses what is clinically appropriate for you — individually, and in private consultation.
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
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="bg-gradient-to-br from-[#f4f7f2] to-[#e6ebe3] rounded-3xl p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                    A whole-person approach
                  </h2>
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
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  Your doctor reviews{" "}
                  <span className="text-[#5c7a52] italic">what fits you</span>
                </h2>
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

        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                Simple process
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                How it{" "}
                <span className="text-[#5c7a52] italic">works</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                A streamlined clinical pathway — thorough medical evaluation at every step.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < processSteps.length - 1 && (
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
                    <h3 className="text-xl font-serif text-[#2c3628] mb-3">{step.title}</h3>
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

        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Why choose us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Doctor-led care,{" "}
                <span className="text-[#5c7a52] italic">built around you</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PublicComplianceBlock title="Doctor-led men's health care" />

        <section className="py-20 lg:py-28 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">AHPRA registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors are fully registered with AHPRA</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">100% confidential</h3>
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

            <div className="bg-white rounded-3xl border border-[#e6ebe3] px-6 lg:px-8">
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

        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Complete a health assessment and book a doctor consultation. Your Sanative doctor reviews your profile and discusses what is clinically appropriate for you.
            </p>
            <Link
              href="/mens-health/assessment?concern=sexual-health"
              className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              Start assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-[#7e9a72]">
              Refund if not suitable · Australian doctors · Confidential care
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
