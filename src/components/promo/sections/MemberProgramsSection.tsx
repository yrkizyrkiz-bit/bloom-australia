"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Battery, Check, Signal, Wifi } from "lucide-react";
import { homeMembershipFaqs } from "@/lib/seo/home-faq";

const questionsAndAnswers = homeMembershipFaqs;

export function MemberProgramsSection() {
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
    }, 14);

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
      id="member-programs"
      className="relative scroll-mt-24 bg-white"
      style={{
        paddingTop: "clamp(3.5rem, 7vw, 5.5rem)",
      }}
      aria-labelledby="member-programs-faq-heading"
    >
      <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-start">
          <div className="lg:pt-4">
            <h2
              id="member-programs-faq-heading"
              className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] text-[#2c3628] leading-[1.08] mb-5 max-w-4xl"
            >
              Join Sanative and unlock{" "}
              <span className="text-[#5c7a52] italic">
                the best in medical care programs
              </span>
            </h2>
            <p className="text-sm font-semibold text-[#c17a58] uppercase tracking-[0.14em] mb-8">
              All your questions answered
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              {questionsAndAnswers.map((qa, index) => (
                <button
                  key={qa.question}
                  type="button"
                  onClick={() => handleQuestionClick(index)}
                  className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                    selectedIndex === index
                      ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                      : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                  }`}
                >
                  {qa.question}
                </button>
              ))}
            </div>

            <div className="mt-10 max-w-xl">
              <Link
                href="/membership/checkout"
                className="flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 rounded-full bg-[#4f6038] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3c4a27]"
              >
                Join Sanative
                <ArrowRight className="w-4 h-4" />
              </Link>
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
                        Membership support
                      </span>
                    </div>
                  </div>

                  <div className="h-[440px] sm:h-[500px] px-5 py-6 space-y-5 overflow-y-auto bg-[#fdfbf7]">
                    <div className="flex justify-end">
                      <div className="bg-[#5c7a52] text-white px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[88%]">
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
                      <div className="bg-white border border-[#e6ebe3] px-5 py-4 rounded-2xl rounded-tl-md max-w-[88%] shadow-sm">
                        <p className="text-sm text-[#2c3628] leading-relaxed whitespace-pre-line">
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
                        Ask about membership...
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
