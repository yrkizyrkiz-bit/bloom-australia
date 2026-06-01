"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface QuestionCard {
  id: number;
  question: string;
  description: string;
  image: string;
  biomarker: {
    name: string;
    range: string;
    value: string;
    unit: string;
    status: "normal" | "outside";
  };
  link: string;
}

const questions: QuestionCard[] = [
  {
    id: 1,
    question: "Why can't I lose weight despite my efforts?",
    description: "Hormone imbalances, thyroid function, or metabolic markers may be affecting your progress. Our tests identify the underlying causes.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80",
    biomarker: {
      name: "TSH",
      range: "0.4 - 4.0",
      value: "5.2",
      unit: "mIU/L",
      status: "outside",
    },
    link: "/biomarker-intake?concern=weight-loss",
  },
  {
    id: 2,
    question: "Why am I always exhausted?",
    description: "Iron deficiency, vitamin D levels, or thyroid imbalance could be the culprit. Our panel screens for these so you can take action.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    biomarker: {
      name: "Ferritin",
      range: "20 - 200",
      value: "12",
      unit: "ng/mL",
      status: "outside",
    },
    link: "/biomarker-intake?concern=fatigue",
  },
  {
    id: 3,
    question: "Is menopause affecting my health?",
    description: "Hormone fluctuations impact everything from mood to metabolism. Track your oestrogen, progesterone, and FSH levels.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80",
    biomarker: {
      name: "FSH",
      range: "3 - 20",
      value: "45",
      unit: "mIU/mL",
      status: "outside",
    },
    link: "/biomarker-intake?concern=menopause",
  },
  {
    id: 4,
    question: "Why is my hair thinning?",
    description: "Nutrient deficiencies, hormones, or thyroid issues may be affecting hair health. Our tests reveal the root cause.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80",
    biomarker: {
      name: "Vitamin D",
      range: "> 50",
      value: "28",
      unit: "nmol/L",
      status: "outside",
    },
    link: "/biomarker-intake?concern=hair-loss",
  },
];

// Simplified biomarker list for honeycomb
const biomarkerNames = [
  "LDL", "HDL", "TC", "TG", "ApoB", "hsCRP",
  "HbA1c", "Gluc", "Ins", "TSH", "fT4", "fT3", "COR",
  "DHEA", "E2", "Prog", "TT", "FSH", "VitD", "B12",
  "Fol", "Fe", "Fer", "Mg", "Zn", "Se", "Cu",
  "ALT", "AST", "GGT", "ALP", "Bil", "Alb", "Crea",
  "eGFR", "WBC", "RBC", "Hgb", "Hct", "Plt", "ESR",
  "Hcy", "UA", "LH", "SHBG", "IGF", "DHEA", "PSA",
];

// Animation configurations for each card
const cardAnimations = [
  { x: -30, y: 50, rotate: -4, delay: 0 },
  { x: 30, y: 40, rotate: 3, delay: 100 },
  { x: -25, y: 60, rotate: -3, delay: 200 },
  { x: 35, y: 45, rotate: 4, delay: 300 },
];

