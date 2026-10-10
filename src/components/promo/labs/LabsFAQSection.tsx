"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Battery, Check, Signal, Wifi } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

/** Consolidated Labs / biomarkers FAQs (phone UI). */
const questionsAndAnswers: QA[] = [
  {
    question: "Who is the health check recommended for?",
    answer:
      "Labs by Sanative is for adults 18 and over in Australia who want a clearer picture of their health than a typical check-up can offer. If you are pregnant, a full panel is usually deferred, many markers shift in pregnancy and are harder to read with confidence. Your Sanative doctor confirms what is clinically appropriate for you.",
  },
  {
    question: "How are the 85+ biomarkers counted?",
    answer:
      "We count every value you can see and act on, both what the laboratory measures and what we calculate from the same draw. A lipid panel, for example, is several markers from one collection; HOMA-IR and eGFR are derived, not extra tubes. That is how we reach 85+, and it is how pathology is usually described.",
  },
  {
    question: "Do any biomarkers vary with clinical circumstances?",
    answer:
      "Yes. The request is written by your doctor, not printed as a fixed shopping list. TSH is requested for every member; free T3 and free T4 are added when TSH is abnormal or your thyroid history warrants them. Acute illness, recent infection, certain medicines, fasting status and pregnancy can change whether a marker is run that day, or how it should be read. Iron studies, active B12, insulin, UACR and hs-CRP sit on the Essential form because they complete the health picture. Your doctor may still refine the request if a result would not be clinically meaningful.",
  },
  {
    question: "Do pathology tests depends on age, sex or history?",
    answer:
      "Yes, in two quiet ways. First, several scores need your age and sex to be honest (eGFR, FIB-4, KDIGO kidney risk and PhenoAge among them) and many reference ranges differ for men and women (haemoglobin, ferritin, creatinine, HDL, uric acid). Second, your history shapes both the request and the interpretation: thyroid disease, diabetes, anaemia, kidney disease, medications and family risk all change what your doctor looks for. The catalogue is the same starting point; the reading is personal.",
  },
  {
    question: "How do lab visits work?",
    answer:
      "After membership checkout and your doctor consultation, you receive a pathology referral. Book a partner Australian collection centre at a time that suits you. Most visits take about 15 minutes. We guide you on fasting and preparation so the numbers are as true as they can be. Collection-centre availability can vary by location.",
  },
  {
    question: "Is a doctor consultation required?",
    answer:
      "Yes, for the Sanative Membership biomarker pathway. An AHPRA-registered doctor reviews your assessment, arranges pathology where clinically indicated, and reviews your results. Your care team remains available for questions once the numbers are in.",
  },
  {
    question: "Is repeated health check included?",
    answer:
      "Your membership includes your first health check. A repeated health check for members is $199. Repeat checks are never automatic — your doctor requests another one when it will change the story.",
  },
  {
    question: "How often should I retest?",
    answer:
      "There is no single calendar. Some members retest within months; others wait longer. Frequency follows your results, your goals and what is clinically useful for you, not a fixed schedule applied to everyone.",
  },
  {
    question: "When do I get my results?",
    answer:
      "Results typically begin arriving within a few days of collection, depending on the laboratory. Many members see a complete picture within about 5–7 business days. Findings appear in your Sanative portal with clear explanations and clinician review, so you understand what the numbers mean.",
  },
  {
    question: "Is insurance or Medicare required?",
    answer:
      "No private health insurance is required. Sanative membership fees are private and listed upfront. Some pathology tests may attract a Medicare benefit where clinically indicated and eligible, this cannot be guaranteed. Where a test is not Medicare-eligible, laboratory fees may apply separately.",
  },
];

export function LabsFAQSection() {
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

    const typingInterval = window.setInterval(() => {
      if (currentIndex < answer.length) {
        setDisplayedAnswer(answer.slice(0, currentIndex + 1));
        currentIndex += 1;
      } else {
        setIsTyping(false);
        window.clearInterval(typingInterval);
      }
    }, 16);

    return () => window.clearInterval(typingInterval);
  }, [selectedIndex, selectedQA.answer]);

  const handleQuestionClick = (index: number) => {
    if (index !== selectedIndex) setSelectedIndex(index);
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]"
      aria-labelledby="labs-faq-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="lg:pt-8">
            <p className="text-sm font-medium text-[#c17a58] uppercase tracking-wider mb-4">
              Your questions, answered
            </p>
            <h2
              id="labs-faq-heading"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif text-[#2c3628] leading-[1.1] mb-10"
            >
              Doctor-led care.{" "}
              <span className="text-[#5c7a52] italic">
                Your questions answered.
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 max-w-xl sm:auto-rows-fr">
              {questionsAndAnswers.map((qa, index) => (
                <button
                  key={qa.question}
                  type="button"
                  onClick={() => handleQuestionClick(index)}
                  className={`flex h-full w-full items-center px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
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

          <div
            ref={phoneRef}
            className="flex justify-center lg:justify-end scroll-mt-24"
          >
            <div className="relative">
              <div className="w-[320px] sm:w-[360px] bg-[#1a1a1a] rounded-[48px] p-3 shadow-2xl">
                <div className="bg-[#fdfbf7] rounded-[40px] overflow-hidden">
                  <div className="bg-[#fdfbf7] px-8 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      9:41
                    </span>
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
                        <span className="font-semibold text-[#2c3628]">
                          Sanative
                        </span>
                        <span className="px-2.5 py-0.5 bg-[#5c7a52] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                          Care Partner
                        </span>
                      </div>
                      <span className="text-xs text-[#7e9a72]">
                        Labs support
                      </span>
                    </div>
                  </div>

                  <div className="h-[420px] sm:h-[480px] px-5 py-6 space-y-5 overflow-y-auto bg-[#fdfbf7]">
                    <div className="flex justify-end">
                      <div className="bg-[#5c7a52] text-white px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[85%]">
                        <p className="text-sm leading-relaxed">
                          {selectedQA.question}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <Check
                            className="w-3.5 h-3.5 text-white/60"
                            aria-hidden
                          />
                          <Check
                            className="w-3.5 h-3.5 text-white/60 -ml-2"
                            aria-hidden
                          />
                          <span className="text-[10px] text-white/60 ml-1">
                            Now
                          </span>
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
                      <span className="text-sm text-[#a8bb9e]">
                        Ask about Labs...
                      </span>
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
