"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck,
  Lock,
  MessageSquare,
  Clock,
  Heart,
  Stethoscope,
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
        <p className="text-[#5c7a52] leading-relaxed whitespace-pre-line">{answer}</p>
      </div>
    </div>
  );
}

export default function ErectileDysfunctionPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const processSteps = [
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

  const treatmentInfo = [
    {
      name: "Short-acting treatment",
      brandName: "As-needed option",
      description: "Works within 30-60 minutes. Effects typically last 4-6 hours. Take as needed before sexual activity.",
      howItWorks: "This PDE5 inhibitor medication helps increase blood flow to the penis when sexually aroused.",
    },
    {
      name: "Long-acting treatment",
      brandName: "Flexible option",
      description: "Works within 30-60 minutes. Effects can last up to 36 hours, providing more flexibility and spontaneity.",
      howItWorks: "This longer-acting PDE5 inhibitor can be taken as needed or as a daily low-dose option for continuous effect.",
    },
  ];

  const benefits = [
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

  const faqs = [
    {
      question: "What is erectile dysfunction?",
      answer: "Erectile Dysfunction (ED) is the inability to get or maintain an erection firm enough for satisfactory sexual activity. It's a common condition that can affect men of all ages, though it becomes more common with age.\n\nED can be caused by various factors including cardiovascular conditions, diabetes, hormonal issues, certain medications, psychological factors like stress or anxiety, and lifestyle factors such as smoking or excessive alcohol consumption.",
    },
    {
      question: "How do I know if I need ED treatment?",
      answer: "If you're experiencing persistent difficulty getting or maintaining an erection, it may be worth speaking with a doctor. Occasional erection difficulties are normal and often related to stress, tiredness, or alcohol consumption.\n\nED is typically considered when erection problems occur regularly over a period of several weeks or months. Our online assessment helps determine if treatment may be appropriate for you.",
    },
    {
      question: "What treatments are available?",
      answer: "The most common ED treatments are PDE5 inhibitors — prescription medications that help increase blood flow to the penis when you're sexually aroused.\n\nTreatments come in different forms including tablets taken as-needed or daily low-dose options. Your doctor will recommend the most appropriate option based on your health profile and preferences.",
    },
    {
      question: "Are ED medications safe?",
      answer: "ED medications have been used safely by millions of men worldwide for over 20 years. However, they're not suitable for everyone. They may not be appropriate for men taking certain heart medications (nitrates), those with certain cardiovascular conditions, or those with specific health contraindications.\n\nThis is why a proper medical assessment is essential before treatment is prescribed. Our doctors review your full health history to ensure treatment is safe for you.",
    },
    {
      question: "How quickly do ED medications work?",
      answer: "Short-acting ED medications typically work within 30-60 minutes and effects last around 4-6 hours. They work best when taken on an empty stomach.\n\nLonger-acting options also start working within 30-60 minutes but can remain effective for up to 36 hours, offering more flexibility. Daily low-dose options provide continuous effect, allowing for spontaneity.",
    },
    {
      question: "What if the medication doesn't work?",
      answer: "If your initial treatment isn't providing the results you hoped for, contact your care team. Sometimes adjustments to dosage or trying a different medication can help.\n\nIt's also important to note that these medications require sexual arousal to work — they don't create an automatic erection. If you're experiencing persistent issues, your doctor may recommend additional evaluation to identify any underlying causes.",
    },
    {
      question: "Is this service confidential?",
      answer: "Yes, completely. All consultations, health information, and prescriptions are protected by Australian privacy laws and medical confidentiality standards.\n\nMedications are shipped in plain, unmarked packaging with no indication of the contents. Your credit card statement will show a discrete business name.",
    },
    {
      question: "How much does treatment cost?",
      answer: "Treatment costs vary depending on the medication and quantity prescribed. After your consultation, you'll receive clear pricing information before any payment is required.\n\nWe offer competitive pricing and ongoing subscription options for men who use treatment regularly. There are no hidden fees or surprise charges.",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Hero Section */}
        <section className="relative py-10 lg:py-16 bg-[#fdfbf7] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#5c7a52]">AHPRA-registered doctors</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight mb-6">
                  Erectile dysfunction{" "}
                  <span className="text-[#5c7a52] italic">treatment</span>{" "}
                  in Australia
                </h1>

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
                    src="/images/ed-hero.jpg"
                    alt="Men's health - Erectile dysfunction treatment"
                    fill
                    className="object-cover object-top"
                    priority
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

        {/* Trust Bar */}
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
                  <h2 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                    What is erectile dysfunction?
                  </h2>
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
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  How ED medications{" "}
                  <span className="text-[#5c7a52] italic">work</span>
                </h2>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  ED medications like Sildenafil and Tadalafil are known as PDE5 inhibitors. They work by helping to relax blood vessels in the penis, allowing increased blood flow when you&apos;re sexually aroused.
                </p>

                <p className="text-[#5c7a52] leading-relaxed mb-8">
                  These medications don&apos;t cause an automatic erection — sexual arousal is still required. They simply help your body respond naturally to stimulation by improving blood flow to the area.
                </p>

                <div className="space-y-4">
                  {treatmentInfo.map((treatment) => (
                    <div
                      key={treatment.name}
                      className="bg-[#fdfbf7] border border-[#e6ebe3] rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[#2c3628]">{treatment.name}</h3>
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

        {/* How It Works Section */}
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
                Get started from your phone or computer. No waiting rooms, no awkward conversations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Connection line */}
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

        {/* Benefits Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Why choose us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Treatment delivered{" "}
                <span className="text-[#5c7a52] italic">discreetly</span>
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
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                Common questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-[#5c7a52]">
                Have more questions? Contact our care team anytime.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
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
              Ready to take the{" "}
              <span className="text-[#a8bb9e] italic">first step?</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Complete a free, confidential online assessment. Our AHPRA-registered doctors will review your information and recommend treatment if appropriate.
            </p>

            <Link
              href="/mens-health/assessment?concern=erectile-dysfunction"
              className="btn-white inline-flex items-center justify-center gap-2 text-lg px-10 py-4"
            >
              Start free assessment
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#a8bb9e]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Free assessment</span>
              </div>
              {/* GAP-026: Removed 'No commitment' - payment required */}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Refund if not suitable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>100% confidential</span>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section className="py-8 bg-[#e6ebe3]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-[#5c7a52] text-center leading-relaxed">
              <strong>Medical Disclaimer:</strong> The information on this page is for educational purposes only and should not be considered medical advice.
              Always consult with a qualified healthcare provider before starting any treatment. Individual results may vary.
              ED medications are prescription-only and may not be suitable for everyone.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