export function QuestionsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [sectionVisible, setSectionVisible] = useState(false);

  // Set up intersection observer for the section (honeycomb animation)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setSectionVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      }
    );

    sectionObserver.observe(section);

    return () => {
      sectionObserver.disconnect();
    };
  }, []);

  // Set up intersection observer for individual cards
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => new Set([...prev, index]));
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: "-50px",
        }
      );

      observer.observe(card);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Ref callback for cards
  const setCardRef = useCallback((el: HTMLAnchorElement | null, index: number) => {
    cardRefs.current[index] = el;
  }, []);

  // Get card animation style based on visibility
  const getCardStyle = (index: number) => {
    const isVisible = visibleCards.has(index);
    const config = cardAnimations[index];

    if (!isVisible) {
      return {
        opacity: 0,
        transform: `translate(${config.x}px, ${config.y}px) rotate(${config.rotate}deg) scale(0.9)`,
        transition: "none",
      };
    }

    return {
      opacity: 1,
      transform: "translate(0, 0) rotate(0deg) scale(1)",
      transition: `opacity 0.6s ease-out ${config.delay}ms, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${config.delay}ms`,
    };
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-12 lg:py-20 overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f4f7f2] via-[#e8ede5] to-[#dce4d6]" />

      {/* Honeycomb Background - Faded with CSS animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1200px] opacity-[0.06] transition-transform duration-1000 ease-out ${
            sectionVisible ? "scale-100" : "scale-95"
          }`}
        >
          {/* Generate honeycomb pattern */}
          <div className="flex flex-col items-center gap-1">
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex gap-1 justify-center"
                style={{
                  marginLeft: rowIndex % 2 === 1 ? "36px" : "0",
                }}
              >
                {biomarkerNames.slice(rowIndex * 7, rowIndex * 7 + 8).map((name, i) => (
                  <div
                    key={`${rowIndex}-${i}`}
                    className="w-16 h-[72px] flex items-center justify-center text-xs font-medium"
                    style={{
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: "linear-gradient(135deg, #34412f 0%, #5c7a52 100%)",
                    }}
                  >
                    <span className="text-white/90">{name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Blurs */}
      <div className="absolute top-10 left-10 w-[600px] h-[600px] bg-[#7e9a72]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#c17a58]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#e6ebe3]/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-24">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
            Questions we could
            <br />
            <span className="text-[#5c7a52] italic">help with</span>
          </h2>
          <p className="mt-6 text-lg lg:text-xl text-[#5c7a52] max-w-2xl mx-auto">
            Uncover what&apos;s really happening inside your body with our comprehensive biomarker testing.
          </p>
        </div>

        {/* Floating Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {questions.map((card, index) => (
            <Link
              key={card.id}
              ref={(el) => setCardRef(el, index)}
              href={card.link}
              className="group relative block rounded-[28px] overflow-hidden shadow-xl hover:shadow-2xl will-change-transform"
              style={getCardStyle(index)}
            >
              {/* Card Image */}
              <div className="relative h-[340px] lg:h-[400px]">
                <Image
                  src={card.image}
                  alt={card.question}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                {/* Gradient Overlay - Lightened */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f17]/60 via-[#2c3628]/15 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 lg:p-8 flex flex-col justify-between">
                  {/* Question */}
                  <h3 className="text-xl lg:text-2xl font-serif text-white leading-snug drop-shadow-lg">
                    &ldquo;{card.question}&rdquo;
                  </h3>

                  {/* Description & Biomarker */}
                  <div className="space-y-4">
                    <p className="text-sm text-white/85 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Biomarker Badge - Styled like Ahead Health */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-[1.02]">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#2c3628]">
                            {card.biomarker.name}
                          </span>
                          <span className="text-xs text-[#7e9a72]">
                            {card.biomarker.range}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            card.biomarker.status === "outside"
                              ? "bg-[#c17a58]/15 text-[#c17a58]"
                              : "bg-[#7e9a72]/15 text-[#5c7a52]"
                          }`}>
                            {card.biomarker.status === "outside" ? "Outside range" : "Normal range"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#2c3628]">
                            {card.biomarker.value}
                          </span>
                          <span className="text-xs text-[#7e9a72]">
                            {card.biomarker.unit}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-[#f4f7f2] border-t border-[#e6ebe3]">
                        <span className="text-xs text-[#5c7a52] group-hover:text-[#c17a58] transition-colors flex items-center gap-1">
                          View details
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[#5c7a52] mb-6 text-lg">
            Our comprehensive panel tests 80+ biomarkers to give you the complete picture.
          </p>
          <Link
            href="/labs"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4"
          >
            Find out what&apos;s behind your symptoms — start with a lab test
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
