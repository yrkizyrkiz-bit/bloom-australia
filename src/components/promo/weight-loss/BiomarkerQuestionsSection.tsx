"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface QuestionCard {
  question: string;
  tags: string[];
}

const questionCards: QuestionCard[] = [
  {
    question: "Why am I struggling to lose weight?",
    tags: ["Insulin", "HbA1c", "Thyroid", "Cortisol"],
  },
  {
    question: "Why am I always tired?",
    tags: ["Iron", "B12", "Vitamin D", "Thyroid"],
  },
  {
    question: "Why is my libido lower than it used to be?",
    tags: ["Testosterone", "Oestrogen", "Cortisol"],
  },
  {
    question: "Why do I keep gaining weight around my stomach?",
    tags: ["Insulin", "Cortisol", "Cholesterol"],
  },
  {
    question: "Why do I feel stressed or burnt out?",
    tags: ["Cortisol", "Magnesium", "Vitamin D"],
  },
  {
    question: "Why do I feel different in my 40s or 50s?",
    tags: ["Testosterone", "Oestrogen", "Thyroid"],
  },
];

export function BiomarkerQuestionsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f4f7f2] via-[#e6ebe3] to-[#cdd8c6]" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-[#5c7a52]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-[400px] h-[400px] bg-[#c17a58]/10 rounded-full blur-3xl" />

      {/* Floating Marker Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["TSH", "HbA1c", "Fe", "B12", "COR", "E2"].map((marker, i) => (
          <div
            key={marker}
            className="absolute w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-medium text-[#5c7a52]/60 animate-float"
            style={{
              top: `${15 + (i * 12)}%`,
              left: i % 2 === 0 ? `${5 + (i * 3)}%` : `${85 - (i * 3)}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {marker}
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-6">
            Questions{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#5c7a52] font-semibold">Biomarker</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#5c7a52]/20 -z-0" />
            </span>
            {" "}testing{" "}
            <span className="text-[#5c7a52] italic">may help answer</span>
          </h2>
          <p className="text-lg lg:text-xl text-[#5c7a52] max-w-3xl mx-auto leading-relaxed mb-4">
            Where appropriate, testing may help identify potential contributing factors — alongside clinical assessment and medical history.
          </p>
          <p className="text-sm text-[#7e9a72] max-w-2xl mx-auto">
            Testing is not required for all patients. Your doctor will recommend testing only if it may provide useful additional insight for your specific situation.
          </p>
        </div>

        {/* Question Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {questionCards.map((card, index) => (
            <div
              key={card.question}
              className={`
                group relative bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-[#e6ebe3]
                cursor-pointer transition-all duration-500 ease-out
                hover:shadow-xl hover:border-[#5c7a52]/30 hover:-translate-y-2
                ${isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                }
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Hover Gradient */}
              <div className={`
                absolute inset-0 rounded-3xl bg-gradient-to-br from-[#5c7a52]/5 to-transparent
                transition-opacity duration-300
                ${hoveredCard === index ? "opacity-100" : "opacity-0"}
              `} />

              {/* Content */}
              <div className="relative">
                {/* Question Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-5 group-hover:bg-[#5c7a52]/20 transition-colors">
                  <span className="text-lg font-serif text-[#5c7a52]">?</span>
                </div>

                {/* Question */}
                <h3 className="text-xl font-serif text-[#2c3628] mb-5 leading-snug group-hover:text-[#34412f] transition-colors">
                  {card.question}
                </h3>

                {/* Tags - reframed as "may be relevant" */}
                <p className="text-xs text-[#7e9a72] mb-2">Markers that may be relevant:</p>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#e6ebe3] text-[#5c7a52] group-hover:bg-[#5c7a52] group-hover:text-white transition-all duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow on Hover */}
                <div className={`
                  absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center
                  transition-all duration-300
                  ${hoveredCard === index ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                `}>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA - reframed */}
        <div
          className={`
            text-center transition-all duration-700 delay-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <Link
            href="/weight-management/assessment"
            className="group inline-flex items-center gap-3 btn-primary text-lg px-8 py-4"
          >
            Start your assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-xs text-[#7e9a72]">
            Your doctor will determine if testing is appropriate for your situation
          </p>
        </div>
      </div>
    </section>
  );
}
