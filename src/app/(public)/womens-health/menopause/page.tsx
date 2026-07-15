"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { PublicComplianceBlock } from "@/components/legal/PublicComplianceBlock";
import {
  ArrowRight,
  Beaker,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Lock,
  MessageSquare,
  Moon,
  Phone,
  Shield,
  Stethoscope,
  Users,
  Brain,
  Activity,
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
    <div className="border-b border-[#f8e1e1] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-[#2c3628] pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#c17a58] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#c17a58] flex-shrink-0" />
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

const sectionNav = [
  { id: "overview", label: "Overview" },
  { id: "symptoms", label: "Symptoms" },
  { id: "perimenopause", label: "Perimenopause" },
  { id: "care", label: "Care at Sanative" },
  { id: "process", label: "How it works" },
  { id: "faq", label: "FAQ" },
];

const symptomGroups = [
  {
    title: "Vasomotor",
    icon: Flame,
    items: ["Hot flushes and night sweats", "Sudden warmth or chills", "Flushing of the face or chest"],
  },
  {
    title: "Sleep & mood",
    icon: Moon,
    items: ["Difficulty falling or staying asleep", "Low mood or irritability", "Anxiety or brain fog"],
  },
  {
    title: "Sexual & urinary",
    icon: Heart,
    items: ["Vaginal dryness or discomfort", "Changes in libido", "Urinary urgency or leakage"],
  },
  {
    title: "Physical & metabolic",
    icon: Activity,
    items: ["Joint aches or stiffness", "Weight changes", "Reduced energy or stamina"],
  },
  {
    title: "Menstrual",
    icon: Brain,
    items: ["Irregular or heavier periods (perimenopause)", "Skipped cycles", "Periods stopping (menopause)"],
  },
];

const processSteps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Health assessment",
    description:
      "Complete a confidential questionnaire about your symptoms, cycle history, medical background, and goals — tailored for perimenopause and menopause.",
  },
  {
    number: "02",
    icon: Beaker,
    title: "Biomarkers where appropriate",
    description:
      "Your doctor may recommend blood tests — for example hormones, thyroid, metabolic and bone-health markers — to inform a safe, personalised plan.",
  },
  {
    number: "03",
    icon: Phone,
    title: "Telehealth consultation",
    description:
      "An AHPRA-registered Australian doctor reviews your assessment and results, then discusses what is clinically appropriate for you in a private 30-minute consult.",
  },
];

const benefits = [
  {
    icon: Stethoscope,
    title: "AHPRA-registered doctors",
    description:
      "Every consultation is with an Australian-registered doctor who assesses your full health profile before any clinical decisions.",
  },
  {
    icon: Beaker,
    title: "Biomarker-informed care",
    description:
      "Hormone and metabolic testing helps your doctor understand your biology — not guesswork based on symptoms alone.",
  },
  {
    icon: Lock,
    title: "Confidential & discreet",
    description:
      "Your health information is protected under Australian privacy law. Telehealth from home, on your schedule.",
  },
  {
    icon: MessageSquare,
    title: "Ongoing support",
    description:
      "Message your care team between appointments. Symptom tracking and follow-up are part of your program.",
  },
];

const faqs = [
  {
    question: "What is the difference between perimenopause and menopause?",
    answer:
      "Perimenopause is the transition when hormone levels fluctuate and periods become irregular — often for several years. Menopause is reached when you have not had a period for 12 months (or after surgical removal of ovaries). Many women seek support during perimenopause, not only after periods stop.",
  },
  {
    question: "Can I get menopause care via telehealth in Australia?",
    answer:
      "Yes. Sanative offers telehealth consultations with AHPRA-registered doctors across Australia. Your doctor may also recommend pathology at a collection centre near you where clinically appropriate.",
  },
  {
    question: "Will I be prescribed hormone therapy (MHT/HRT)?",
    answer:
      "Not automatically. Menopausal hormone therapy (MHT), sometimes called HRT, may be discussed if clinically appropriate for your symptoms and health history. Your doctor explains benefits and risks individually. Suitable options are never advertised on this website.",
  },
  {
    question: "Why are blood tests recommended?",
    answer:
      "Symptoms overlap with thyroid disease, anaemia, and other conditions. Blood tests help your doctor rule out other causes and tailor care — for example hormone levels, thyroid function, iron, lipids, and markers relevant to bone and metabolic health.",
  },
  {
    question: "What if menopause care is not suitable for me?",
    answer:
      "If your Sanative doctor determines after assessment that a program is not clinically appropriate, your first-month payment will be refunded in accordance with our Refund Policy.",
  },
];

