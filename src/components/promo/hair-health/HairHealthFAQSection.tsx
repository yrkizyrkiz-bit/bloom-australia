"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ArrowLeft, Signal, Wifi, Battery } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

const questionsAndAnswers: QA[] = [
  {
    question: "How quickly will I see results?",
    answer:
      "Hair changes vary widely between individuals. Your doctor will discuss realistic expectations and review progress during follow-up consultations.",
  },
  {
    question: "Are these treatments safe?",
    answer:
      "Treatment approaches are assessed individually by our AHPRA-registered doctors based on your health history. Side effects are discussed in consultation and we monitor your progress throughout care.",
  },
  {
    question: "Do I need a blood test?",
    answer:
      "While not always mandatory, blood tests help us identify underlying causes of hair loss such as hormonal imbalances, thyroid issues, or nutritional deficiencies. This allows for more targeted and effective treatment. We'll recommend tests based on your assessment.",
  },
  {
    question: "Will my hair loss return if I stop treatment?",
    answer:
      "For conditions like androgenetic alopecia (pattern hair loss), ongoing treatment is typically needed to maintain results. However, addressing underlying deficiencies may provide lasting benefits even after supplementation stops. Your doctor will discuss long-term management options.",
  },
  {
    question: "Is treatment different for men and women?",
    answer:
      "Yes, the causes and treatment approaches for hair loss differ between men and women. Your doctor will assess your profile and discuss suitable options privately during consultation.",
  },
  {
    question: "How much does treatment cost?",
    answer:
      "Costs depend on your personalised plan after doctor assessment. Consultation and program fees are discussed before you proceed. Any prescribed items are dispensed by Australian pharmacies when clinically appropriate.",
  },
];

export function HairHealthFAQSection() {
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
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]"
      aria-labelledby="hair-faq-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="lg:pt-8">
            <p className="text-sm font-medium text-[#c17a58] uppercase tracking-wider mb-4">
              Your questions, answered
            </p>
            <h2
              id="hair-faq-heading"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif text-[#2c3628] leading-[1.1] mb-6"
            >
              Doctor-led care.{" "}
              <span className="text-[#5c7a52] italic">Your questions answered.</span>
            </h2>
            <p className="text-[#5c7a52] text-lg mb-10 max-w-md leading-relaxed">
              Your Care Partner is here to support you. Here are common questions about hair health
              with Sanative.
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
