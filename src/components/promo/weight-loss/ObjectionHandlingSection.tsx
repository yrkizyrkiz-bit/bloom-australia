"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ArrowLeft, Signal, Wifi, Battery } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

const questionsAndAnswers: QA[] = [
  {
    question: "How does the assessment work?",
    answer: "Your Sanative doctor reviews your health history, symptoms, and goals. Where clinically appropriate, blood tests help identify factors that may be affecting your weight, such as thyroid function, metabolic markers, or hormonal balance.",
  },
  {
    question: "Is Sanative private and discreet?",
    answer: "Yes. Your health information is protected under Australian privacy laws and never shared without your consent. Program logistics are handled confidentially.",
  },
  {
    question: "How is this different to diets?",
    answer: "Our doctors assess underlying factors that may be contributing to weight management challenges. Your care plan is guided by your health profile and biomarkers, not BMI alone.",
  },
  {
    question: "What about side effects?",
    answer: "Your doctor will discuss potential side effects during your consultation. Ongoing clinical monitoring allows your doctor to adjust your care plan as needed. Your safety is our priority.",
  },
  {
    question: "What is a Care Partner and how do they help?",
    answer: "Your Care Partner is a real person (not a chatbot) who supports you throughout your journey. They check in weekly, answer questions between doctor consultations, help you stay accountable, and celebrate your progress. Think of them as your personal health ally who genuinely cares about your success.",
  },
  {
    question: "How much does the program cost?",
    answer: "Sanative Membership is $365 billed annually ($1 a day) and includes your comprehensive biomarker panel plus your first 30 days of Weight Management Care. After that, continue Weight Management Care for $360 every three months. Medication cost is not included.",
  },
  {
    question: "Who is eligible for the program?",
    answer: "Generally, you need a BMI of 30+ or BMI 27+ with weight-related health conditions such as type 2 diabetes, high blood pressure, or PCOS. Women experiencing hormonal or metabolic weight gain may also be eligible. Our doctors assess your full health picture including biomarkers during consultation.",
  },
  {
    question: "What results can I expect?",
    answer: "Results vary significantly based on individual biology, adherence, and starting point. Your doctor will discuss realistic expectations during your consultation and use biomarker results to help personalise your plan.",
  },
  {
    question: "What about treatment options?",
    answer: "Treatment options are discussed privately with your doctor if clinically appropriate. Your monthly program fee covers clinical assessment, monitoring, and portal access, not medicine bundles.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime with no penalties or cancellation fees. Simply contact our support team or cancel through the app. Your subscription ends at the end of your current billing period. We believe in earning your trust every month.",
  },
];

export function ObjectionHandlingSection() {
  const [selectedIndex, setSelectedIndex] = useState(3);
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
    }, 25);

    return () => clearInterval(typingInterval);
  }, [selectedIndex, selectedQA.answer]);

  const handleQuestionClick = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
    }
    // On stacked (mobile) layout the answer lives in the phone below the chips.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="pt-20 pb-20 lg:pt-32 lg:pb-28 px-4 sm:px-6 lg:px-8 bg-[#f5faf6]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="lg:pt-8">
            <p className="text-sm font-medium text-[#7b8967] uppercase tracking-wider mb-4">
              Your questions, answered
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif text-[#313630] leading-[1.1] mb-6">
              Doctor-led care.{" "}
              <span className="text-[#7b8967] italic">Your questions answered.</span>
            </h2>
            <p className="text-[rgba(0,0,0,0.5)] text-lg mb-10 max-w-md leading-relaxed">
              Your Care Partner is here to support you. Here are common questions about our program.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 max-w-lg max-h-[28rem] sm:max-h-[32rem] overflow-y-auto pr-1">
              {questionsAndAnswers.map((qa, index) => (
                <button
                  key={qa.question}
                  onClick={() => handleQuestionClick(index)}
                  className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                    selectedIndex === index
                      ? "border-[#313630] bg-[#313630] text-white"
                      : "border-[#313630]/35 bg-white text-[#313630] hover:border-[#313630] hover:bg-[#e2ece7]"
                  }`}
                >
                  {qa.question}
                </button>
              ))}
            </div>
          </div>

          <div ref={phoneRef} className="flex justify-center lg:justify-end scroll-mt-24">
            <div className="relative">
              <div className="w-[320px] sm:w-[360px] bg-[#313630] rounded-[48px] p-3 shadow-2xl">
                <div className="bg-[#f5faf6] rounded-[40px] overflow-hidden">
                  <div className="bg-[#f5faf6] px-8 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#313630]">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <Signal className="w-4 h-4 text-[#313630]" />
                      <Wifi className="w-4 h-4 text-[#313630]" />
                      <Battery className="w-6 h-4 text-[#313630]" />
                    </div>
                  </div>

                  <div className="bg-[#f5faf6] px-5 py-4 flex items-center gap-4">
                    <button className="p-1">
                      <ArrowLeft className="w-5 h-5 text-[#7b8967]" />
                    </button>
                    <div className="w-11 h-11 rounded-full bg-[#7b8967] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">S</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#313630]">Sarah</span>
                        <span className="px-2.5 py-0.5 bg-[#7b8967] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                          Care Partner
                        </span>
                      </div>
                      <span className="text-xs text-[rgba(0,0,0,0.5)]">Usually replies in minutes</span>
                    </div>
                  </div>

                  <div className="h-[420px] sm:h-[480px] px-5 py-6 space-y-5 overflow-hidden bg-[#f5faf6]">
                    <div className="flex justify-end">
                      <div className="bg-[#7b8967] text-white px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[85%]">
                        <p className="text-sm leading-relaxed">{selectedQA.question}</p>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <Check className="w-3.5 h-3.5 text-white/60" />
                          <Check className="w-3.5 h-3.5 text-white/60 -ml-2" />
                          <span className="text-[10px] text-white/60 ml-1">3:00PM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7b8967] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="bg-white border border-[#d3e0db] px-5 py-4 rounded-2xl rounded-tl-md max-w-[85%] shadow-sm">
                        <p className="text-sm text-[#313630] leading-relaxed">
                          {displayedAnswer}
                          {isTyping && (
                            <span className="inline-block w-0.5 h-4 bg-[#7b8967] ml-0.5 animate-pulse" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f5faf6] px-5 py-4 border-t border-[#d3e0db]">
                    <div className="bg-white border border-[#d3e0db] rounded-full px-5 py-3 flex items-center">
                      <span className="text-sm text-[rgba(0,0,0,0.35)]">Ask Sarah anything...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -z-10 -top-12 -right-12 w-40 h-40 bg-[#7b8967]/20 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-12 -left-12 w-48 h-48 bg-[#d3e0db]/80 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
