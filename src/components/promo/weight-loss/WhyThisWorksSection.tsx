"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Brain, Dna, TrendingUp } from "lucide-react";

interface ExplanationBlock {
  icon: React.ElementType;
  title: string;
  description: string;
}

const explanations: ExplanationBlock[] = [
  {
    icon: Brain,
    title: "Understand appetite and hunger",
    description: "We look at appetite regulation, cravings and satiety to understand what may be driving overeating or difficulty maintaining results.",
  },
  {
    icon: Dna,
    title: "Personalised treatment",
    description: "Treatment is tailored based on your symptoms, health profile, medical history and progress over time, with biomarker testing used where appropriate to provide additional insight.",
  },
  {
    icon: TrendingUp,
    title: "Long-term results",
    description: "The goal is not just to lose weight — it is to help you maintain results with ongoing support and a more personalised approach.",
  },
];

export function WhyThisWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5c7a52]/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Image */}
          <div
            className={`
              relative transition-all duration-700
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
                alt="Scientific approach to wellness"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c3628]/40 via-transparent to-transparent" />

              {/* Stats Overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#7e9a72] uppercase tracking-wider">Clinical Evidence</p>
                    <p className="text-2xl font-serif text-[#2c3628]">Prescription Weight Management</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-serif text-[#5c7a52]">15%<sup className="text-sm">*</sup></p>
                    <p className="text-xs text-[#7e9a72]">avg. weight loss</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Element */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#5c7a52] rounded-full flex items-center justify-center shadow-xl">
              <div className="text-center">
                <p className="text-2xl font-serif text-white">1:1</p>
                <p className="text-[10px] text-white/80 uppercase tracking-wider">Doctor Care</p>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div
            className={`
              space-y-8 transition-all duration-700 delay-200
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-6">
                A more{" "}
                <span className="text-[#5c7a52] italic">scientific</span>{" "}
                approach to weight loss
              </h2>
              <p className="text-lg text-[#5c7a52] leading-relaxed">
                Weight management is not just about willpower. Appetite, metabolism, hormones, insulin resistance and how your body regulates hunger can all influence weight gain and long-term success.
              </p>
            </div>

            {/* Explanation Blocks */}
            <div className="space-y-6">
              {explanations.map((item, index) => (
                <div
                  key={item.title}
                  className={`
                    flex gap-5 p-5 rounded-2xl bg-[#f4f7f2] border border-[#e6ebe3]
                    transition-all duration-500 hover:bg-[#e6ebe3] hover:border-[#cdd8c6]
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  `}
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-[#5c7a52]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-[#2c3628] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[#5c7a52] text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-[#a8bb9e] italic">
              Treatment is prescribed only if appropriate following a clinical assessment. Results may vary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
