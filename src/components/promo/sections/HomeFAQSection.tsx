"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ArrowLeft, Signal, Wifi, Battery } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

/** Homepage FAQs adapted from Function Health’s FAQ themes for Sanative (AU, doctor-led). */
const questionsAndAnswers: QA[] = [
  {
    question: "Why should I join Sanative?",
    answer:
      "Sanative helps you understand what’s happening inside your body — and act earlier. Through doctor-led assessment and advanced biomarker panels, you get a clearer baseline across heart, hormones, metabolism, thyroid, nutrients, and more, so you can track change over time and feel your best for longer.",
  },
  {
    question: "Who can sign up?",
    answer:
      "Sanative is for adults 18 and over in Australia. If you are currently pregnant, biomarker panels may not be suitable — many markers shift in pregnancy and are harder to interpret. Your Sanative doctor will confirm what’s clinically appropriate for you.",
  },
  {
    question: "Which tests are included?",
    answer:
      "Depending on your panel, you’ll access 85+ biomarkers covering heart, hormones, thyroid, liver, kidneys, nutrients, inflammation, metabolic health, and more. Your doctor reviews your profile and arranges pathology referrals. You can upgrade panels or add retesting where clinically useful.",
  },
  {
    question: "How do lab visits work?",
    answer:
      "After checkout and your doctor consultation, you’ll receive a pathology referral. Book at a partner Australian collection centre at a time that suits you. Most visits take about 15 minutes. We walk you through fasting and preparation so results are as accurate as possible.",
  },
  {
    question: "How often should I test?",
    answer:
      "Many members test at least twice a year — an initial comprehensive panel, then a follow-up to see what’s changed. Your body shifts with lifestyle, stress, and sleep. Regular testing builds a personal baseline so you can track progress and adjust with your doctor.",
  },
  {
    question: "When do I get my results?",
    answer:
      "Results typically start arriving within a few days of your collection, depending on the laboratory. Every result comes with clear explanations in your Sanative app, plus AI-assisted insights and clinician review so you understand what your numbers mean — and what to do next.",
  },
  {
    question: "How do I join other programs like weight loss or hair loss?",
    answer:
      "From your Sanative portal you can explore other doctor-led pathways — including weight management, hair health, and men’s or women’s health. Start with a short assessment for that program; your doctor reviews whether it’s clinically appropriate and discusses next steps privately with you.",
  },
  {
    question: "Is there a discount on other Sanative programs once I am a member?",
    answer:
      "Yes. Active Sanative members get their first month free when they join any other Sanative program — such as weight management, hair health, or men’s or women’s health — from their portal. Your Care Partner can confirm what’s available on your account.",
  },
];

export function HomeFAQSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);

  const selectedQA = questionsAndAnswers[selectedIndex];

  useEffect(() => {
    setDisplayedAnswer("");
    setIsTyping(true);

    const answer = selectedQA.answer;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < answer.length) {
        setDisplayedAnswer(answer.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 18);

    return () => clearInterval(typingInterval);
  }, [selectedIndex, selectedQA.answer]);

  const handleQuestionClick = (index: number) => {
    if (index !== selectedIndex) setSelectedIndex(index);
    // On stacked (mobile) layout the answer lives in the phone below the chips.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]"
      aria-labelledby="home-faq-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="lg:pt-8">
            <p className="text-sm font-medium text-[#c17a58] uppercase tracking-wider mb-4">
              Your questions, answered
            </p>
            <h2
              id="home-faq-heading"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif text-[#2c3628] leading-[1.1] mb-6"
            >
              Doctor-led care.{" "}
              <span className="text-[#5c7a52] italic">Your questions answered.</span>
            </h2>
            <p className="text-[#5c7a52] text-lg mb-10 max-w-md leading-relaxed">
              Common questions about biomarkers, doctor consultations, and how Sanative works in
              Australia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 max-w-xl">
              {questionsAndAnswers.map((qa, index) => (
                <button
                  key={qa.question}
                  type="button"
                  onClick={() => handleQuestionClick(index)}
                  className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                    selectedIndex === index
                      ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                      : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                  }`}
                >
                  {qa.question}
                </button>
              ))}
            </div>
          </div>

          <div ref={phoneRef} className="flex justify-center lg:justify-end scroll-mt-24">
            <div className="relative">
              <div className="w-[320px] sm:w-[360px] bg-[#1a1a1a] rounded-[48px] p-3 shadow-2xl">
                <div className="bg-[#fdfbf7] rounded-[40px] overflow-hidden">
                  <div className="bg-[#fdfbf7] px-8 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1a1a]">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <Signal className="w-4 h-4 text-[#1a1a1a]" aria-hidden />
                      <Wifi className="w-4 h-4 text-[#1a1a1a]" aria-hidden />
                      <Battery className="w-6 h-4 text-[#1a1a1a]" aria-hidden />
                    </div>
                  </div>

                  <div className="bg-[#fdfbf7] px-5 py-4 flex items-center gap-4">
                    <div className="p-1" aria-hidden>
                      <ArrowLeft className="w-5 h-5 text-[#5c7a52]" />
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#5c7a52] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">S</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2c3628]">Sarah</span>
                        <span className="px-2.5 py-0.5 bg-[#5c7a52] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                          Care Partner
                        </span>
                      </div>
                      <span className="text-xs text-[#7e9a72]">Usually replies in minutes</span>
                    </div>
                  </div>

                  <div className="h-[420px] sm:h-[480px] px-5 py-6 space-y-5 overflow-y-auto bg-[#fdfbf7]">
                    <div className="flex justify-end">
                      <div className="bg-[#5c7a52] text-white px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[85%]">
                        <p className="text-sm leading-relaxed">{selectedQA.question}</p>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <Check className="w-3.5 h-3.5 text-white/60" aria-hidden />
                          <Check className="w-3.5 h-3.5 text-white/60 -ml-2" aria-hidden />
                          <span className="text-[10px] text-white/60 ml-1">3:00PM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="bg-white border border-[#e6ebe3] px-5 py-4 rounded-2xl rounded-tl-md max-w-[85%] shadow-sm">
                        <p className="text-sm text-[#2c3628] leading-relaxed">
                          {displayedAnswer}
                          {isTyping && (
                            <span className="inline-block w-0.5 h-4 bg-[#5c7a52] ml-0.5 animate-pulse" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fdfbf7] px-5 py-4 border-t border-[#e6ebe3]">
                    <div className="bg-white border border-[#e6ebe3] rounded-full px-5 py-3 flex items-center">
                      <span className="text-sm text-[#a8bb9e]">Ask Sarah anything...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -z-10 -top-12 -right-12 w-40 h-40 bg-[#5c7a52]/5 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-12 -left-12 w-48 h-48 bg-[#c17a58]/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
