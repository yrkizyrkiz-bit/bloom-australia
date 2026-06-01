"use client";

import { useState, useEffect } from "react";
import { Check, ArrowLeft, Signal, Wifi, Battery } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

const questionsAndAnswers: QA[] = [
  {
    question: "How does the assessment work?",
    answer: "Your Sanative doctor reviews your health history, symptoms, and goals. Where clinically appropriate, blood tests help identify factors that may be affecting your weight — such as thyroid function, metabolic markers, or hormonal balance.",
  },
  {
    question: "Is treatment guaranteed to work?",
    answer: "Results vary between individuals. Your doctor will assess whether treatment is clinically appropriate for you. If prescribed, ongoing monitoring helps your doctor adjust your plan based on your response.",
  },
  {
    question: "Are your doctors qualified?",
    answer: "Yes. All Sanative doctors are AHPRA-registered Australian medical practitioners. Your consultation is conducted via telehealth, and your doctor may recommend in-person assessment if clinically required.",
  },
  {
    question: "Is Sanative private and discreet?",
    answer: "Yes. All deliveries come in plain, unmarked packaging. Your health information is protected under Australian privacy laws and never shared without your consent.",
  },
  {
    question: "How is this different to diets?",
    answer: "Our doctors assess underlying factors that may be contributing to weight management challenges. Treatment is only prescribed where clinically appropriate, based on your individual health profile.",
  },
  {
    question: "What about side effects?",
    answer: "Your doctor will discuss potential side effects during your consultation. Ongoing clinical monitoring allows your doctor to adjust treatment as needed. Your safety is our priority.",
  },
  {
    question: "What if I'm not suitable?",
    answer: "If your Sanative doctor determines that the program is not clinically suitable for you, your first-month payment will be refunded. Treatment is only prescribed where appropriate.",
  },
];

export function ObjectionHandlingSection() {
  const [selectedIndex, setSelectedIndex] = useState(3); // Start with "Is Sanative private and discreet?"
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);

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
    }, 25); // Speed of typing - slower for better readability

    return () => clearInterval(typingInterval);
  }, [selectedIndex, selectedQA.answer]);

  const handleQuestionClick = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  return (
    <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left Column - Heading & Questions */}
          <div className="lg:pt-8">
            <p className="text-sm font-medium text-[#c17a58] uppercase tracking-wider mb-4">
              Your questions, answered
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif text-[#2c3628] leading-[1.1] mb-6">
              Doctor-led care.{" "}
              <span className="text-[#5c7a52] italic">Your questions answered.</span>
            </h2>
            <p className="text-[#5c7a52] text-lg mb-10 max-w-md leading-relaxed">
              Your Care Partner is here to support you. Here are common questions about our program.
            </p>

            {/* Question Buttons - Two Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 max-w-lg">
              {/* Row 1 */}
              <button
                onClick={() => handleQuestionClick(0)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 0
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[0].question}
              </button>
              <button
                onClick={() => handleQuestionClick(1)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 1
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[1].question}
              </button>

              {/* Row 2 */}
              <button
                onClick={() => handleQuestionClick(2)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 2
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[2].question}
              </button>
              <button
                onClick={() => handleQuestionClick(3)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 3
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[3].question}
              </button>

              {/* Row 3 */}
              <button
                onClick={() => handleQuestionClick(4)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 4
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[4].question}
              </button>
              <button
                onClick={() => handleQuestionClick(5)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 5
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[5].question}
              </button>

              {/* Row 4 - Single item */}
              <button
                onClick={() => handleQuestionClick(6)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border text-left ${
                  selectedIndex === 6
                    ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                    : "border-[#d1d9cd] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                }`}
              >
                {questionsAndAnswers[6].question}
              </button>
            </div>
          </div>

          {/* Right Column - Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[320px] sm:w-[360px] bg-[#1a1a1a] rounded-[48px] p-3 shadow-2xl">
                {/* Phone Screen */}
                <div className="bg-[#fdfbf7] rounded-[40px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-[#fdfbf7] px-8 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1a1a]">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <Signal className="w-4 h-4 text-[#1a1a1a]" />
                      <Wifi className="w-4 h-4 text-[#1a1a1a]" />
                      <Battery className="w-6 h-4 text-[#1a1a1a]" />
                    </div>
                  </div>

                  {/* Chat Header */}
                  <div className="bg-[#fdfbf7] px-5 py-4 flex items-center gap-4">
                    <button className="p-1">
                      <ArrowLeft className="w-5 h-5 text-[#5c7a52]" />
                    </button>
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

                  {/* Chat Messages */}
                  <div className="h-[420px] sm:h-[480px] px-5 py-6 space-y-5 overflow-hidden bg-[#fdfbf7]">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="bg-[#5c7a52] text-white px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[85%]">
                        <p className="text-sm leading-relaxed">{selectedQA.question}</p>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <Check className="w-3.5 h-3.5 text-white/60" />
                          <Check className="w-3.5 h-3.5 text-white/60 -ml-2" />
                          <span className="text-[10px] text-white/60 ml-1">3:00PM</span>
                        </div>
                      </div>
                    </div>

                    {/* Care Partner Response */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>

                      {/* Answer Bubble */}
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

                  {/* Message Input */}
                  <div className="bg-[#fdfbf7] px-5 py-4 border-t border-[#e6ebe3]">
                    <div className="bg-white border border-[#e6ebe3] rounded-full px-5 py-3 flex items-center">
                      <span className="text-sm text-[#a8bb9e]">Ask Sarah anything...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 -top-12 -right-12 w-40 h-40 bg-[#5c7a52]/5 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-12 -left-12 w-48 h-48 bg-[#c17a58]/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 pt-16 border-t border-[#e6ebe3]">
          <p className="text-center text-sm text-[#7e9a72] font-medium uppercase tracking-wider mb-10">
            What to expect from Sanative
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#2c3628]">AHPRA-Registered Doctors</p>
                  <p className="text-xs text-[#7e9a72]">Australian practitioners</p>
                </div>
              </div>
              <p className="text-sm text-[#5c7a52] leading-relaxed">
                All consultations are conducted by AHPRA-registered Australian doctors who assess your individual health profile before recommending any treatment.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#2c3628]">Discreet & Confidential</p>
                  <p className="text-xs text-[#7e9a72]">Privacy protected</p>
                </div>
              </div>
              <p className="text-sm text-[#5c7a52] leading-relaxed">
                Plain, unmarked packaging for all deliveries. Your health information is protected under Australian privacy laws and stored securely.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#2c3628]">Ongoing Clinical Support</p>
                  <p className="text-xs text-[#7e9a72]">Care Partner included</p>
                </div>
              </div>
              <p className="text-sm text-[#5c7a52] leading-relaxed">
                Regular check-ins with your Care Partner and clinical team. Your doctor monitors your progress and adjusts your plan as needed.
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-[#7e9a72] mt-8">
            Individual results vary. Treatment is only prescribed where clinically appropriate.
          </p>
        </div>
      </div>
    </section>
  );
}