export default function MenopausePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#fdf8f6]">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fdf8f6] via-[#fef4f0] to-[#f9f5f3]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[#f8e1e1]/40 rounded-full blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#f8e1e1]/60 border border-[#e8b4b4]/30 rounded-full px-4 py-2 mb-6">
                  <Flame className="w-4 h-4 text-[#c17a58]" />
                  <span className="text-sm text-[#8b5a5a]">Perimenopause & menopause</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight mb-6">
                  Menopause care,{" "}
                  <span className="text-[#c17a58] italic">on your terms</span>
                </h1>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  Menopause is a natural life stage — but the symptoms are real. Sanative connects you
                  with Australian doctors for confidential assessment, biomarker-informed review, and
                  personalised care planning if clinically appropriate.
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    "Biological Age Clock — your biomarkers analysed and tracked via the app",
                    "Doctor-led assessment before any care plan",
                    "Telehealth across Australia",
                    "Treatment options discussed privately in consultation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[#2c3628]">
                      <CheckCircle className="w-5 h-5 text-[#c17a58]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/womens-health/assessment?category=menopause"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all shadow-lg shadow-[#c17a58]/20"
                >
                  Start menopause assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/5] max-w-lg mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl border border-[#f8e1e1]/50">
                  <Image
                    src="/images/womens-health-hero.png"
                    alt="Woman with common menopause symptoms including hot flushes, brain fog, mood changes, and night sweats"
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section nav — Hers-style jump links */}
        <nav className="sticky top-0 z-20 bg-[#fdf8f6]/95 backdrop-blur border-b border-[#f8e1e1]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {sectionNav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-4 py-2 text-sm font-medium text-[#5c7a52] hover:text-[#c17a58] hover:bg-[#f8e1e1]/40 rounded-full transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Overview */}
        <section id="overview" className="py-20 lg:py-28 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#f8e1e1]/60 text-[#8b5a5a] rounded-full mb-4">
                  Overview
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  A natural transition —{" "}
                  <span className="text-[#c17a58] italic">you don&apos;t have to navigate it alone</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  Menopause marks the end of menstrual periods, usually between ages 45 and 55 in
                  Australia. For many women, perimenopause — the years leading up to it — brings the
                  most disruptive symptoms as oestrogen and progesterone levels change.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Despite how common this is, menopause is still under-discussed. Sanative exists to
                  demystify the transition and connect you with doctors who take your symptoms
                  seriously and review your health holistically.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#fef4f0] to-[#f8e1e1]/50 rounded-3xl p-8 lg:p-10 border border-[#f8e1e1]">
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">When to seek support</h3>
                <ul className="space-y-3">
                  {[
                    "Hot flushes or night sweats affecting sleep or daily life",
                    "Mood changes, anxiety, or brain fog that feel new or persistent",
                    "Irregular periods or heavy bleeding in perimenopause",
                    "Vaginal dryness, discomfort, or urinary symptoms",
                    "You want a doctor to review whether MHT or other options suit you",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section id="symptoms" className="py-20 lg:py-28 bg-[#fef4f0] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#f8e1e1] text-[#8b5a5a] rounded-full mb-4">
                Symptoms
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-4">
                Common menopause symptoms
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Every woman&apos;s experience is different. These are among the most reported symptoms
                during perimenopause and menopause.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {symptomGroups.map((group) => (
                <div
                  key={group.title}
                  className="bg-white rounded-3xl p-6 lg:p-8 border border-[#f8e1e1]/80 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#f8e1e1]/60 flex items-center justify-center mb-4">
                    <group.icon className="w-6 h-6 text-[#c17a58]" />
                  </div>
                  <h3 className="text-xl font-serif text-[#2c3628] mb-3">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="text-sm text-[#5c7a52] flex items-start gap-2">
                        <span className="text-[#c17a58] mt-0.5">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-[#7e9a72] max-w-2xl mx-auto">
              Sudden severe symptoms, heavy bleeding, or thoughts of self-harm require urgent in-person
              care — call 000 or see your GP promptly.
            </p>
          </div>
        </section>

        {/* Perimenopause */}
        <section id="perimenopause" className="py-20 lg:py-28 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-gradient-to-br from-[#e8d5e8]/30 to-[#fef4f0] rounded-3xl p-8 lg:p-10 border border-[#e8d5e8]/40">
                <h3 className="text-2xl font-serif text-[#2c3628] mb-4">How menopause is diagnosed</h3>
                <p className="text-[#5c7a52] leading-relaxed mb-4">
                  In women over 45, diagnosis is usually based on your symptoms and menstrual pattern —
                  blood tests are not always required. Under 45, or with unusual symptoms, your doctor
                  may order tests to confirm ovarian function and exclude other conditions.
                </p>
                <p className="text-[#5c7a52] leading-relaxed text-sm">
                  Sanative doctors follow Australian clinical guidance. Individual assessment always
                  comes first.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e8d5e8]/40 text-[#6b4a6b] rounded-full mb-4">
                  Perimenopause
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  It often starts{" "}
                  <span className="text-[#c17a58] italic">before periods stop</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-4">
                  Perimenopause can last several years. Hormone levels rise and fall unpredictably —
                  which is why symptoms can come and go and why a one-off blood test may not tell the
                  full story.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Early signs often include irregular periods, hot flushes, sleep disruption, and mood
                  changes. Starting a conversation with a doctor during perimenopause can help you
                  plan ahead rather than react in crisis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Care at Sanative */}
        <section id="care" className="py-20 lg:py-28 bg-[#fdf8f6] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#f8e1e1]/60 text-[#8b5a5a] rounded-full mb-4">
                Treatment & care
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Treat the cause, not just the signs
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
                Declining oestrogen drives many menopause symptoms. Your doctor may discuss lifestyle
                changes, non-hormonal options, or menopausal hormone therapy (MHT) — based on your
                symptoms, age, and medical history. Nothing is one-size-fits-all.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Lifestyle & self-care",
                  body: "Sleep hygiene, exercise, stress management, and dietary support — practical foundations your doctor can help personalise.",
                },
                {
                  title: "Non-hormonal options",
                  body: "Some women benefit from non-hormonal medicines or topical treatments for specific symptoms. Your doctor explains what may suit you.",
                },
                {
                  title: "Menopausal hormone therapy (MHT)",
                  body: "Where clinically appropriate, MHT can relieve hot flushes, sleep disruption, and genitourinary symptoms. Benefits and risks are discussed individually.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-6 border border-[#f8e1e1] text-center"
                >
                  <h3 className="text-lg font-serif text-[#2c3628] mb-3">{card.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-[#7e9a72] max-w-2xl mx-auto">
              Sanative does not advertise prescription products on this website. Suitable care options,
              if any, are discussed privately with your doctor. PBS and private prescription costs vary.
            </p>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-6 bg-[#3d2c2c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 lg:gap-14 text-white">
              {[
                { icon: Shield, label: "AHPRA-registered doctors" },
                { icon: Lock, label: "Confidential telehealth" },
                { icon: Beaker, label: "Biomarker-informed" },
                { icon: Users, label: "Care team support" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#f8e1e1]" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="py-20 lg:py-28 bg-[#fef4f0] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-4">
                How Sanative{" "}
                <span className="text-[#c17a58] italic">works</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                A clear clinical pathway — from assessment to doctor review and ongoing support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-[#e8b4b4]/50" />
                  )}
                  <div className="bg-white rounded-3xl p-8 border border-[#f8e1e1] relative z-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#c17a58] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{step.number}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#f8e1e1]/60 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-[#c17a58]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif text-[#2c3628] mb-3">{step.title}</h3>
                    <p className="text-[#5c7a52] leading-relaxed text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/womens-health/assessment?category=menopause"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all"
              >
                Start your assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Why women choose{" "}
                <span className="text-[#c17a58] italic">Sanative</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 border border-[#f8e1e1] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#f8e1e1]/50 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-[#c17a58]" />
                  </div>
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PublicComplianceBlock title="Doctor-led women's menopause care" />

        {/* FAQ */}
        <section id="faq" className="py-20 lg:py-28 bg-[#fef4f0] scroll-mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>
            <div className="bg-white rounded-3xl border border-[#f8e1e1] px-6 lg:px-8">
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

        {/* CTA */}
        <section className="py-20 lg:py-28 bg-[#3d2c2c]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Ready to talk about menopause?
            </h2>
            <p className="text-lg text-[#f8e1e1] mb-10 max-w-2xl mx-auto">
              Complete a health assessment and book a telehealth consultation. Your Sanative doctor
              reviews your profile and discusses what is clinically appropriate for you.
            </p>
            <Link
              href="/womens-health/assessment?category=menopause"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2c3628] hover:bg-[#fef4f0] rounded-full font-medium transition-all text-lg"
            >
              Start menopause assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-[#e8b4b4]">
              Refund if not suitable · Australian doctors · Confidential care
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
