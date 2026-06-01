"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X, AlertCircle } from "lucide-react";

const questionCards = [
  {
    id: "weight",
    question: "Why can't I lose weight?",
    description: "Uncover metabolic, hormonal, and inflammatory factors affecting your weight",
    image: "https://ext.same-assets.com/1389255586/2658080352.jpeg",
    color: "from-[#5c7a52] to-[#3d4f38]",
    requiresBiomarker: true,
    category: "weight-loss",
  },
  {
    id: "tired",
    question: "Why am I always tired?",
    description: "Test for thyroid, iron, vitamin D, and other energy-related biomarkers",
    image: "https://ext.same-assets.com/1389255586/4248760039.jpeg",
    color: "from-[#7e9a72] to-[#5c7a52]",
    requiresBiomarker: true,
    category: "fatigue",
  },
  {
    id: "hormones",
    question: "Are my hormones balanced?",
    description: "Comprehensive hormone panel for women at every life stage",
    image: "https://ext.same-assets.com/1389255586/754957936.jpeg",
    color: "from-[#c17a58] to-[#a9634a]",
    requiresBiomarker: true,
    category: "hormones",
  },
  {
    id: "hair",
    question: "Why is my hair thinning?",
    description: "Identify nutritional deficiencies and hormonal imbalances affecting hair",
    image: "https://ext.same-assets.com/1389255586/3446480003.jpeg",
    color: "from-[#a8bb9e] to-[#7e9a72]",
    requiresBiomarker: true,
    category: "hair-loss",
  },
  {
    id: "stress",
    question: "Is stress affecting my health?",
    description: "Measure cortisol and inflammation markers to understand stress impact",
    image: "https://ext.same-assets.com/1389255586/1229818892.jpeg",
    color: "from-[#34412f] to-[#2c3628]",
    requiresBiomarker: true,
    category: "stress",
  },
  {
    id: "aging",
    question: "How is my body ageing?",
    description: "Advanced biomarker panel to track biological age and longevity markers",
    image: "https://ext.same-assets.com/1389255586/2770872326.jpeg",
    color: "from-[#5c7a52] to-[#4a6243]",
    requiresBiomarker: true,
    category: "aging",
  },
];

export function QuestionCardsHero() {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCardClick = (card: typeof questionCards[0]) => {
    if (card.requiresBiomarker && (card.category === "weight-loss" || card.category === "hormones")) {
      setSelectedCategory(card.category);
      setShowTriageModal(true);
    } else if (card.requiresBiomarker) {
      window.location.href = `/biomarker-intake?concern=${card.category}`;
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#f4f7f2] via-[#fdfbf7] to-white py-16 lg:py-24">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#cdd8c6] rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e5d7bf] rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#e6ebe3] text-[#5c7a52] text-sm font-medium mb-4">
            Biomarker-First Approach
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#2c3628] leading-tight">
            What question do you
            <br />
            <span className="text-gradient italic">want answered?</span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-[#5c7a52] max-w-2xl mx-auto">
            Every health journey starts with understanding. Select your concern and we&apos;ll guide you to the right diagnostic pathway.
          </p>
        </div>

        {/* Question Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {questionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              className="group relative rounded-3xl overflow-hidden text-left transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={card.image}
                  alt={card.question}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${card.color} opacity-80`} />
              </div>

              {/* Content */}
              <div className="relative p-6 lg:p-8 min-h-[280px] lg:min-h-[320px] flex flex-col justify-end">
                <h3 className="text-2xl lg:text-3xl font-serif text-white leading-tight mb-3">
                  {card.question}
                </h3>
                <p className="text-white/80 text-sm lg:text-base mb-4">
                  {card.description}
                </p>
                <div className="flex items-center gap-2 text-white font-medium">
                  <span className="text-sm">Start with biomarkers</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-[#5c7a52] mb-4">Not sure where to start?</p>
          <Link
            href="/biomarker-intake"
            className="btn-primary inline-flex items-center gap-2"
          >
            Take our comprehensive health assessment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Triage Modal */}
      {showTriageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-fade-in">
            <button
              type="button"
              onClick={() => setShowTriageModal(false)}
              className="absolute top-4 right-4 p-2 text-[#5c7a52] hover:bg-[#e6ebe3] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#c17a58]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#c17a58]" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                  Clinical Safety First
                </h3>
                <p className="text-[#5c7a52] text-sm leading-relaxed">
                  To ensure clinical safety, we require a <strong>Biomarker Audit</strong> before prescribing any treatments for{" "}
                  {selectedCategory === "weight-loss" ? "weight loss" : "hormone-related concerns"}.
                </p>
              </div>
            </div>

            <div className="bg-[#f4f7f2] rounded-2xl p-5 mb-6">
              <h4 className="font-medium text-[#2c3628] mb-3">Why biomarkers first?</h4>
              <ul className="space-y-2 text-sm text-[#5c7a52]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Identify underlying conditions that may affect treatment
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Ensure medications are safe for your specific health profile
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Create a baseline to track your progress over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Personalise your treatment plan based on your unique biology
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href={`/biomarker-intake?concern=${selectedCategory}`}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Start your diagnostic journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowTriageModal(false)}
                className="w-full py-3 text-[#5c7a52] hover:text-[#34412f] transition-colors text-sm"
              >
                I&apos;ll come back later
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
